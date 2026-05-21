# Mars Credit Airdrop — Step-by-Step Instructions

This guide walks through the full workflow: **find 25,000 whale wallets → generate `allocations.csv` → validate → send MARS**.

| Setting | Value |
|---------|-------|
| Treasury | `0x6039e53688da87ebf30b0c84d22fcd6707b0c564` |
| RPC | `https://rpc.marscredit.xyz` |
| Chain ID | `110110` |
| Recipients | **~20,000** EOAs (flexible; cap with `dune:merge --max-recipients`) |
| Total distribution | **270,000,000 MARS** |
| Per wallet (20k split) | **13,500 MARS** |

---

## Overview

```text
Dune SQL / MCP  →  recipients.csv  →  npm run generate  →  allocations.csv
                  (dune:export)                          →  npm run validate
                                                         →  npm run send
```

There are **two scripts**:

| Command | What it does |
|---------|----------------|
| `npm run generate` | Builds `allocations.csv` from a plain address list (`recipients.csv`) |
| `npm run dune:merge` | Merges Dune tier/community JSON → `recipients.csv` (default top 20k by ETH) |
| `npm run dune:export` | Filters labeled snapshot JSON → `recipients.csv` |
| `npm run validate` | Checks CSV + on-chain treasury balance |
| `npm run send` | Broadcasts native MARS transfers |

Dune is used via **MCP or the web UI** to build `recipients.csv`; `generate` / `validate` / `send` run locally.

---

## Part 1 — Install

```bash
cd tools/airdrop
npm install
cp .env.example .env
```

Edit `.env` and set:

```env
TREASURY_PRIVATE_KEY=your_key_here
```

The key must control treasury `0x6039e53688da87ebf30b0c84d22fcd6707b0c564`.

---

## Part 2 — Build the recipient list (manual, Dune or DeBank)

### Goal

A file `data/recipients.csv` with **exactly one column of addresses** (25,000 rows), **after** you filter contracts and CEX wallets.

### Who to include

- Top **25,000** **EOA** wallets ranked by wealth
- **Ranking:** pick one:
  - **Ethereum mainnet native ETH balance** (simplest; use Dune), or
  - **Cross-chain net worth** (DeBank Pro `total_balance`)

Start from **~30,000–35,000** ranked candidates so exclusions still leave 25,000.

### Who to exclude (before export)

| Exclude | Why |
|---------|-----|
| Smart contracts | Non-empty bytecode — not a person’s wallet |
| CEX hot wallets | Binance, Coinbase, Kraken, etc. |
| Bridge / staking infra | Beacon deposit, WETH, Lido, canonical bridges |
| Treasury & team | `0x6039e53688da87ebf30b0c84d22fcd6707b0c564` and internal wallets |
| Duplicates | One row per address |

### Option A — Dune (recommended for ETH mainnet rank)

#### A1. SQL files in this repo

| Query | File | Notes |
|-------|------|-------|
| Tier 1–4 (balances_daily) | [`ethereum_tier1_whales.sql`](queries/ethereum_tier1_whales.sql) … [`ethereum_tier4.sql`](queries/ethereum_tier4.sql) | **Times out** on Community (2 min) — do not retry heavily |
| Community exports (works) | `p2p_org`, `beesblabs` via MCP | See [`data/dune-pilot-log.json`](data/dune-pilot-log.json) |
| CEX blocklist | [`queries/cex_addresses.sql`](queries/cex_addresses.sql) | ~0.003 credits |
| Deprecated monolith | [`queries/ethereum_eoa_top35k.sql`](queries/ethereum_eoa_top35k.sql) | JOIN + full scan — use merge path instead |

Addresses on Dune are **varbinary** — use `0x...` literals, not `LOWER('0x...')`.

#### A2. Recommended: community tables + merge (MCP)

This path produced **41,531** unique EOAs after CEX filter; capped to **20,000** top by ETH balance.

1. Export via Dune MCP (or save query results JSON under `data/`):
   - `dune.p2p_org.dataset_eth_holders_may29` → `data/dune-p2p-holders.json` (+ page 2 if needed)
   - `dune.beesblabs.result_ethereum_top_balances` → `data/dune-beesblabs.json`
   - `cex_ethereum.addresses` → `data/cex-addresses.json`
   - Optional: `dune-export-3500.json` (labeled snapshot)

2. Merge and cap:

```bash
cd tools/airdrop
npm run dune:merge
# default: top 20,000 by eth_balance → data/recipients.csv
# all unique: npm run dune:merge -- --max-recipients none
```

3. Generate allocations (270M ÷ recipient count):

```bash
npm run generate -- --input data/recipients.csv --output data/allocations.csv --allow-partial
npm run validate -- --csv data/allocations.csv --allow-partial
```

Summary: [`data/recipients-summary.json`](data/recipients-summary.json). Credits log: [`data/dune-pilot-log.json`](data/dune-pilot-log.json) (~465 / 2,500 used after this run).

**Do not** re-run failed `balances_daily` tier queries in a loop — each attempt costs credits and times out on Community.

#### A3. Manual Dune UI (no MCP)

1. Log in at [dune.com](https://dune.com).
2. Paste SQL from [`queries/ethereum_eoa_top35k.sql`](queries/ethereum_eoa_top35k.sql).
3. Run → **Download CSV** → keep `address` (and optional `eth_balance`).
4. Save as `data/recipients.csv` (or `recipients-raw.csv` then filter).

Format:

```csv
address
0xabc...
0xdef...
```

Only the `address` column is required for `npm run generate`.

### Option B — DeBank Pro (cross-chain net worth)

1. Use [DeBank Pro OpenAPI](https://docs.cloud.debank.com/) or export from the Pro dashboard.
2. Rank by `total_balance` (USD) across chains.
3. Drop contract-labeled and CEX-labeled accounts.
4. Take top **25,000** EOAs → `data/recipients.csv`.

### Optional quality checks

- Require ≥1 transaction in the last 12–24 months (drops dead keys).
- Sanctions screen the top 500–1,000 addresses.
- Manually review the **top 200** balances.

---

## Part 3 — Generate `allocations.csv`

This step uses the **included generator script** (you do not hand-edit 25,000 amount rows).

```bash
npm run generate -- --input data/recipients.csv --output data/allocations.csv
```

Defaults:

- **270,000,000** MARS total
- **25,000** rows required
- **10,800** MARS per wallet (`270_000_000 ÷ 25_000`)

Useful flags:

```bash
# Pilot list with fewer rows (defaults to 10,800 MARS each, not a split of 270M)
npm run generate -- --input data/recipients-pilot.csv --output data/allocations-pilot.csv --allow-partial

# Fixed amount per wallet (skip auto division)
npm run generate -- --input data/recipients.csv --amount-mars 10800

# Custom total (must divide evenly by row count)
npm run generate -- --input data/recipients.csv --total-mars 270000000
```

Output example:

```csv
address,amount_mars
0xabc...,10800
0xdef...,10800
```

The generator:

- Normalizes addresses to checksum format
- Rejects duplicates
- Strips treasury address if present
- Fails if row count ≠ 25,000 (unless `--allow-partial`)

---

## Part 4 — Validate before sending

```bash
npm run validate -- --csv data/allocations.csv
```

Checks:

- 25,000 rows (use `--allow-partial` for pilots)
- Total ≤ **270M MARS**
- No duplicate or treasury recipient addresses
- Treasury on-chain balance covers total + gas
- RPC reports chain ID **110110**

Fix any errors before continuing.

---

## Part 5 — Pilot send (10 wallets)

```bash
# Plan only
npm run send -- --csv data/allocations.csv --dry-run --limit 10

# Live
npm run send -- --csv data/allocations.csv --limit 10
```

1. Open [blockscan.marscredit.xyz](https://blockscan.marscredit.xyz).
2. Confirm 10 transfers from `0x6039…c564`, **10,800 MARS** each.
3. Check `transfers.jsonl` for `status: "confirmed"`.

---

## Part 6 — Full production send

```bash
npm run send -- --csv data/allocations.csv --delay-ms 500
```

### Resume after a failure

Each transfer is logged to `transfers.jsonl`. Find the last successful `index`, then:

```bash
npm run send -- --csv data/allocations.csv --start-index 1234
```

### Batch over multiple days

```bash
# Day 1: rows 0–999
npm run send -- --csv data/allocations.csv --start-index 0 --limit 1000

# Day 2: rows 1000–1999
npm run send -- --csv data/allocations.csv --start-index 1000 --limit 1000
```

### Stop on first error

```bash
npm run send -- --csv data/allocations.csv --stop-on-error
```

---

## Part 7 — After the drop

1. Keep `allocations.csv` and `transfers.jsonl` for a transparency report.
2. Publish a summary (addresses + amounts + tx hashes) on your site or repo.
3. Tell recipients how to add Mars Credit in MetaMask:
   - Network name: Mars Credit  
   - Chain ID: `110110`  
   - RPC: `https://rpc.marscredit.xyz`  
   - Symbol: MARS  

---

## Quick reference

| File | Purpose |
|------|---------|
| `data/recipients.csv` | **You create** — 25k addresses from Dune/DeBank |
| `data/allocations.csv` | **Generated** — addresses + `amount_mars` |
| `transfers.jsonl` | **Created by send** — one JSON line per transfer |
| `.env` | Treasury private key (never commit) |

| Command | Purpose |
|---------|---------|
| `npm run generate` | `recipients.csv` → `allocations.csv` |
| `npm run dune:merge` | Dune JSON files → `recipients.csv` |
| `npm run dune:export` | Labeled snapshot JSON → `recipients.csv` |
| `npm run validate` | Pre-flight checks |
| `npm run send` | Execute transfers |
| `npm test` | Unit tests |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Expected 25000 recipients, got N` | Add/remove rows in `recipients.csv` or use `--allow-partial` for pilots |
| `does not divide evenly` | Use `--amount-mars 10800` or adjust row count / `--total-mars` |
| `Treasury balance too low` | Confirm funding on `0x6039…c564`; leave headroom for gas |
| `Private key does not match treasury` | Key must be for `0x6039e53688da87ebf30b0c84d22fcd6707b0c564` |
| Duplicate addresses | Dedupe `recipients.csv` before `generate` |

---

## Security

- Never commit `.env`, `recipients.csv`, or `allocations.csv` with real data (they are gitignored).
- Use a dedicated machine or hardware wallet workflow where possible.
- Align public messaging with a large treasury distribution (site copy may mention “no premine”).

---

## See also

- [`README.md`](README.md) — CLI flags and environment variables
- [`data/recipients.csv.example`](data/recipients.csv.example) — input format sample
- [`data/allocations.csv.example`](data/allocations.csv.example) — output format sample
