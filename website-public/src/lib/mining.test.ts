import { describe, expect, it } from "vitest"
import { ETHMINER_LOCAL, LOCAL_RPC, RUN_CPU_MINER } from "./mining"

describe("mining copy invariants", () => {
  it("CPU miner command binds HTTP to localhost and never the public RPC", () => {
    expect(RUN_CPU_MINER).toContain("--http.addr 127.0.0.1")
    expect(RUN_CPU_MINER).toContain("--mine")
    expect(RUN_CPU_MINER).not.toMatch(/rpc\.marscredit\.xyz/)
    expect(RUN_CPU_MINER).not.toMatch(/stratum/i)
    expect(RUN_CPU_MINER).not.toMatch(/pool/i)
    // Full fork hash is not in-repo; do not invent --eth.requiredblocks.
    expect(RUN_CPU_MINER).not.toMatch(/requiredblocks/)
  })

  it("GPU miner points at local getWork only", () => {
    expect(ETHMINER_LOCAL).toBe(`ethminer -P ${LOCAL_RPC}`)
    expect(LOCAL_RPC).toBe("http://127.0.0.1:8545")
    expect(ETHMINER_LOCAL).not.toMatch(/rpc\.marscredit\.xyz/)
  })
})
