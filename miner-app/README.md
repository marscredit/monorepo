# Mars Credit Miner

Cross-platform desktop app to mine Mars Credit (MARS) on the Mars Credit network. Supports **macOS (Intel and Apple Silicon)** at launch; Windows support is planned.

## Features

- **Wallet**: Generate a new BIP39 wallet, import by mnemonic or private key, or use an address-only (no keys stored).
- **Geth**: Downloads the correct Geth binary for your platform on first run (~30MB).
- **Multi-miner tabs**: Run multiple miners from one app (e.g. one per GPU or CPU profile).
- **Mars network**: Connects to chain ID 110110 with built-in genesis and bootnodes.
- **Sleep/wake**: On macOS, mining is paused on sleep and resumed on wake.

## Development

```bash
npm install
npm run electron:dev
```

This starts the Vite dev server and Electron; the app loads from `http://localhost:5173`.

## Build

```bash
npm run electron:build
```

Or build only for current platform:

```bash
npm run build:mac    # macOS (x64 + arm64 DMGs)
npm run build:win    # Windows (when added)
```

Output is in `release/` (e.g. `Mars Credit Miner-1.0.0-arm64.dmg`).

## First run

1. **Welcome** – Intro to Mars Credit mining.
2. **Geth download** – One-time download of the Geth binary for your OS/arch.
3. **Wallet** – Generate, import (mnemonic or private key), or paste an address only.
4. **Miner config** – Set mining threads (default 1).
5. **Dashboard** – Start/stop mining, view logs, balance, and sync status.

Data and config are stored under `~/.marscredit/` (or `%USERPROFILE%\.marscredit` on Windows).

## Tech stack

- **Electron** – Main process (Node) + renderer (React).
- **React + TypeScript + Vite** – UI.
- **Tailwind CSS** – Styling (Mars dark theme).
- **Zustand** – UI state.
- **ethers** – Wallet (BIP39, keystore).
- **electron-store** – Persisted settings.

## Project layout

- `electron/` – Main process: GethManager, MinerInstance, MinerService, WalletService, NetworkService, ConfigStore, IPC.
- `src/` – Renderer: onboarding wizard, tab bar, miner tab, log viewer, status bar.
- `resources/` – Genesis block (`genesis.json`) and app icon.
