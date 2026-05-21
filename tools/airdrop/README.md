# Mars Credit Treasury Airdrop

CLI to distribute **native MARS** from treasury `0x6039e53688da87ebf30b0c84d22fcd6707b0c564` on chain **110110**.

**Full walkthrough:** see **[INSTRUCTIONS.md](INSTRUCTIONS.md)** (recipient sourcing, `generate`, validate, send).

| Setting | Value |
|---------|-------|
| Distribution | **270M MARS** to 25,000 wallets |
| Per wallet | **10,800 MARS** (equal split) |
| RPC | `https://rpc.marscredit.xyz` |

## Commands

```bash
cd tools/airdrop && npm install

# 1. Build data/recipients.csv — Dune UI (queries/ethereum_eoa_top35k.sql) or MCP + dune:export
npm run dune:export -- --input data/dune-export-3500.json --output data/recipients.csv
npm run generate -- --input data/recipients.csv --output data/allocations.csv

# 2. Pre-flight
npm run validate -- --csv data/allocations.csv

# 3. Send
npm run send -- --csv data/allocations.csv --limit 10    # pilot
npm run send -- --csv data/allocations.csv             # full run
```

## Scripts

| npm script | Role |
|------------|------|
| `generate` | `recipients.csv` → `allocations.csv` |
| `dune:export` | Dune MCP JSON → `recipients.csv` |
| `validate` | CSV + on-chain checks |
| `send` | Broadcast transfers, write `transfers.jsonl` |
| `test` | Unit tests |

## Environment

Copy `.env.example` → `.env` and set `TREASURY_PRIVATE_KEY`.

Optional: `MAX_DISTRIBUTE_MARS=270000000`, `EXPECTED_ROW_COUNT=25000`, `RPC_URL`, etc.

## Send flags

`--dry-run`, `--limit`, `--start-index`, `--delay-ms`, `--allow-partial`, `--amount-mars`, `--stop-on-error`, `--log-file`

See [INSTRUCTIONS.md](INSTRUCTIONS.md) for examples and troubleshooting.
