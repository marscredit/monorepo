/**
 * Facts for running a Mars Credit node / miner. Mining is solo only:
 * your own local node, never a pool, never the public RPC.
 */

export const CHAIN_ID = 110110
export const SYMBOL = "MARS"
export const DECIMALS = 18
export const BLOCK_REWARD = "2"
export const FORK_BLOCK = 5_145_000
/** mars-fast1 fork hash at FORK_BLOCK — pin so new nodes stay on the public chain. */
export const FORK_HASH = "0x622f1c0928884b81e631d50b69f44c58fd071852959c09c221c021ddd6571e09"
export const REQUIRED_BLOCKS_FLAG = `--eth.requiredblocks ${FORK_BLOCK}=${FORK_HASH}`
export const LOCAL_RPC = "http://127.0.0.1:8545"
export const LOCAL_GETH_HTTP_PORT = 8545

export const GO_MARS_REPO = "https://github.com/marscredit/go-marscredit"
export const GO_MARS_README = "https://github.com/marscredit/go-marscredit#building-the-source"
export const GO_MARS_MINER_DOCS = "https://github.com/marscredit/go-marscredit/blob/mars-fast-v1/docs/MINING.md"
export const GO_MARS_FAST_DOCS = "https://github.com/marscredit/go-marscredit/blob/mars-fast-v1/MARS_FAST.md"
export const GO_MARS_RELEASES = "https://github.com/marscredit/go-marscredit/releases"
export const GO_MARS_GENESIS =
  "https://raw.githubusercontent.com/marscredit/go-marscredit/mars-fast-v1/genesis.json"
export const GO_MARS_STATIC_NODES =
  "https://raw.githubusercontent.com/marscredit/go-marscredit/mars-fast-v1/static-nodes.json"
export const CHAINLIST = "https://chainlist.org/chain/110110"

export const GETH_RELEASE_TAG = "v1.10.18-mars-fast1"
export const GETH_RELEASE = `https://github.com/marscredit/go-marscredit/releases/tag/${GETH_RELEASE_TAG}`
export const GETH_SHA256SUMS_URL =
  `https://github.com/marscredit/go-marscredit/releases/download/${GETH_RELEASE_TAG}/SHA256SUMS`

export const GETH_LINUX_AMD64 = {
  filename: "geth-linux-amd64",
  url: `https://github.com/marscredit/go-marscredit/releases/download/${GETH_RELEASE_TAG}/geth-linux-amd64`,
  sha256: "13a0700a364a17f1504c75c73fb7c132ef3fc8d15b88a12623d2a533ca3dcf56",
} as const

export const GETH_LINUX_ARM64 = {
  filename: "geth-linux-arm64",
  url: `https://github.com/marscredit/go-marscredit/releases/download/${GETH_RELEASE_TAG}/geth-linux-arm64`,
  sha256: "f84779f88d87926112362724176b2fc30fa43d985fc848d2e344f79f9ccefb46",
} as const

/**
 * Bootnodes used by the Mars Credit Miner app (TCP proxies). Discovery (UDP)
 * does not pass Railway's TCP proxies, so these should also go in
 * `<datadir>/geth/static-nodes.json`.
 */
export const BOOTNODES = [
  "enode://478d4dd8e56a6419d32a7f1166983566bf5c184d1fd97036bca04a2f8e5a6e7546492e38ebf16fbdb0c838c9d127ee70b5de6a7e1cdc5d337adc616f91baf98f@interchange.proxy.rlwy.net:42747",
  "enode://ca3639067a580a0f1db7412aeeef6d5d5e93606ed7f236a5343fe0d1115fb8c2bea2a22fa86e9794b544f886a4cb0de1afcbccf60960802bf00d81dab9553ec9@roundhouse.proxy.rlwy.net:26254",
] as const

export const BOOTNODES_FLAG = BOOTNODES.join(",")

export const DOWNLOAD_GETH_AMD64 = `curl -fL -O ${GETH_LINUX_AMD64.url}
curl -fL -O ${GETH_SHA256SUMS_URL}
grep ${GETH_LINUX_AMD64.filename} SHA256SUMS | sha256sum -c
chmod +x ${GETH_LINUX_AMD64.filename}`

export const DOWNLOAD_GETH_ARM64 = `curl -fL -O ${GETH_LINUX_ARM64.url}
curl -fL -O ${GETH_SHA256SUMS_URL}
grep ${GETH_LINUX_ARM64.filename} SHA256SUMS | sha256sum -c
chmod +x ${GETH_LINUX_ARM64.filename}`

export const FETCH_NETWORK_FILES = `curl -fL -o genesis.json ${GO_MARS_GENESIS}
curl -fL -o static-nodes.json ${GO_MARS_STATIC_NODES}
mkdir -p "$HOME/.marscredit/geth"
cp static-nodes.json "$HOME/.marscredit/geth/static-nodes.json"`

export const BUILD_GETH = `git clone https://github.com/marscredit/go-marscredit.git
cd go-marscredit
git checkout mars-fast-v1
make geth`

export const INIT_NODE_BIN = `./geth-linux-amd64 --datadir "$HOME/.marscredit" init genesis.json`

export const INIT_NODE = `./build/bin/geth --datadir "$HOME/.marscredit" init genesis.json`

const RUN_FLAGS = `--datadir "$HOME/.marscredit" \\
  --networkid ${CHAIN_ID} \\
  ${REQUIRED_BLOCKS_FLAG} \\
  --syncmode full \\
  --http --http.addr 127.0.0.1 --http.port ${LOCAL_GETH_HTTP_PORT} \\
  --http.api eth,net,web3,miner \\
  --bootnodes "${BOOTNODES_FLAG}" \\
  --mine --miner.threads 1 \\
  --miner.etherbase 0xYOUR_REWARD_ADDRESS`

export const RUN_CPU_MINER_BIN = `./geth-linux-amd64 \\
  ${RUN_FLAGS}`

export const RUN_CPU_MINER = `./build/bin/geth \\
  ${RUN_FLAGS}`

export const ETHMINER_LOCAL = `ethminer -P ${LOCAL_RPC}`

export const STATIC_NODES_JSON = JSON.stringify([...BOOTNODES], null, 2)
