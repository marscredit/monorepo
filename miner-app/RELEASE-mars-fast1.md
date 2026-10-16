# Miner app 1.1.0: mars-fast1 geth (2 s blocks)

Every miner has to run geth `1.10.18-mars-fast1`, built from go-marscredit branch `mars-fast-v1` at commit 4d549c7f, **before** fork block 5,145,000. A miner left on stock geth splits off the chain at the fork.

## What changed
- `MinerInstance.ts`: bootnodes are node99 (`interchange.proxy.rlwy.net:42747`) and node2 (`roundhouse.proxy.rlwy.net:26254`), also written to `<datadir>/geth/static-nodes.json` so geth re-dials them over TCP after every restart. Discovery doesn't work through Railway's TCP-only proxies.
- `GethManager.ts`: every geth path must report `1.10.18-mars-fast1`, so an old stock install gets replaced. macOS and Windows install the geth bundled in the app; Windows and Linux fall back to the go-marscredit release `v1.10.18-mars-fast1` download with a SHA-256 check. Rosetta is only required when the geth to run is x86_64 (the Apple Silicon build bundles a native arm64 geth).
- Per-arch bundling: `resources/geth/darwin-arm64/geth`, `resources/geth/darwin-x64/geth`, `resources/geth/win-x64/geth.exe` (gitignored). `npm run prepare-geth [assets-dir]` fills them from the release assets and checks SHA-256.
- Artifact names: `Mars-Credit-Miner-mac-arm64.dmg`, `Mars-Credit-Miner-mac-x64.dmg`, `Mars-Credit-Miner-win-x64-setup.exe` (no version in the name, so `releases/latest/download/...` URLs stay stable).

## Build
```
npm ci
npm run prepare-geth /path/to/go-marscredit/release/assets   # or no arg to download from the release
npx tsc && npx tsc -p tsconfig.electron.json && npx vite build
npx electron-builder --win --x64 --publish never    # Linux needs wine
CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac --publish never   # on a Mac
```
Without a Developer ID certificate the mac apps are unsigned; Apple Silicon refuses an unsigned/broken-signature app, so ad-hoc sign and rebuild the DMGs:
```
codesign --force --deep --sign - "release/mac/Mars Credit Miner.app"
codesign --force --deep --sign - "release/mac-arm64/Mars Credit Miner.app"
npx electron-builder --mac dmg --x64   --prepackaged "release/mac/Mars Credit Miner.app" --publish never
npx electron-builder --mac dmg --arm64 --prepackaged "release/mac-arm64/Mars Credit Miner.app" --publish never
```
1.1.0 was built this way: Windows on Linux (wine), macOS on an Intel Mac, ad-hoc signed, not notarized. Gatekeeper warns on first open (right-click > Open, or `xattr -dr com.apple.quarantine "/Applications/Mars Credit Miner.app"`). Windows SmartScreen warns too (unsigned).
