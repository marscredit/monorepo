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
    def test_sell_trade_adds_revenue(self):
        tracker = PnLTracker()
        tracker.process_trades([
            {"id": "t1", "side": "SELL", "price": "0.005", "quantity": "1000", "cost": "5.0", "fee": "0.01"},
        ])
        self.assertAlmostEqual(tracker.get_realized_pnl(), 4.99, places=2)
        self.assertEqual(tracker.trade_count, 1)

    def test_buy_trade_subtracts_cost(self):
        tracker = PnLTracker()
        tracker.process_trades([
            {"id": "t1", "side": "BUY", "price": "0.004", "quantity": "1000", "cost": "4.0", "fee": "0.01"},
        ])
        self.assertAlmostEqual(tracker.get_realized_pnl(), -4.01, places=2)
        self.assertEqual(tracker.trade_count, 1)

    def test_net_pnl_from_buy_and_sell(self):
        tracker = PnLTracker()
        tracker.process_trades([
            {"id": "t1", "side": "BUY", "price": "0.004", "quantity": "1000", "cost": "4.0", "fee": "0.01"},
            {"id": "t2", "side": "SELL", "price": "0.005", "quantity": "1000", "cost": "5.0", "fee": "0.01"},
        ])
        self.assertAlmostEqual(tracker.get_realized_pnl(), 0.98, places=2)
        self.assertEqual(tracker.trade_count, 2)
        self.assertAlmostEqual(tracker.realized_fees_quote, 0.02, places=4)

    def test_duplicate_trades_ignored(self):
        tracker = PnLTracker()
        trade = {"id": "t1", "side": "BUY", "price": "0.004", "quantity": "1000", "cost": "4.0", "fee": "0"}
        tracker.process_trades([trade, trade, trade])
        self.assertEqual(tracker.trade_count, 1)
        self.assertAlmostEqual(tracker.get_realized_pnl(), -4.0, places=2)

    def test_direction_field_alias(self):
        tracker = PnLTracker()
        tracker.process_trades([
            {"id": "t1", "direction": "SELL", "price": "0.005", "quantity": "100", "cost": "0.5", "fee": "0"},
        ])
        self.assertAlmostEqual(tracker.get_realized_pnl(), 0.5, places=2)

    def test_latoken_trade_direction_format(self):
        tracker = PnLTracker()
        tracker.process_trades([
            {"id": "t1", "direction": "TRADE_DIRECTION_BUY", "price": "0.004", "quantity": "1000", "cost": "4.0", "fee": "0.01"},
            {"id": "t2", "direction": "TRADE_DIRECTION_SELL", "price": "0.005", "quantity": "1000", "cost": "5.0", "fee": "0.01"},
        ])
        self.assertAlmostEqual(tracker.get_realized_pnl(), 0.98, places=2)
        self.assertEqual(tracker.trade_count, 2)

    def test_cost_computed_from_price_and_quantity(self):
        tracker = PnLTracker()
        tracker.process_trades([
            {"id": "t1", "side": "SELL", "price": "0.005", "quantity": "1000", "fee": "0"},
        ])
        self.assertAlmostEqual(tracker.get_realized_pnl(), 5.0, places=2)

    def test_reset_clears_state(self):
        tracker = PnLTracker()
        tracker.process_trades([
            {"id": "t1", "side": "BUY", "price": "0.004", "quantity": "1000", "cost": "4.0", "fee": "0.01"},
        ])
        tracker.reset()
        self.assertEqual(tracker.get_realized_pnl(), 0.0)
        self.assertEqual(tracker.trade_count, 0)
        self.assertEqual(tracker.realized_fees_quote, 0.0)

    def test_empty_trades_no_effect(self):
        tracker = PnLTracker()
        tracker.process_trades([])
        self.assertEqual(tracker.get_realized_pnl(), 0.0)
        self.assertEqual(tracker.trade_count, 0)


if __name__ == "__main__":
    unittest.main()
