# Mars Credit Monorepo

**Mars Credit** is a mineable, proof-of-work Layer-1 blockchain — a fork of Ethereum (Geth v1.10.18) with chain ID `110110`.

This monorepo contains the miner apps, block explorer, public website, and brand assets.

## Projects

| Directory | Description |
|---|---|
| [`miner-app/`](miner-app/) | Cross-platform Electron miner (macOS + Windows). The main downloadable miner for end users. |
| [`miner-apple-silicon/`](miner-apple-silicon/) | Native Swift/SwiftUI macOS miner optimized for Apple Silicon (M1/M2/M3). |
| [`frontend/`](frontend/) | Blockscout-based blockchain explorer — deployed at [blockscan.marscredit.xyz](https://blockscan.marscredit.xyz). |
| [`website-public/`](website-public/) | Public marketing website for Mars Credit. |
| [`brandassets/`](brandassets/) | Brand assets, logos, and Midjourney style reference. |

## Download the Miner

Pre-built binaries for the cross-platform Electron miner:

- **macOS (Apple Silicon):** [`Mars Credit Miner-1.0.0-arm64.dmg`](miner-app/release/Mars%20Credit%20Miner-1.0.0-arm64.dmg)
- **macOS (Intel):** [`Mars Credit Miner-1.0.0.dmg`](miner-app/release/Mars%20Credit%20Miner-1.0.0.dmg)
- **Windows:** [`Mars Credit Miner Setup 1.0.0.exe`](miner-app/release/Mars%20Credit%20Miner%20Setup%201.0.0.exe)

> Links above will work once the builds are committed to the repo. See [Building from source](#building-from-source) to build yourself.

## Quick Start

1. Download the miner for your platform (see above).
2. Install and launch the app.
3. The app downloads a compatible Geth binary on first run (~30 MB).
4. Set up a wallet — generate a new one, import by mnemonic/private key, or paste an existing address.
5. Click **Start mining** and you're on the Mars Credit network.

Data and config are stored in `~/.marscredit/` (macOS/Linux) or `%USERPROFILE%\.marscredit\` (Windows).

## Building from Source

### Electron Miner (miner-app)

```bash
cd miner-app
npm install

# Development
npm run electron:dev

# Production builds
npm run build:mac    # macOS DMG (Intel + Apple Silicon)
npm run build:win    # Windows NSIS installer
```

Output goes to `miner-app/release/`.

### Native macOS Miner (miner-apple-silicon)

```bash
cd miner-apple-silicon
swift build -c release
./create_app.sh               # Creates .app bundle
./scripts/build_app_dmg.sh    # Creates DMG
```

Output goes to `miner-apple-silicon/builds/build29/`.

## Live Services

- **Block Explorer:** [blockscan.marscredit.xyz](https://blockscan.marscredit.xyz)
- **Public RPC:** `https://rpc.marscredit.xyz`
- **Chain ID:** `110110`
- **Network ID:** `110110`
- **Block Reward:** 3 MARS

## Deployment

The block explorer and public website deploy to Railway using the root-level Dockerfiles:

- `Dockerfile.frontend` — Blockscout block explorer
- `Dockerfile.web` — Public website

Build from the repo root: `docker build -f Dockerfile.frontend .`

## License

MIT
