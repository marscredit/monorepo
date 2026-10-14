export const site = {
  name: "Mars Credit",
  url: "https://marscredit.xyz",
  twitter: "marscredit",
  description: "Mineable, EVM-compatible Layer‑1 tuned for the Red Planet.",
} as const

export const network = {
  chainId: Number(process.env.MARS_CHAIN_ID ?? 110110),
  name: process.env.MARS_CHAIN_NAME ?? "Mars Credit",
  symbol: process.env.MARS_SYMBOL ?? "MARS",
  decimals: Number(process.env.MARS_DECIMALS ?? 18),
  rpc: [
    process.env.MARS_RPC_PRIMARY!,
    process.env.MARS_RPC_FALLBACK!,
  ].filter(Boolean),
  explorer: process.env.MARS_EXPLORER_URL ?? "https://blockscan.marscredit.xyz",
} as const

export const links = {
  github: "https://github.com/marscredit",
  discord: "https://discord.gg/57bg77dCV8",
  twitter: "https://x.com/marscredit",
  telegram: "https://t.me/marscreditxyz",
  telegramGroup: "https://t.me/MarscreditOfficial",
  instagram: "https://instagram.com/marscredit.xyz",
  blockscan: "https://blockscan.marscredit.xyz/",
  mining: "https://github.com/marscredit/go-marscredit",
  rpc: "https://rpc.marscredit.xyz/",
  whitepaper: "/media/6801abc67810b757a599364a_Mars%2520Credit%2520-%2520Whitepaper.pdf.pdf",
} as const


const EXPLORER = "https://blockscan.marscredit.xyz"

export const tokenomics = {
  explorer: EXPLORER,
  genesisAllocation: "47,304,000,000",
  burnAmount: "47,000,000,000",
  burnDate: "2024-07-09",
  burnTx: "0xbb290c55acbbaedbf75d2ffbc3b252795f55d85b1a7184069fb3bc1550ac5d8e",
  burnFrom: "0xD21602919e81e32A456195e9cE34215Af504535A",
  burnAddress: "0x000000000000000000000000000000000000dEaD",
  treasury: "0x6039E53688Da87EBF30B0C84d22FCd6707b0C564",
  treasuryReceived: "281,450,000",
  airdropped: "~270,000,000",
  blockReward: "2",
  chainId: 110110,
} as const

export const explorerTx = (hash: string) => `${EXPLORER}/tx/${hash}`
export const explorerAddress = (addr: string) => `${EXPLORER}/address/${addr}`
