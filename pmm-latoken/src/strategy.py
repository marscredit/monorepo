"""Pure Market Making strategy for LATOKEN.

Places symmetric limit orders around the mid price, adjusting
spreads based on inventory and refreshing on a configurable interval.
"""

import logging
import random
import signal
import time as time_mod
from typing import List, Optional

from .config import Config
from .inventory import (
    InventoryState,
    PnLTracker,
    compute_order_sizes,
    compute_skewed_spreads,
)
from .latoken_client import LatokenWrapper, OrderResult
from .logger import log_event

logger = logging.getLogger("pmm")


class PMMStrategy:
    def __init__(self, config: Config, client: LatokenWrapper):
        self._config = config
        self._client = client
        self._running = False
        self._active_order_ids: List[str] = []
        self._pnl = PnLTracker()
        self._last_mid_price: float = 0.0
        self._cycle_count = 0
        self._last_volume_trade_time: float = 0.0

    def start(self) -> None:
        """Initialize and enter the main trading loop."""
        self._running = True
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)

        log_event(logger, "INFO", "Starting PMM strategy", pair=self._config.pair)

        self._client.initialize()
        self._log_fee_info()
        self._snapshot_starting_value()

        log_event(
            logger,
            "INFO",
            "Strategy initialized",
            bid_spread=self._config.bid_spread,
            ask_spread=self._config.ask_spread,
            order_amount=self._config.order_amount,
            refresh_seconds=self._config.order_refresh_seconds,
            min_spread=self._config.min_spread,
        )

        while self._running:
            try:
                self._run_cycle()
            except KeyboardInterrupt:
                self._handle_shutdown(None, None)
                break
            except Exception:
                logger.exception("Error in trading cycle")
                time_mod.sleep(5)

            if self._running:
                time_mod.sleep(self._config.order_refresh_seconds)

    def _run_cycle(self) -> None:
        self._cycle_count += 1

        self._cancel_existing_orders()

        mid_price = self._get_mid_price()
        if mid_price is None or mid_price <= 0:
            log_event(logger, "WARNING", "No valid mid price available, skipping cycle")
            return

        self._last_mid_price = mid_price

        inventory = self._get_inventory(mid_price)
        if not self._check_safety(inventory, mid_price):
            return

        bid_spread, ask_spread = compute_skewed_spreads(
            base_bid_spread=self._config.bid_spread,
            base_ask_spread=self._config.ask_spread,
            inventory_ratio=inventory.base_ratio,
            target_ratio=self._config.inventory_target_ratio,
            skew_factor=self._config.inventory_skew_factor,
        )

        bid_spread = max(bid_spread, self._config.min_spread / 2)
        ask_spread = max(ask_spread, self._config.min_spread / 2)

        bid_price = mid_price * (1 - bid_spread)
        ask_price = mid_price * (1 + ask_spread)

        if self._config.min_sell_price > 0:
            ask_price = max(ask_price, self._config.min_sell_price)
        if self._config.min_buy_price > 0:
            bid_price = min(bid_price, self._config.min_buy_price)

        buy_qty, sell_qty = compute_order_sizes(
            base_amount=self._config.order_amount,
            inventory_state=inventory,
            mid_price=mid_price,
        )

        self._active_order_ids.clear()

        if buy_qty > 0:
            result = self._client.place_limit_order("BUY", bid_price, buy_qty)
            self._log_order("BUY", bid_price, buy_qty, result)
            if result.success:
                self._active_order_ids.append(result.order_id)

        if sell_qty > 0:
            result = self._client.place_limit_order("SELL", ask_price, sell_qty)
            self._log_order("SELL", ask_price, sell_qty, result)
            if result.success:
                self._active_order_ids.append(result.order_id)

        self._maybe_volume_trade(mid_price, inventory)

        if self._cycle_count % 10 == 0:
            self._log_status(inventory, mid_price, bid_spread, ask_spread)

    def _get_mid_price(self) -> Optional[float]:
        book = self._client.get_orderbook(limit=5)

        if book.mid_price is not None and book.mid_price > 0:
            return book.mid_price

        ticker_price = self._client.get_ticker_price()
        if ticker_price is not None and ticker_price > 0:
            return ticker_price

        if self._last_mid_price > 0:
            log_event(logger, "WARNING", "Using last known mid price", price=self._last_mid_price)
            return self._last_mid_price

        if self._config.seed_price > 0:
            log_event(logger, "WARNING", "Using seed price", price=self._config.seed_price)
            return self._config.seed_price

        return None

    def _get_inventory(self, mid_price: float) -> InventoryState:
        base_bal, quote_bal = self._client.get_balances()
        return InventoryState(
            base_available=base_bal.available,
            base_blocked=base_bal.blocked,
            quote_available=quote_bal.available,
            quote_blocked=quote_bal.blocked,
            mid_price=mid_price,
        )

    def _check_safety(self, inventory: InventoryState, mid_price: float) -> bool:
        if inventory.total_value_in_quote > self._config.max_position_usdt:
            log_event(
                logger,
                "WARNING",
                "Max position exceeded, skipping cycle",
                total_value=round(inventory.total_value_in_quote, 2),
                limit=self._config.max_position_usdt,
            )
            return False

        daily_pnl = self._pnl.estimate_daily_pnl(inventory.total_value_in_quote)
        if daily_pnl < -self._config.daily_loss_limit_usdt:
            log_event(
                logger,
                "ERROR",
                "Daily loss limit hit, stopping strategy",
                daily_pnl=round(daily_pnl, 2),
                limit=self._config.daily_loss_limit_usdt,
            )
            self._cancel_existing_orders()
            self._running = False
            return False

        return True

    def _maybe_volume_trade(self, mid_price: float, inventory: InventoryState) -> None:
        """Periodically execute a small trade to generate visible volume."""
        interval = self._config.volume_trade_interval_seconds
        if interval <= 0 or self._config.volume_trade_amount_usdt <= 0:
            return

        now = time_mod.time()
        if now - self._last_volume_trade_time < interval:
            return

        self._last_volume_trade_time = now
        amount_usdt = self._config.volume_trade_amount_usdt

        jitter = random.uniform(0.8, 1.2)
        amount_usdt *= jitter

        book = self._client.get_orderbook(limit=5)

        min_sell = self._config.min_sell_price

        can_buy = (book.best_ask and inventory.quote_available > amount_usdt)
        can_sell = (book.best_bid and inventory.base_available * mid_price > amount_usdt
                    and (min_sell <= 0 or book.best_bid >= min_sell))

        do_buy = random.random() < 0.5
        if do_buy and can_buy:
            qty = amount_usdt / book.best_ask
            qty = round(qty, self._client.quantity_decimals)
            if qty > 0:
                result = self._client.place_limit_order("BUY", book.best_ask, qty)
                log_event(
                    logger, "INFO", "Volume trade BUY",
                    price=round(book.best_ask, 8),
                    quantity=round(qty, 4),
                    cost_usdt=round(book.best_ask * qty, 4),
                    status=result.status,
                )
        elif can_sell:
            qty = amount_usdt / book.best_bid
            qty = round(qty, self._client.quantity_decimals)
            if qty > 0:
                result = self._client.place_limit_order("SELL", book.best_bid, qty)
                log_event(
                    logger, "INFO", "Volume trade SELL",
                    price=round(book.best_bid, 8),
                    quantity=round(qty, 4),
                    cost_usdt=round(book.best_bid * qty, 4),
                    status=result.status,
                )
        elif can_buy:
            qty = amount_usdt / book.best_ask
            qty = round(qty, self._client.quantity_decimals)
            if qty > 0:
                result = self._client.place_limit_order("BUY", book.best_ask, qty)
                log_event(
                    logger, "INFO", "Volume trade BUY",
                    price=round(book.best_ask, 8),
                    quantity=round(qty, 4),
                    cost_usdt=round(book.best_ask * qty, 4),
                    status=result.status,
                )

    def _cancel_existing_orders(self) -> None:
        try:
            self._client.cancel_pair_orders()
        except Exception:
            logger.exception("Failed to cancel orders")
        self._active_order_ids.clear()

    def _log_order(self, side: str, price: float, qty: float, result: OrderResult) -> None:
        level = "INFO" if result.success else "WARNING"
        log_event(
            logger,
            level,
            f"Order {side}",
            price=round(price, 8),
            quantity=round(qty, 4),
            order_id=result.order_id,
            status=result.status,
            detail=result.message,
        )

    def _log_status(self, inventory: InventoryState, mid_price: float, bid_spread: float, ask_spread: float) -> None:
        daily_pnl = self._pnl.estimate_daily_pnl(inventory.total_value_in_quote)
        log_event(
            logger,
            "INFO",
            "Status",
            cycle=self._cycle_count,
            mid_price=round(mid_price, 8),
            bid_spread=round(bid_spread, 4),
            ask_spread=round(ask_spread, 4),
            base_total=round(inventory.base_total, 4),
            quote_total=round(inventory.quote_total, 4),
            base_ratio=round(inventory.base_ratio, 4),
            total_value_usdt=round(inventory.total_value_in_quote, 2),
            daily_pnl=round(daily_pnl, 2),
        )

    def _log_fee_info(self) -> None:
        try:
            fees = self._client.get_fee_scheme()
            log_event(
                logger,
                "INFO",
                "Fee scheme",
                maker_fee=fees.get("makerFee"),
                taker_fee=fees.get("takerFee"),
                fee_type=fees.get("type"),
            )
        except Exception:
            logger.exception("Could not fetch fee info")

    def _snapshot_starting_value(self) -> None:
        try:
            mid = self._get_mid_price()
            if mid and mid > 0:
                inventory = self._get_inventory(mid)
                self._pnl.start_value_quote = inventory.total_value_in_quote
                log_event(
                    logger,
                    "INFO",
                    "Starting portfolio snapshot",
                    value_usdt=round(inventory.total_value_in_quote, 2),
                    base_balance=round(inventory.base_total, 4),
                    quote_balance=round(inventory.quote_total, 4),
                )
        except Exception:
            logger.exception("Could not snapshot starting value")

    def _handle_shutdown(self, signum, frame) -> None:
        log_event(logger, "INFO", "Shutdown signal received, cancelling orders...")
        self._running = False
        try:
            self._cancel_existing_orders()
        except Exception:
            logger.exception("Error during shutdown cleanup")
        log_event(logger, "INFO", "PMM strategy stopped")
