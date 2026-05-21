# Blockscan (blockscan.marscredit.xyz) — Railway environment

Set these on the **frontend** Railway service after deploying changes that include `brandassets/marscredit-og-1200x600.png`.

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_OG_IMAGE_URL` | `https://raw.githubusercontent.com/marscredit/monorepo/main/brandassets/marscredit-og-1200x600.png` |
| `NEXT_PUBLIC_OG_DESCRIPTION` | `Mars Credit Network official block explorer. Explore blocks, transactions, addresses, and tokens on the Mars Credit proof-of-work chain.` |
| `NEXT_PUBLIC_PROMOTE_BLOCKSCOUT_IN_TITLE` | `false` |
| `NEXT_PUBLIC_TOP_ACCOUNTS_EXCLUDED_ADDRESSES` | `["0x000000000000000000000000000000000000dEaD"]` |

Ensure `NEXT_PUBLIC_APP_HOST` is `blockscan.marscredit.xyz` so OG image URLs are absolute.

After updating env vars, redeploy the frontend service. `download_assets.sh` fetches the OG image at container startup.

**Note:** Update the `NEXT_PUBLIC_OG_IMAGE_URL` GitHub raw URL if your default branch or org/repo name differs from `marscredit/monorepo`.
