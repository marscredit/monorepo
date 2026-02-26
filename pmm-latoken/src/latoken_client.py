"""Thin wrapper around the LATOKEN API v2 for market making operations."""

import logging
from dataclasses import dataclass
from time import time
from typing import Dict, List, Optional, Tuple

from latoken.client import LatokenClient

from .config import Config

logger = logging.getLogger("pmm")


@dataclass
class OrderbookLevel:
    price: float
    quantity: float


@dataclass
class Orderbook:
    asks: List[OrderbookLevel]
    bids: List[OrderbookLevel]

    @property
    def best_ask(self) -> Optional[float]:
        return self.asks[0].price if self.asks else None

    @property
    def best_bid(self) -> Optional[float]:
        return self.bids[0].price if self.bids else None

    @property
    def mid_price(self) -> Optional[float]:
        if self.best_ask is not None and self.best_bid is not None:
            return (self.best_ask + self.best_bid) / 2
        return None

    @property
    def spread_pct(self) -> Optional[float]:
        if self.best_ask and self.best_bid and self.mid_price:
            return (self.best_ask - self.best_bid) / self.mid_price
        return None


@dataclass
class Balance:
    currency_id: str
    available: float
    blocked: float

    @property
    def total(self) -> float:
        return self.available + self.blocked


@dataclass
class OrderResult:
    order_id: str
    status: str
    message: str
    success: bool


class LatokenWrapper:
    """Wraps the official LATOKEN client with typed helpers for PMM operations."""

    def __init__(self, config: Config):
        self._client = LatokenClient(
            apiKey=config.api_key,
            apiSecret=config.api_secret.encode("ascii"),
        )
        self._config = config
        self._currency_ids: Dict[str, str] = {}
        self._pair_info: Optional[dict] = None

    def initialize(self) -> None:
        """Fetch currency IDs and pair metadata. Call once at startup."""
        logger.info("Fetching currency list from LATOKEN...")
        currencies = self._client.getCurrencies()
        for c in currencies:
            if c.get("status") == "CURRENCY_STATUS_ACTIVE":
                self._currency_ids[c["tag"]] = c["id"]

        base_tag = self._config.base_currency
        quote_tag = self._config.quote_currency
        if base_tag not in self._currency_ids:
            raise ValueError(f"Currency {base_tag} not found on LATOKEN")
        if quote_tag not in self._currency_ids:
            raise ValueError(f"Currency {quote_tag} not found on LATOKEN")

        logger.info(
            f"Resolved {base_tag}={self._currency_ids[base_tag]}, "
            f"{quote_tag}={self._currency_ids[quote_tag]}"
        )

        pairs = self._client.getActivePairs()
        base_id = self._currency_ids[base_tag]
        quote_id = self._currency_ids[quote_tag]
        for p in pairs:
            if p["baseCurrency"] == base_id and p["quoteCurrency"] == quote_id:
                self._pair_info = p
                break

        if not self._pair_info:
            raise ValueError(f"Pair {base_tag}/{quote_tag} not found on LATOKEN")

        logger.info(
            f"Pair {base_tag}/{quote_tag}: priceTick={self._pair_info['priceTick']}, "
            f"quantityTick={self._pair_info['quantityTick']}, "
            f"priceDecimals={self._pair_info['priceDecimals']}, "
            f"quantityDecimals={self._pair_info['quantityDecimals']}"
        )

    @property
    def base_id(self) -> str:
        return self._currency_ids[self._config.base_currency]

    @property
    def quote_id(self) -> str:
        return self._currency_ids[self._config.quote_currency]

    @property
    def price_decimals(self) -> int:
        return int(self._pair_info["priceDecimals"]) if self._pair_info else 8

    @property
    def quantity_decimals(self) -> int:
        return int(self._pair_info["quantityDecimals"]) if self._pair_info else 2

    def get_orderbook(self, limit: int = 20) -> Orderbook:
        raw = self._client.getOrderbook(pair=self._config.pair, limit=limit)
        asks = [
            OrderbookLevel(price=float(a["price"]), quantity=float(a["quantity"]))
            for a in raw.get("ask", [])
        ]
        bids = [
            OrderbookLevel(price=float(b["price"]), quantity=float(b["quantity"]))
            for b in raw.get("bid", [])
        ]
        return Orderbook(asks=asks, bids=bids)

    def get_balances(self) -> Tuple[Balance, Balance]:
        """Returns (base_balance, quote_balance) for the spot account."""
        base_raw = self._client.getAccountBalances(
            currency=self.base_id, account_type="ACCOUNT_TYPE_SPOT"
        )
        quote_raw = self._client.getAccountBalances(
            currency=self.quote_id, account_type="ACCOUNT_TYPE_SPOT"
        )
        base = Balance(
            currency_id=self.base_id,
            available=float(base_raw.get("available", 0)),
            blocked=float(base_raw.get("blocked", 0)),
        )
        quote = Balance(
            currency_id=self.quote_id,
            available=float(quote_raw.get("available", 0)),
            blocked=float(quote_raw.get("blocked", 0)),
        )
        return base, quote

    def get_ticker_price(self) -> Optional[float]:
        ticker = self._client.getTickers(pair=self._config.pair)
        if isinstance(ticker, dict) and "lastPrice" in ticker:
            price = float(ticker["lastPrice"])
            return price if price > 0 else None
        return None

    def place_limit_order(self, side: str, price: float, quantity: float) -> OrderResult:
        rounded_price = round(price, self.price_decimals)
        rounded_qty = round(quantity, self.quantity_decimals)

        if rounded_price <= 0 or rounded_qty <= 0:
            return OrderResult(
                order_id="", status="REJECTED", message="Invalid price or quantity", success=False
            )

        result = self._client.placeOrder(
            pair=self._config.pair,
            side=side.upper(),
            client_message=f"pmm-{side.lower()}-{int(time())}",
            price=rounded_price,
            quantity=rounded_qty,
            timestamp=int(time() * 1000),
            condition="GOOD_TILL_CANCELLED",
            order_type="LIMIT",
        )

        success = result.get("status") == "SUCCESS"
        return OrderResult(
            order_id=result.get("id", ""),
            status=result.get("status", "UNKNOWN"),
            message=result.get("message", ""),
            success=success,
        )

    def cancel_pair_orders(self) -> dict:
        return self._client.cancelOrder(pair=self._config.pair)

    def cancel_order(self, order_id: str) -> dict:
        return self._client.cancelOrder(order_id=order_id)

    def get_active_orders(self) -> list:
        result = self._client.getOrders(pair=self._config.pair, active=True)
        if isinstance(result, list):
            return result
        return []

    def get_user_trades(self, limit: int = 50) -> list:
        result = self._client.getTrades(pair=self._config.pair, user=True, limit=limit)
        if isinstance(result, list):
            return result
        return []

    def get_fee_scheme(self) -> dict:
        return self._client.getFeeScheme(pair=self._config.pair, user=True)
