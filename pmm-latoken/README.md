# Mars Credit PMM — LATOKEN Market Maker

A lightweight Pure Market Making bot for the MARS/USDT pair on [LATOKEN](https://latoken.com/exchange/MARS_USDT). Places limit buy and sell orders around the current mid price to provide liquidity and keep the orderbook active.

## How It Works

1. Fetches the MARS/USDT orderbook from LATOKEN every 60 seconds (configurable).
2. Calculates the mid price between best bid and best ask.
3. Places a buy order below mid and a sell order above mid (spread configurable, default 1.5% each side).
4. Adjusts spreads based on inventory — if holding too much MARS, it becomes more eager to sell and vice versa.
5. Cancels stale orders and replaces them each cycle.
6. Stops automatically if the daily loss limit is hit.

The bot **does not** trade with itself (wash trading). It places passive limit orders and waits for other market participants to fill them.

## Prerequisites

- Python 3.9+
- A LATOKEN account with an API key ([create one here](https://latoken.com/account/apikeys)) with **Trade on Spot** permission.
- MARS and USDT balances on LATOKEN's spot account.

## Setup

```bash
cd pmm-latoken

# Install dependencies
pip install -r requirements.txt

# Create your config
cp .env.example .env
# Edit .env with your API key and secret
```

## Configuration

Edit `pmm-latoken/.env`:

| Variable | Default | Description |
|---|---|---|
| `LATOKEN_API_KEY` | — | Your LATOKEN API key |
| `LATOKEN_API_SECRET` | — | Your LATOKEN API secret |
| `BASE_CURRENCY` | MARS | Base currency tag |
| `QUOTE_CURRENCY` | USDT | Quote currency tag |
| `BID_SPREAD` | 0.015 | Spread below mid for buy orders (1.5%) |
| `ASK_SPREAD` | 0.015 | Spread above mid for sell orders (1.5%) |
| `ORDER_AMOUNT` | 100 | Order size in MARS per side |
| `ORDER_REFRESH_SECONDS` | 60 | Seconds between order refresh cycles |
| `MIN_SPREAD` | 0.012 | Minimum spread floor (must cover fees) |
| `MAX_POSITION_USDT` | 5000 | Max total portfolio value before pausing |
| `DAILY_LOSS_LIMIT_USDT` | 50 | Stop trading if daily P&L loss exceeds this |
| `SEED_PRICE` | 0 | Fallback price if the orderbook is empty |
| `INVENTORY_TARGET_RATIO` | 0.5 | Target % of portfolio in MARS (0.5 = 50/50) |
| `INVENTORY_SKEW_FACTOR` | 0.5 | How aggressively to skew spreads on imbalance |

## Running

```bash
cd pmm-latoken
python3 -m src.main
```

Logs go to both stdout (JSON) and `pmm-latoken/pmm.log`.

To stop gracefully, press Ctrl+C — the bot will cancel all open orders before exiting.

## Fee Awareness

LATOKEN standard fees at Level 1 (<$10k 30-day volume): **0.59% maker / 0.59% taker**.

A round-trip trade costs 1.18% in fees. The default spread of 3% total (1.5% each side) provides margin above this. **Do not set spreads below 1.2% or you will lose money on every trade.**

## Tests

```bash
cd pmm-latoken
python3 -m pytest tests/ -v
```

## Docker (Railway)

Build from repo root using the root Dockerfile:

```bash
docker build -f Dockerfile.pmmLatoken .
```

Set environment variables in Railway's dashboard instead of a `.env` file.

## Architecture

```
pmm-latoken/
  src/
    main.py            # Entry point
    config.py          # Loads .env configuration
    latoken_client.py  # LATOKEN API wrapper (orderbook, orders, balances)
    strategy.py        # PMM loop: price → spread → orders → refresh
    inventory.py       # Balance tracking and spread skew logic
    logger.py          # Structured JSON logging
  tests/
    test_strategy.py   # Orderbook, spread, and sizing tests
    test_inventory.py  # Inventory state and P&L tracking tests
```
