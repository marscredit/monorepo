"""Tests for PMM strategy calculations."""

import unittest

from src.inventory import (
    InventoryState,
    compute_order_sizes,
    compute_skewed_spreads,
)
from src.latoken_client import Orderbook, OrderbookLevel


class TestOrderbook(unittest.TestCase):
    def test_mid_price_calculation(self):
        book = Orderbook(
            asks=[OrderbookLevel(price=0.0102, quantity=100)],
            bids=[OrderbookLevel(price=0.0098, quantity=100)],
        )
        self.assertAlmostEqual(book.mid_price, 0.0100, places=6)

    def test_mid_price_empty_book(self):
        book = Orderbook(asks=[], bids=[])
        self.assertIsNone(book.mid_price)
        self.assertIsNone(book.best_ask)
        self.assertIsNone(book.best_bid)

    def test_spread_pct(self):
        book = Orderbook(
            asks=[OrderbookLevel(price=0.0102, quantity=100)],
            bids=[OrderbookLevel(price=0.0098, quantity=100)],
        )
        expected_spread = (0.0102 - 0.0098) / 0.0100
        self.assertAlmostEqual(book.spread_pct, expected_spread, places=6)

    def test_best_bid_ask(self):
        book = Orderbook(
            asks=[
                OrderbookLevel(price=0.0102, quantity=50),
                OrderbookLevel(price=0.0105, quantity=100),
            ],
            bids=[
                OrderbookLevel(price=0.0098, quantity=50),
                OrderbookLevel(price=0.0095, quantity=100),
            ],
        )
        self.assertAlmostEqual(book.best_ask, 0.0102, places=6)
        self.assertAlmostEqual(book.best_bid, 0.0098, places=6)


class TestSkewedSpreads(unittest.TestCase):
    def test_balanced_inventory_no_skew(self):
        bid, ask = compute_skewed_spreads(
            base_bid_spread=0.015,
            base_ask_spread=0.015,
            inventory_ratio=0.5,
            target_ratio=0.5,
            skew_factor=0.5,
        )
        self.assertAlmostEqual(bid, 0.015, places=6)
        self.assertAlmostEqual(ask, 0.015, places=6)

    def test_heavy_base_widens_bid_tightens_ask(self):
        bid, ask = compute_skewed_spreads(
            base_bid_spread=0.015,
            base_ask_spread=0.015,
            inventory_ratio=0.8,
            target_ratio=0.5,
            skew_factor=0.5,
        )
        self.assertGreater(bid, 0.015)
        self.assertLess(ask, 0.015)

    def test_heavy_quote_tightens_bid_widens_ask(self):
        bid, ask = compute_skewed_spreads(
            base_bid_spread=0.015,
            base_ask_spread=0.015,
            inventory_ratio=0.2,
            target_ratio=0.5,
            skew_factor=0.5,
        )
        self.assertLess(bid, 0.015)
        self.assertGreater(ask, 0.015)

    def test_spread_never_goes_below_floor(self):
        bid, ask = compute_skewed_spreads(
            base_bid_spread=0.005,
            base_ask_spread=0.005,
            inventory_ratio=0.0,
            target_ratio=0.5,
            skew_factor=2.0,
        )
        self.assertGreaterEqual(bid, 0.001)
        self.assertGreaterEqual(ask, 0.001)


class TestOrderSizing(unittest.TestCase):
    def test_sizes_within_balance(self):
        state = InventoryState(
            base_available=500.0,
            base_blocked=0.0,
            quote_available=50.0,
            quote_blocked=0.0,
            mid_price=0.01,
        )
        buy_qty, sell_qty = compute_order_sizes(
            base_amount=100, inventory_state=state, mid_price=0.01
        )
        self.assertGreater(buy_qty, 0)
        self.assertGreater(sell_qty, 0)
        self.assertLessEqual(sell_qty, 500)

    def test_no_quote_means_no_buy(self):
        state = InventoryState(
            base_available=500.0,
            base_blocked=0.0,
            quote_available=0.0,
            quote_blocked=0.0,
            mid_price=0.01,
        )
        buy_qty, sell_qty = compute_order_sizes(
            base_amount=100, inventory_state=state, mid_price=0.01
        )
        self.assertEqual(buy_qty, 0.0)
        self.assertGreater(sell_qty, 0)

    def test_no_base_means_no_sell(self):
        state = InventoryState(
            base_available=0.0,
            base_blocked=0.0,
            quote_available=50.0,
            quote_blocked=0.0,
            mid_price=0.01,
        )
        buy_qty, sell_qty = compute_order_sizes(
            base_amount=100, inventory_state=state, mid_price=0.01
        )
        self.assertGreater(buy_qty, 0)
        self.assertEqual(sell_qty, 0.0)

    def test_order_amount_capped_by_balance(self):
        state = InventoryState(
            base_available=10.0,
            base_blocked=0.0,
            quote_available=0.5,
            quote_blocked=0.0,
            mid_price=0.01,
        )
        buy_qty, sell_qty = compute_order_sizes(
            base_amount=10000, inventory_state=state, mid_price=0.01
        )
        self.assertLessEqual(buy_qty, 50)
        self.assertLessEqual(sell_qty, 10)


if __name__ == "__main__":
    unittest.main()
