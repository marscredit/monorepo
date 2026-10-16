# Miner app release for the mars-fast1 fork (2 s blocks)

Every miner has to run geth `1.10.18-mars-fast1`, built from go-marscredit branch `mars-fast-v1` at commit 4d549c7f, **before** the fork block (`params.MarsFastForkBlock`; the height is still a placeholder). A miner left on stock geth splits off the chain at the fork.

## What this PR changes
- `MinerInstance.ts`: bootnodes are now node99 (`interchange.proxy.rlwy.net:42747`) and node2 (`roundhouse.proxy.rlwy.net:26254`). The same two nodes are written to `<datadir>/geth/static-nodes.json`, so geth re-dials them over TCP after every restart. Discovery doesn't work through Railway's TCP-only proxies.
- `GethManager.ts`: Linux and Windows downloads come from the go-marscredit GitHub release `v1.10.18-mars-fast1`, with a SHA-256 check. They no longer come from gethstore 1.16.8, which can't mine. Every path (bundled, system, existing install) now requires `geth version` to report `1.10.18-mars-fast1`, so an old stock install gets replaced.

## Manual steps (binaries can't go through this PR)
1. Copy the darwin build into `miner-app/resources/geth/geth`. Use `geth-darwin-amd64`, which matches today's Rosetta setup, or `geth-darwin-arm64` for native Apple Silicon (not yet tested on a Mac). Both were cross-compiled on Linux with `CGO_ENABLED=0 GOOS=darwin GOARCH=amd64|arm64 go build -trimpath ./cmd/geth`. To build on a Mac with Go 1.17 instead: `git checkout 4d549c7f && make geth`.
2. Publish the GitHub release `v1.10.18-mars-fast1` on marscredit/go-marscredit with assets `geth-linux-amd64.tar.gz`, `geth-linux-arm64.tar.gz` and `geth-windows-amd64.zip`. These must be byte-identical to the files whose SHA-256 values are in GethManager.ts.
3. The bundled-geth search path also falls back to `miner-apple-silicon/Resources/geth/geth` in dev mode. Replace that file too, or dev builds will refuse it.
4. Rebuild the DMG and EXE, then upload them with `scripts/upload-releases-to-s3.mjs`.

## Not covered
- macOS Gatekeeper and quarantine handling for an unsigned cross-compiled geth. The arm64 build is ad-hoc signed by the Go linker; whether the app's spawn path accepts it is not verified.
- Automated tests: miner-app has no test runner yet. The electron code type-checks with `tsc -p tsconfig.electron.json --noEmit`.
