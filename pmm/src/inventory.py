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
    """Tracks realized P&L from fills within a trading day."""

    start_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    start_value_quote: float = 0.0
    realized_fees_quote: float = 0.0
    trade_count: int = 0

    def estimate_daily_pnl(self, current_value_quote: float) -> float:
        return current_value_quote - self.start_value_quote

    def reset(self, current_value_quote: float) -> None:
        self.start_time = datetime.now(timezone.utc)
        self.start_value_quote = current_value_quote
        self.realized_fees_quote = 0.0
        self.trade_count = 0


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
