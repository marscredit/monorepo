import type { Metadata } from "next"
import { Navigation } from "@/components/navigation"
import { tokenomics as t, explorerTx, explorerAddress, links } from "@/lib/config"

export const metadata: Metadata = {
  title: "Tokenomics | Mars Credit",
  description:
    "MARS supply explained: 47.304B genesis allocation, 47B burned on-chain, ~270M airdropped, and everything else solo-mined at 2 MARS per block.",
}

const short = (h: string) => `${h.slice(0, 10)}…${h.slice(-6)}`

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-mars-300 underline underline-offset-4 hover:text-mars-200 break-all">
      {children}
    </a>
  )
}

const facts = [
  { label: "Network", value: "Mineable EVM Proof-of-Work Layer-1" },
  { label: "Chain ID", value: String(t.chainId) },
  { label: "Native asset", value: "MARS" },
  { label: "Block reward", value: `${t.blockReward} MARS per block` },
  { label: "Mining", value: "Solo mining only" },
]

export default function TokenomicsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container max-w-4xl mx-auto px-4 pt-36 pb-24 space-y-12">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-text-hi">Tokenomics</h1>
          <p className="text-lg text-text-med leading-relaxed">
            The short version: <strong>47 billion MARS burned, about 270 million airdropped, and the rest mined.</strong>{" "}
            Every step below links to the transaction or address on the Mars Credit explorer so you can check it yourself.
          </p>
        </header>

        <section className="grid sm:grid-cols-2 gap-4">
          {facts.map((f) => (
            <div key={f.label} className="rounded-xl border border-white/10 p-4">
              <div className="text-sm text-text-med">{f.label}</div>
              <div className="text-lg font-semibold text-text-hi">{f.value}</div>
            </div>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-text-hi">1. Genesis allocation</h2>
          <p className="text-text-med leading-relaxed">
            The genesis block allocated <strong>{t.genesisAllocation} MARS</strong> to a single address. We say this
            plainly rather than claim “no premine”: there was a genesis allocation, and almost all of it was destroyed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-text-hi">2. The burn: 47,000,000,000 MARS</h2>
          <p className="text-text-med leading-relaxed">
            On {t.burnDate}, {t.burnAmount} MARS was sent from <Ext href={explorerAddress(t.burnFrom)}>{short(t.burnFrom)}</Ext>{" "}
            to the burn address <Ext href={explorerAddress(t.burnAddress)}>{t.burnAddress}</Ext>, which has no known private key.
            Those coins can never move again.
          </p>
          <p className="text-text-med">
            Burn transaction: <Ext href={explorerTx(t.burnTx)}>{t.burnTx}</Ext>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-text-hi">3. Community airdrop: ~270,000,000 MARS</h2>
          <p className="text-text-med leading-relaxed">
            The treasury address <Ext href={explorerAddress(t.treasury)}>{t.treasury}</Ext> received{" "}
            {t.treasuryReceived} MARS and distributed roughly {t.airdropped} MARS to the community by airdrop.
            The treasury has since been drawn down to a near-zero balance; its full history is public on the explorer.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-text-hi">4. Everything else is mined</h2>
          <p className="text-text-med leading-relaxed">
            All other MARS enters circulation through Proof-of-Work block rewards of {t.blockReward} MARS per block. Mining is
            solo only: run a node and mine directly with the open-source client on{" "}
            <Ext href={links.mining}>GitHub</Ext>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-text-hi">Verify it yourself</h2>
          <ul className="list-disc pl-6 text-text-med space-y-1">
            <li>Explorer: <Ext href={t.explorer}>{t.explorer}</Ext></li>
            <li>RPC: <Ext href={links.rpc}>{links.rpc}</Ext> (chain ID {t.chainId})</li>
            <li>Burn transaction: <Ext href={explorerTx(t.burnTx)}>{short(t.burnTx)}</Ext></li>
            <li>Burn address: <Ext href={explorerAddress(t.burnAddress)}>{short(t.burnAddress)}</Ext></li>
            <li>Treasury: <Ext href={explorerAddress(t.treasury)}>{short(t.treasury)}</Ext></li>
          </ul>
          <p className="text-sm text-text-med/70 pt-4">
            This page describes how MARS supply was created. It is not financial advice or an offer of any kind.
          </p>
        </section>
      </main>
    </div>
  )
}
