"""Inventory tracking and order skew logic.

Prevents the bot from accumulating too much of one side by adjusting
spreads based on current inventory ratio vs target.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone

logger = logging.getLogger("pmm")


@dataclass
class InventoryState:
    base_available: float = 0.0
    base_blocked: float = 0.0
    quote_available: float = 0.0
    quote_blocked: float = 0.0
    mid_price: float = 0.0

    @property
    def base_total(self) -> float:
        return self.base_available + self.base_blocked

    @property
    def quote_total(self) -> float:
        return self.quote_available + self.quote_blocked

    @property
    def base_value_in_quote(self) -> float:
        return self.base_total * self.mid_price if self.mid_price > 0 else 0.0

    @property
    def total_value_in_quote(self) -> float:
        return self.base_value_in_quote + self.quote_total

    @property
    def base_ratio(self) -> float:
        """Fraction of total portfolio held in base currency (0.0 to 1.0)."""
        total = self.total_value_in_quote
        if total <= 0:
            return 0.5
        return self.base_value_in_quote / total


@dataclass
class PnLTracker:
    """Tracks realized P&L from executed trades.

    Only counts actual fills (sell revenue minus buy cost) so that
    unrealized mark-to-market swings on held inventory do not trigger
    the daily loss limit.
    """

    start_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    realized_pnl_quote: float = 0.0
    realized_fees_quote: float = 0.0
    trade_count: int = 0
    _processed_trade_ids: set = field(default_factory=set)

    def process_trades(self, trades: list) -> None:
        """Ingest new trades from the exchange and update realized P&L.

        Accepts the raw list returned by ``LatokenWrapper.get_user_trades``.
        Trades already seen (by id) are skipped automatically.
        """
        for trade in trades:
            trade_id = str(trade.get("id", ""))
            if not trade_id or trade_id in self._processed_trade_ids:
                continue

            self._processed_trade_ids.add(trade_id)

            raw_side = (trade.get("side") or trade.get("direction") or "").upper()
            if "SELL" in raw_side:
                side = "SELL"
            elif "BUY" in raw_side:
                side = "BUY"
            else:
                side = ""

            price = float(trade.get("price", 0))
            quantity = float(trade.get("quantity", 0))
            cost = float(trade.get("cost", 0)) or (price * quantity)
            fee = float(trade.get("fee", 0))

            if side == "SELL":
                self.realized_pnl_quote += cost - fee
            elif side == "BUY":
                self.realized_pnl_quote -= cost + fee
            else:
                logger.warning("Unknown trade side %r for trade %s", side, trade_id)
                continue

            self.realized_fees_quote += fee
            self.trade_count += 1

    def get_realized_pnl(self) -> float:
        """Net quote-currency profit/loss from executed trades."""
        return self.realized_pnl_quote

    def reset(self) -> None:
        self.start_time = datetime.now(timezone.utc)
        self.realized_pnl_quote = 0.0
        self.realized_fees_quote = 0.0
        self.trade_count = 0
        self._processed_trade_ids.clear()


def compute_skewed_spreads(
    base_bid_spread: float,
    base_ask_spread: float,
    inventory_ratio: float,
    target_ratio: float,
    skew_factor: float,
) -> tuple:
    """Adjust bid/ask spreads based on inventory imbalance.

    When holding too much base (ratio > target), widen the bid spread
    (less eager to buy) and tighten the ask spread (more eager to sell).
    Vice versa when holding too little base.

    Returns (adjusted_bid_spread, adjusted_ask_spread).
    """
    imbalance = inventory_ratio - target_ratio

    bid_adjustment = skew_factor * imbalance
    ask_adjustment = -skew_factor * imbalance

    adjusted_bid = base_bid_spread + bid_adjustment
    adjusted_ask = base_ask_spread + ask_adjustment

    adjusted_bid = max(adjusted_bid, 0.001)
    adjusted_ask = max(adjusted_ask, 0.001)

    return adjusted_bid, adjusted_ask


def compute_order_sizes(
    base_amount: float,
    inventory_state: InventoryState,
    mid_price: float,
) -> tuple:
    """Compute buy and sell order sizes constrained by available balances.

    Returns (buy_quantity, sell_quantity) in base currency units.
    """
    max_buy_base = inventory_state.quote_available / mid_price if mid_price > 0 else 0.0
    max_sell_base = inventory_state.base_available

    buy_qty = min(base_amount, max_buy_base * 0.95)
    sell_qty = min(base_amount, max_sell_base * 0.95)

    buy_qty = max(buy_qty, 0.0)
    sell_qty = max(sell_qty, 0.0)

    return buy_qty, sell_qty
