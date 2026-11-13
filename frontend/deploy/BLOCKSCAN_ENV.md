# Blockscan (blockscan.marscredit.xyz) — Railway environment

Set these on the **frontend** Railway service after deploying changes that include `brandassets/marscredit-og-1200x600.png`.

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_OG_IMAGE_URL` | `https://raw.githubusercontent.com/marscredit/monorepo/main/brandassets/marscredit-og-1200x600.png` |
| `NEXT_PUBLIC_OG_DESCRIPTION` | `Mars Credit Network official block explorer. Explore blocks, transactions, addresses, and tokens on the Mars Credit proof-of-work chain.` |
| `NEXT_PUBLIC_PROMOTE_BLOCKSCOUT_IN_TITLE` | `false` |
| `NEXT_PUBLIC_SUPPLY_EXCLUDED_ADDRESSES` | `0x000000000000000000000000000000000000dEaD` |
| `NEXT_PUBLIC_NETWORK_LOGO` | `https://marscredit.xyz/brand/marscredit_wordmark_dark.png` |
| `NEXT_PUBLIC_NETWORK_LOGO_DARK` | `https://marscredit.xyz/brand/marscredit_wordmark_white.png` |

Leave `NEXT_PUBLIC_TOP_ACCOUNTS_EXCLUDED_ADDRESSES` unset (or remove it) so the burn address stays on the Top accounts list and shows **Burned** instead of a percentage. That list-filter env only hides rows; it does not change circulating-supply math.

`NEXT_PUBLIC_SUPPLY_EXCLUDED_ADDRESSES` is comma-separated. Percentages use Blockscout `/api?module=stats&action=coinsupply` minus live balances of those addresses (`/api/v2/addresses/:hash`). Do not use CoinGecko or other market supply. `DISABLE_MARKET=true` is compatible.

Ensure `NEXT_PUBLIC_APP_HOST` is `blockscan.marscredit.xyz` so OG image URLs are absolute.

After updating env vars, redeploy the frontend service. `download_assets.sh` fetches the OG image and network logos at container startup. The wordmark URLs require the **website** (`marscredit.xyz`) deploy that includes `website-public/public/brand/marscredit_wordmark_dark.png` and `marscredit_wordmark_white.png`.

**Note:** Update the `NEXT_PUBLIC_OG_IMAGE_URL` GitHub raw URL if your default branch or org/repo name differs from `marscredit/monorepo`.
