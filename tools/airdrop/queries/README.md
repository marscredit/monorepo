# Dune queries for Mars Credit airdrop

## What works on Community / MCP (~0.003 credits each)

| Export | Query / table | Save as |
|--------|---------------|---------|
| P2P ETH holders | `dune.p2p_org.dataset_eth_holders_may29` | `data/dune-p2p-holders.json` (+ offset page 2) |
| Top balances | `dune.beesblabs.result_ethereum_top_balances` | `data/dune-beesblabs.json` |
| CEX blocklist | [`cex_addresses.sql`](cex_addresses.sql) | `data/cex-addresses.json` |
| Labeled 3500 | [`ethereum_eoa_labeled_snapshot.sql`](ethereum_eoa_labeled_snapshot.sql) | `data/dune-export-3500.json` |

Then: `npm run dune:merge` → `data/recipients.csv` (default **top 20,000** by ETH).

## What times out (2 min engine limit)

| File | Issue |
|------|-------|
| [`ethereum_tier1_whales.sql`](ethereum_tier1_whales.sql) … [`ethereum_tier4.sql`](ethereum_tier4.sql) | `tokens_ethereum.balances_daily` scan |
| [`ethereum_eoa_top35k.sql`](ethereum_eoa_top35k.sql) | JOINs + full scan |

Do not loop retries on these — use community exports above.

## Saved query IDs (your account)

| Query | ID |
|-------|-----|
| Mars - p2p holders full | 7550472 |
| Mars - beesblabs balances full | 7550474 |
| Mars - CEX list | 7550476 |
| Mars Airdrop Tier1 (failed) | 7550443 |

Open: `https://dune.com/queries/{query_id}`
