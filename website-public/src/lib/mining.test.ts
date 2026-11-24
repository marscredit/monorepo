import { describe, expect, it } from "vitest"
import {
  BOOTNODES,
  CHAIN_ID,
  DOWNLOAD_GETH_AMD64,
  DOWNLOAD_GETH_ARM64,
  ETHMINER_LOCAL,
  FETCH_NETWORK_FILES,
  FORK_HASH,
  GETH_LINUX_AMD64,
  GETH_LINUX_ARM64,
  GETH_RELEASE,
  LOCAL_RPC,
  REQUIRED_BLOCKS_FLAG,
  RUN_CPU_MINER,
  RUN_CPU_MINER_BIN,
} from "./mining"

const FORK_PIN = "--eth.requiredblocks 5145000=0x622f1c0928884b81e631d50b69f44c58fd071852959c09c221c021ddd6571e09"

describe("mining copy invariants", () => {
  it("CPU miner command binds HTTP to localhost and never the public RPC", () => {
    expect(RUN_CPU_MINER_BIN).toContain("--http.addr 127.0.0.1")
    expect(RUN_CPU_MINER_BIN).toContain("--mine")
    expect(RUN_CPU_MINER_BIN).not.toMatch(/rpc\.marscredit\.xyz/)
    expect(RUN_CPU_MINER_BIN).not.toMatch(/stratum/i)
    expect(RUN_CPU_MINER_BIN).not.toMatch(/pool/i)
    expect(RUN_CPU_MINER).toContain("--http.addr 127.0.0.1")
    expect(RUN_CPU_MINER).not.toMatch(/rpc\.marscredit\.xyz/)
  })

  it("pins mars-fast1 so new nodes stay on the public chain", () => {
    expect(FORK_HASH).toBe("0x622f1c0928884b81e631d50b69f44c58fd071852959c09c221c021ddd6571e09")
    expect(REQUIRED_BLOCKS_FLAG).toBe(FORK_PIN)
    expect(RUN_CPU_MINER_BIN).toContain(FORK_PIN)
    expect(RUN_CPU_MINER_BIN).toContain(`--networkid ${CHAIN_ID}`)
    expect(RUN_CPU_MINER).toContain(FORK_PIN)
    expect(RUN_CPU_MINER).toContain(`--networkid ${CHAIN_ID}`)
  })

  it("keeps the two current Railway peers unchanged", () => {
    expect(BOOTNODES).toEqual([
      "enode://478d4dd8e56a6419d32a7f1166983566bf5c184d1fd97036bca04a2f8e5a6e7546492e38ebf16fbdb0c838c9d127ee70b5de6a7e1cdc5d337adc616f91baf98f@interchange.proxy.rlwy.net:42747",
      "enode://ca3639067a580a0f1db7412aeeef6d5d5e93606ed7f236a5343fe0d1115fb8c2bea2a22fa86e9794b544f886a4cb0de1afcbccf60960802bf00d81dab9553ec9@roundhouse.proxy.rlwy.net:26254",
    ])
    expect(RUN_CPU_MINER_BIN).toContain(BOOTNODES[0])
    expect(RUN_CPU_MINER_BIN).toContain(BOOTNODES[1])
  })

  it("points Linux at the official v1.10.18-mars-fast1 binaries with checksums", () => {
    expect(GETH_RELEASE).toBe("https://github.com/marscredit/go-marscredit/releases/tag/v1.10.18-mars-fast1")
    expect(GETH_LINUX_AMD64.url).toBe(
      "https://github.com/marscredit/go-marscredit/releases/download/v1.10.18-mars-fast1/geth-linux-amd64",
    )
    expect(GETH_LINUX_AMD64.sha256).toBe("13a0700a364a17f1504c75c73fb7c132ef3fc8d15b88a12623d2a533ca3dcf56")
    expect(GETH_LINUX_ARM64.url).toBe(
      "https://github.com/marscredit/go-marscredit/releases/download/v1.10.18-mars-fast1/geth-linux-arm64",
    )
    expect(GETH_LINUX_ARM64.sha256).toBe("f84779f88d87926112362724176b2fc30fa43d985fc848d2e344f79f9ccefb46")
    expect(DOWNLOAD_GETH_AMD64).toContain("sha256sum -c")
    expect(DOWNLOAD_GETH_AMD64).toContain("chmod +x geth-linux-amd64")
    expect(DOWNLOAD_GETH_ARM64).toContain("sha256sum -c")
    expect(DOWNLOAD_GETH_ARM64).toContain("chmod +x geth-linux-arm64")
    expect(FETCH_NETWORK_FILES).toContain(
      "https://raw.githubusercontent.com/marscredit/go-marscredit/mars-fast-v1/genesis.json",
    )
    expect(FETCH_NETWORK_FILES).toContain(
      "https://raw.githubusercontent.com/marscredit/go-marscredit/mars-fast-v1/static-nodes.json",
    )
  })

  it("GPU miner points at local getWork only", () => {
    expect(ETHMINER_LOCAL).toBe(`ethminer -P ${LOCAL_RPC}`)
    expect(LOCAL_RPC).toBe("http://127.0.0.1:8545")
    expect(ETHMINER_LOCAL).not.toMatch(/rpc\.marscredit\.xyz/)
  })
})
