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
export const GO_MARS_MINER_DOCS = "https://github.com/marscredit/go-marscredit#running-a-private-miner"
export const GO_MARS_FAST_DOCS = "https://github.com/marscredit/go-marscredit/blob/mars-fast-v1/MARS_FAST.md"
export const GO_MARS_RELEASES = "https://github.com/marscredit/go-marscredit/releases"
export const GO_MARS_GENESIS = "https://github.com/marscredit/go-marscredit/blob/master/genesis.json"
export const CHAINLIST = "https://chainlist.org/chain/110110"

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

export const BUILD_GETH = `git clone https://github.com/marscredit/go-marscredit.git
cd go-marscredit
git checkout mars-fast-v1
make geth`

export const INIT_NODE = `./build/bin/geth --datadir "$HOME/.marscredit" init genesis.json`

export const RUN_CPU_MINER = `./build/bin/geth \\
  --datadir "$HOME/.marscredit" \\
  --networkid ${CHAIN_ID} \\
  ${REQUIRED_BLOCKS_FLAG} \\
  --syncmode full \\
  --http --http.addr 127.0.0.1 --http.port ${LOCAL_GETH_HTTP_PORT} \\
  --http.api eth,net,web3,miner \\
  --bootnodes "${BOOTNODES_FLAG}" \\
  --mine --miner.threads 1 \\
  --miner.etherbase 0xYOUR_REWARD_ADDRESS`

export const ETHMINER_LOCAL = `ethminer -P ${LOCAL_RPC}`

export const STATIC_NODES_JSON = JSON.stringify([...BOOTNODES], null, 2)
