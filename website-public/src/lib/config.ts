export const site = {
  name: "Mars Credit",
  url: "https://marscredit.org",
  twitter: "marscredit",
  description: "Mineable, EVM-compatible Layer‑1 tuned for the Red Planet.",
} as const

export const network = {
  chainId: Number(process.env.MARS_CHAIN_ID ?? 12345),
  name: process.env.MARS_CHAIN_NAME ?? "Mars Credit",
  symbol: process.env.MARS_SYMBOL ?? "MARS",
  decimals: Number(process.env.MARS_DECIMALS ?? 18),
  rpc: [
    process.env.MARS_RPC_PRIMARY!,
    process.env.MARS_RPC_FALLBACK!,
  ].filter(Boolean),
  explorer: process.env.MARS_EXPLORER_URL ?? "https://explorer.marscredit.org",
} as const

export const links = {
  github: "https://github.com/marscredit",
  docs: "https://docs.marscredit.org",
  discord: "https://discord.gg/57bg77dCV8",
  twitter: "https://x.com/marscredit",
  telegram: "https://t.me/marscreditxyz",
  telegramGroup: "https://t.me/MarscreditOfficial",
  instagram: "https://instagram.com/marscredit.xyz",
  blockscan: "https://blockscan.marscredit.xyz/",
  bridge: "https://defi.marscredit.xyz/bridge",
  grants: "https://defi.marscredit.xyz/grants",
  mining: "https://github.com/marscredit/mining-app",
  trade: "https://www.geckoterminal.com/solana/pools/6xqVAuh2gyBDrs3x2KTQcEkWAmDeHxif2AMUZRGe9w5k",
  rpc: "https://rpc.marscredit.xyz/",
  whitepaper: "/media/6801abc67810b757a599364a_Mars%20Credit%20-%20Whitepaper.pdf.pdf",
} as const

