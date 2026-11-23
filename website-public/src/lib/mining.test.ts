import { describe, expect, it } from "vitest"
import {
  CHAIN_ID,
  ETHMINER_LOCAL,
  FORK_HASH,
  LOCAL_RPC,
  REQUIRED_BLOCKS_FLAG,
  RUN_CPU_MINER,
} from "./mining"

const FORK_PIN = "--eth.requiredblocks 5145000=0x622f1c0928884b81e631d50b69f44c58fd071852959c09c221c021ddd6571e09"

describe("mining copy invariants", () => {
  it("CPU miner command binds HTTP to localhost and never the public RPC", () => {
    expect(RUN_CPU_MINER).toContain("--http.addr 127.0.0.1")
    expect(RUN_CPU_MINER).toContain("--mine")
    expect(RUN_CPU_MINER).not.toMatch(/rpc\.marscredit\.xyz/)
    expect(RUN_CPU_MINER).not.toMatch(/stratum/i)
    expect(RUN_CPU_MINER).not.toMatch(/pool/i)
  })

  it("pins mars-fast1 so new nodes stay on the public chain", () => {
    expect(FORK_HASH).toBe("0x622f1c0928884b81e631d50b69f44c58fd071852959c09c221c021ddd6571e09")
    expect(REQUIRED_BLOCKS_FLAG).toBe(FORK_PIN)
    expect(RUN_CPU_MINER).toContain(FORK_PIN)
    expect(RUN_CPU_MINER).toContain(`--networkid ${CHAIN_ID}`)
  })

  it("GPU miner points at local getWork only", () => {
    expect(ETHMINER_LOCAL).toBe(`ethminer -P ${LOCAL_RPC}`)
    expect(LOCAL_RPC).toBe("http://127.0.0.1:8545")
    expect(ETHMINER_LOCAL).not.toMatch(/rpc\.marscredit\.xyz/)
  })
})
