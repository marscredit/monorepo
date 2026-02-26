"""Tests for inventory state and P&L tracking."""

import unittest
from datetime import datetime, timezone

from src.inventory import InventoryState, PnLTracker


class TestInventoryState(unittest.TestCase):
    def test_base_ratio_balanced(self):
        state = InventoryState(
            base_available=1000,
            base_blocked=0,
            quote_available=10,
            quote_blocked=0,
            mid_price=0.01,
        )
        self.assertAlmostEqual(state.base_ratio, 0.5, places=2)

    def test_base_ratio_all_base(self):
        state = InventoryState(
            base_available=1000,
            base_blocked=0,
            quote_available=0,
            quote_blocked=0,
            mid_price=0.01,
        )
        self.assertAlmostEqual(state.base_ratio, 1.0, places=2)

    def test_base_ratio_all_quote(self):
        state = InventoryState(
            base_available=0,
            base_blocked=0,
            quote_available=100,
            quote_blocked=0,
            mid_price=0.01,
        )
        self.assertAlmostEqual(state.base_ratio, 0.0, places=2)

    def test_base_ratio_zero_price_returns_default(self):
        state = InventoryState(
            base_available=1000,
            base_blocked=0,
            quote_available=100,
            quote_blocked=0,
            mid_price=0,
        )
        self.assertAlmostEqual(state.base_ratio, 0.0, places=2)

    def test_total_value(self):
        state = InventoryState(
            base_available=1000,
            base_blocked=500,
            quote_available=20,
            quote_blocked=5,
            mid_price=0.01,
        )
        expected = (1500 * 0.01) + 25
        self.assertAlmostEqual(state.total_value_in_quote, expected, places=4)

    def test_base_total_includes_blocked(self):
        state = InventoryState(
            base_available=100,
            base_blocked=50,
            quote_available=0,
            quote_blocked=0,
            mid_price=1.0,
        )
        self.assertEqual(state.base_total, 150)

    def test_empty_inventory_defaults(self):
        state = InventoryState()
        self.assertEqual(state.base_ratio, 0.5)
        self.assertEqual(state.total_value_in_quote, 0.0)


class TestPnLTracker(unittest.TestCase):
    def test_pnl_positive(self):
        tracker = PnLTracker(start_value_quote=100.0)
        pnl = tracker.estimate_daily_pnl(110.0)
        self.assertAlmostEqual(pnl, 10.0, places=2)

    def test_pnl_negative(self):
        tracker = PnLTracker(start_value_quote=100.0)
        pnl = tracker.estimate_daily_pnl(90.0)
        self.assertAlmostEqual(pnl, -10.0, places=2)

    def test_reset(self):
        tracker = PnLTracker(start_value_quote=100.0)
        tracker.trade_count = 50
        tracker.realized_fees_quote = 5.0
        tracker.reset(200.0)
        self.assertEqual(tracker.start_value_quote, 200.0)
        self.assertEqual(tracker.trade_count, 0)
        self.assertEqual(tracker.realized_fees_quote, 0.0)


if __name__ == "__main__":
    unittest.main()
