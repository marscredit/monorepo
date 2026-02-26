# Mars Credit (MARS) — Hyperlane Bridge Deployment Brief
**For: Claude Opus 4.6 Agent / Coding Agent**
**Objective:** Deploy Hyperlane to the Mars Credit L1 chain, create a wrapped wMARS ERC-20 on Base, and establish two-way bridges for USDC, USDT, WBTC, and WETH back to the Mars chain so dApps can be built on-chain.

---

## Context & Goal

Mars Credit (MARS) is a standalone EVM-compatible Layer 1 blockchain (Ethereum PoW fork) with its own native token. The goals of this deployment are:

1. **Create wMARS on Base** — a wrapped ERC-20 representation of native MARS, backed 1:1 and bridgeable via Hyperlane Warp Routes. This is a prerequisite for listing on Coinbase (which only lists ERC-20s on Base/Ethereum/Optimism/Arbitrum/Polygon).
2. **Bridge USDC, USDT, WBTC, and WETH to Mars** — so developers can deploy contracts and dApps on Mars that use real stablecoin and crypto liquidity.
3. **Submit the MARS chain to the Hyperlane registry** — so the default Abacus Works relayer picks up Mars traffic and we don't have to run our own infrastructure.

**Key URLs:**
- Mars Credit website: https://marscredit.xyz
- Mars Credit GitHub: https://github.com/marscredit
- Mars Credit Blockscan: https://blockscan.marscredit.xyz
- Mars Credit RPC: https://rpc.marscredit.xyz
- Hyperlane Registry: https://github.com/hyperlane-xyz/hyperlane-registry
- Hyperlane Docs (Deploy new chain): https://docs.hyperlane.xyz/docs/guides/chains/deploy-hyperlane
- Hyperlane Docs (Warp Route): https://docs.hyperlane.xyz/docs/guides/quickstart/deploy-warp-route

---

## Prerequisites — Gather Before Starting

Before running any commands, confirm and document the following:

| Item | Where to Find | Status |
|------|---------------|--------|
| Mars chain name (slug) | Use `marscredit` | ✅ |
| Mars chain ID | Check `https://blockscan.marscredit.xyz` or `go-marscredit` repo | ❓ Confirm |
| Mars RPC URL | `https://rpc.marscredit.xyz` | ✅ |
| Mars block explorer URL | `https://blockscan.marscredit.xyz` | ✅ |
| Deployer wallet private key | Must be funded with MARS (for Mars chain gas) and ETH on Base | ❓ Required |
| ETH on Base | ~0.05 ETH needed for contract deploys | ❓ Required |
| MARS for gas | Enough for multiple contract deploy transactions | ❓ Required |

> **Security note:** Never commit private keys. Use `export HYP_KEY='0x...'` in terminal only, or store in a local `.env` file that is gitignored.

---

## Phase 1: Install Hyperlane CLI

```bash
# Install globally
npm install -g @hyperlane-xyz/cli

# Verify install
hyperlane --version
# Expected output: hyperlane/x.x.x
```

If you see an older version already installed, uninstall first:
```bash
npm uninstall -g @hyperlane-xyz/cli
npm install -g @hyperlane-xyz/cli
```

---

## Phase 2: Register Mars Credit as a New Chain

Hyperlane needs chain metadata before it can deploy anything. Run:

```bash
hyperlane registry init
```

You will be prompted to enter:
- **Chain name:** `marscredit`
- **Chain ID:** (confirm from blockscan — likely a custom integer)
- **RPC URL:** `https://rpc.marscredit.xyz`
- **Block explorer URL:** `https://blockscan.marscredit.xyz`
- **Native token name:** `Mars`
- **Native token symbol:** `MARS`
- **Native token decimals:** `18`
- **Is testnet?:** `No`
- Block/gas properties: optional, can skip

After completion, a file will be created at:
```
~/.hyperlane/chains/marscredit/metadata.yaml
```

**Review and verify this file looks correct before proceeding.** Example expected output:

```yaml
name: marscredit
chainId: <MARS_CHAIN_ID>
domainId: <MARS_CHAIN_ID>
protocol: ethereum
rpcUrls:
  - http: https://rpc.marscredit.xyz
blockExplorers:
  - name: Blockscan
    url: https://blockscan.marscredit.xyz
    apiUrl: https://blockscan.marscredit.xyz/api
nativeToken:
  name: Mars
  symbol: MARS
  decimals: 18
```

---

## Phase 3: Deploy Hyperlane Core Contracts to Mars Chain

This deploys the on-chain infrastructure that makes cross-chain messaging possible: Mailbox, ISM (Interchain Security Module), Merkle Tree Hook, and Protocol Fee contracts.

### Step 3a — Set private key

```bash
export HYP_KEY='0xYOUR_DEPLOYER_PRIVATE_KEY_HERE'
```

### Step 3b — Initialize core config

```bash
hyperlane core init
```

When prompted about ISM type, select **Trusted Relayer ISM** for simplicity during initial setup. You can upgrade to a more secure ISM after the route is working.

This creates `~/.hyperlane/chains/marscredit/core-config.yaml`.

### Step 3c — Deploy core contracts

```bash
hyperlane core deploy
```

- Select `marscredit` from the chain list (scroll down, it will be at the bottom since it's custom)
- Confirm deployment when prompted
- This will take 3–7 minutes depending on block time

**Expected output:** A set of contract addresses including:
- `mailbox`
- `interchainGasPaymaster`
- `validatorAnnounce`
- `merkleTreeHook`
- `proxyAdmin`

These are saved to `~/.hyperlane/chains/marscredit/addresses.yaml`. **Save this file — you need these addresses for the warp route config.**

### Step 3d — Send a test message

```bash
hyperlane send message --relay --origin marscredit --destination sepolia
```

This verifies the Mailbox is working. You should see: `Message delivered on destination chain!`

> If this fails, check RPC connectivity and ensure the deployer wallet has MARS gas. See Hyperlane troubleshooting: https://docs.hyperlane.xyz/docs/guides/deploy-hyperlane-troubleshooting

---

## Phase 4: Deploy wMARS Warp Route (MARS → Base)

A Warp Route is a pair of smart contracts — one on Mars (collateral/native) and one on Base (synthetic ERC-20). When a user locks MARS in the Mars contract, wMARS is minted on Base. When they send wMARS back, it is burned and MARS is released.

### Step 4a — Initialize warp route config

```bash
hyperlane warp init
```

Walkthrough prompts:
1. Confirm your wallet address → `Y`
2. Select network type → `mainnet`
3. Select chains → use spacebar to select **`marscredit`** and **`base`**, then Enter
4. Configure `marscredit`:
   - Token type → **`native`** (MARS is the native gas token)
   - Confirm detected mailbox address → `Y`
5. Configure `base`:
   - Token type → **`synthetic`** (this creates the new wMARS ERC-20)
   - Confirm detected mailbox address → `Y`

This generates a config file. Review it — it should look like:

```yaml
marscredit:
  type: native
  mailbox: <YOUR_MARS_MAILBOX_ADDRESS>
  interchainSecurityModule:
    type: trustedRelayerIsm
    relayer: <YOUR_DEPLOYER_ADDRESS>

base:
  type: synthetic
  mailbox: "0xeA87ae93Fa0019a82A727bfd3eBd1cFCa8f64f1D"
  name: "Wrapped Mars"
  symbol: "wMARS"
  decimals: 18
```

> Base's official Hyperlane mailbox address is `0xeA87ae93Fa0019a82A727bfd3eBd1cFCa8f64f1D`. Confirm the latest address at: https://github.com/hyperlane-xyz/hyperlane-registry/blob/main/chains/base/addresses.yaml

### Step 4b — Deploy the warp route

```bash
hyperlane warp deploy
```

- When prompted for Basescan API key for contract verification → can enter `N` to skip (verify later)
- Review the deployment plan → `Y` to proceed
- Deployment costs ~$0.05–0.25 in ETH gas on Base side, minimal MARS on Mars side

**On success you will see:**
```
✅ Warp contract deployments complete
```

Two key output files saved to `~/.hyperlane/deployments/warp_routes/MARS/`:
- `marscredit-base-config.yaml` — your warp route config (needed for bridge UI)
- Contains wMARS contract address on Base — **save this, it's your Coinbase listing token address**

### Step 4c — Test the bridge

```bash
hyperlane warp send --relay \
  --origin marscredit \
  --destination base \
  --warp ~/.hyperlane/deployments/warp_routes/MARS/marscredit-base-config.yaml
```

This sends 1 wei of MARS to Base as wMARS. Confirm receipt in the output or on Base block explorer.

---

## Phase 5: Relayer Setup (Critical — Prevents Downtime)

The relayer is the off-chain process that reads messages on origin and delivers them on destination. **We are NOT running our own relayer** — that caused issues with the Solana bridge. Use one of these options:

### Option A (Recommended): Imperator Managed Relayer

Imperator (https://www.imperator.co/products/hyperlane) is a professional third-party Hyperlane relayer running 24/7 across 24+ chains. Contact them to add the `marscredit` chain to their relayer set.

**Action items:**
1. Go to https://www.imperator.co/products/hyperlane
2. Contact their team (Discord or email) with:
   - Chain name: `marscredit`
   - Chain ID: `<MARS_CHAIN_ID>`
   - RPC URL: `https://rpc.marscredit.xyz`
   - Mailbox address: `<YOUR_DEPLOYED_MAILBOX_ADDRESS>`
   - Deployed warp route config (copy from `~/.hyperlane/deployments/warp_routes/MARS/`)
3. They handle: uptime, gas rebalancing on destination chains, retry logic

**Expected cost:** Negotiate with them — estimated $500–2,000/mo depending on volume and chains covered.

### Option B: Submit to Hyperlane Registry (Free, takes days–weeks)

If MARS chain is added to the official Hyperlane registry, the Abacus Works default relayer will automatically service it. This is the long-term goal regardless.

Submit a PR to: https://github.com/hyperlane-xyz/hyperlane-registry

**Files to add:**
```
chains/marscredit/metadata.yaml    ← from Phase 2
chains/marscredit/addresses.yaml   ← from Phase 3
chains/marscredit/logo.svg         ← Mars Credit logo
```

**metadata.yaml must include:**
- Complete chain info (all fields from Phase 2)
- `deployer` section with team name and contact URL
- `isTestnet: false`

```bash
# From your local Hyperlane registry fork:
cd ~/.hyperlane && git init && git add . && git commit -m "Add marscredit chain"
git remote add canonical git@github.com:hyperlane-xyz/hyperlane-registry.git
git pull canonical main --rebase
# Push to your fork and open a PR
```

> Do Option A immediately so the bridge works today, pursue Option B in parallel for long-term sustainability.

---

## Phase 6: Bridge USDC, USDT, WBTC, and WETH → Mars Chain

To support dApp development on Mars, we need canonical versions of major assets available on the Mars chain. This requires creating additional Warp Routes — one per asset — from their origin chain (Ethereum or Base) to Mars.

Each bridge follows the same pattern: **collateral** on the source chain (tokens locked in a vault) → **synthetic** on Mars (minted representation).

> **Why this matters:** Without stablecoins and major assets on Mars, developers can't build DeFi apps, can't price things in USD, and can't attract users. This is the liquidity foundation for the Mars ecosystem.

---

### 6a — Bridge USDC (Base → Mars)

USDC on Base is the most liquid source. We'll lock USDC on Base and mint a synthetic `USDC.mars` on the Mars chain.

**Token address on Base:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

```bash
hyperlane warp init
```

- Select chains: `base` and `marscredit`
- Configure `base`:
  - Token type → **`collateral`**
  - Token address → `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
  - Confirm mailbox → `Y`
- Configure `marscredit`:
  - Token type → **`synthetic`**
  - Name → `USD Coin`
  - Symbol → `USDC`
  - Decimals → `6`
  - Confirm mailbox → `Y`

```bash
hyperlane warp deploy
```

**Output:** A synthetic USDC contract deployed on Mars. Save the contract address — this is the canonical USDC on Mars.

---

### 6b — Bridge USDT (Ethereum → Mars)

USDT is most liquid on Ethereum mainnet. Lock on Ethereum, mint on Mars.

**Token address on Ethereum:** `0xdAC17F958D2ee523a2206206994597C13D831ec7`

```bash
hyperlane warp init
```

- Select chains: `ethereum` and `marscredit`
- Configure `ethereum`:
  - Token type → **`collateral`**
  - Token address → `0xdAC17F958D2ee523a2206206994597C13D831ec7`
  - Confirm mailbox → `Y`
- Configure `marscredit`:
  - Token type → **`synthetic`**
  - Name → `Tether USD`
  - Symbol → `USDT`
  - Decimals → `6`

```bash
hyperlane warp deploy
```

> Note: Ethereum mainnet mailbox address is `0xc005dc82818d67AF737725bD4bf75435d065D239`. Confirm at https://github.com/hyperlane-xyz/hyperlane-registry/blob/main/chains/ethereum/addresses.yaml

---

### 6c — Bridge WBTC (Ethereum → Mars)

Wrapped Bitcoin as collateral on Ethereum, synthetic wBTC on Mars.

**Token address on Ethereum:** `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599`

```bash
hyperlane warp init
```

- Select chains: `ethereum` and `marscredit`
- Configure `ethereum`:
  - Token type → **`collateral`**
  - Token address → `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599`
  - Confirm mailbox → `Y`
- Configure `marscredit`:
  - Token type → **`synthetic`**
  - Name → `Wrapped Bitcoin`
  - Symbol → `WBTC`
  - Decimals → `8`

```bash
hyperlane warp deploy
```

---

### 6d — Bridge WETH (Base → Mars)

WETH from Base is cheaper to bridge than from Ethereum mainnet. Lock on Base, mint on Mars.

**Token address on Base:** `0x4200000000000000000000000000000000000006`

```bash
hyperlane warp init
```

- Select chains: `base` and `marscredit`
- Configure `base`:
  - Token type → **`collateral`**
  - Token address → `0x4200000000000000000000000000000000000006`
  - Confirm mailbox → `Y`
- Configure `marscredit`:
  - Token type → **`synthetic`**
  - Name → `Wrapped Ether`
  - Symbol → `WETH`
  - Decimals → `18`

```bash
hyperlane warp deploy
```

---

## Phase 7: Add Liquidity on Base (wMARS/USDC Pool)

After deploying wMARS, create a Uniswap V3 liquidity pool on Base to establish price discovery and trading volume. This is required before applying to Coinbase.

**Steps:**
1. Go to https://app.uniswap.org/add/v3
2. Select Base network in your wallet
3. Token A: `wMARS` (use the contract address from Phase 4)
4. Token B: `USDC` (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
5. Select fee tier: **1%** (appropriate for a new, volatile asset)
6. Set initial price range and deposit amounts
7. Confirm transaction

**Minimum viable liquidity:** At least $10,000–$50,000 in the pool is needed before Coinbase will take the listing application seriously.

---

## Phase 8: Bridge UI Setup

After warp routes are deployed, set up a user-facing bridge UI using Superbridge.

1. Go to https://hyperlane.superbridge.app
2. Click the ⚙️ Settings icon → **Warp Routes** → **Customize**
3. Paste the contents of `~/.hyperlane/deployments/warp_routes/MARS/marscredit-base-config.yaml`
4. Click Save — you get a shareable link like `https://hyperlane.superbridge.app/?hyperlaneWarpRoutes=<id>`

For a production branded UI, clone the Hyperlane warp UI template:
```bash
git clone https://github.com/hyperlane-xyz/hyperlane-warp-ui-template
```
Edit `./src/consts/tokens.ts` with your wMARS and other token addresses, and `./src/consts/chains.ts` with the Mars chain config. Deploy to Vercel or your own host.

---

## Phase 9: Apply to Coinbase

Once wMARS has:
- A live ERC-20 contract address on Base
- An active Uniswap liquidity pool with real volume
- Functioning two-way bridge

Submit a listing application at: **https://www.coinbase.com/listings**

Key information to have ready:
- wMARS contract address on Base
- Total supply and circulating supply
- Team information (KYC required by Coinbase)
- GitHub repository
- Whitepaper / project description
- Trading volume and holder data
- Bridge/Warp route config for transparency

---

## Summary of All Contract Addresses to Track

As you complete each phase, fill in this table:

| Asset | Chain | Contract Address | Type |
|-------|-------|-----------------|------|
| Mars Mailbox | marscredit | TBD after Phase 3 | Core |
| wMARS | Base | TBD after Phase 4 | Synthetic ERC-20 |
| USDC vault | Base | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` | Collateral |
| USDC.mars | marscredit | TBD after Phase 6a | Synthetic |
| USDT vault | Ethereum | `0xdAC17F958D2ee523a2206206994597C13D831ec7` | Collateral |
| USDT.mars | marscredit | TBD after Phase 6b | Synthetic |
| WBTC vault | Ethereum | `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599` | Collateral |
| WBTC.mars | marscredit | TBD after Phase 6c | Synthetic |
| WETH vault | Base | `0x4200000000000000000000000000000000000006` | Collateral |
| WETH.mars | marscredit | TBD after Phase 6d | Synthetic |

---

## Known Issues / Watch Out For

- **`eth_getStorageAt` compatibility:** Some non-standard EVM chains don't support this RPC method. If Phase 3 fails with RPC errors, check Hyperlane's troubleshooting guide at https://docs.hyperlane.xyz/docs/guides/deploy-hyperlane-troubleshooting
- **Gas token balance management:** The relayer needs native MARS on the Mars chain and ETH on Base to pay for delivery transactions. If using Imperator, they handle this. If self-relaying, keep wallets funded on all destination chains.
- **USDT specifics:** Tether has non-standard approval logic (sets allowance to 0 before increasing). Test small amounts first.
- **Chain ID conflicts:** Verify the Mars chain ID isn't already in use by another EVM chain. Reference: https://chainlist.org
- **One-time registration:** Warp Route registrations on a given mailbox can only be done once per token. Deploy carefully and test on testnet if possible before mainnet.
- **Superbridge production:** For a permanent branded bridge page, contact alex@superbridge.app to get a dedicated landing page like `marscredit.superbridge.app`.

---

## Resources

| Resource | URL |
|----------|-----|
| Hyperlane CLI reference | https://docs.hyperlane.xyz/docs/reference/developer-tools/cli |
| Hyperlane Registry | https://github.com/hyperlane-xyz/hyperlane-registry |
| Hyperlane Explorer | https://explorer.hyperlane.xyz |
| Hyperlane Discord / GitHub Discussions | https://github.com/hyperlane-xyz/hyperlane-monorepo/discussions |
| Imperator Relayer | https://www.imperator.co/products/hyperlane |
| Superbridge UI | https://hyperlane.superbridge.app |
| Warp UI Template | https://github.com/hyperlane-xyz/hyperlane-warp-ui-template |
| Uniswap V3 on Base | https://app.uniswap.org |
| Coinbase Asset Listing | https://www.coinbase.com/listings |
| Mars Credit GitHub | https://github.com/marscredit |
| Mars Credit Blockscan | https://blockscan.marscredit.xyz |