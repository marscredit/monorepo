import type { Metadata } from "next"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { CopyBlock } from "@/components/copy-block"
import { DOWNLOADS } from "@/lib/download"
import { links } from "@/lib/config"
import {
  BLOCK_REWARD,
  BOOTNODES,
  BUILD_GETH,
  CHAIN_ID,
  CHAINLIST,
  DECIMALS,
  ETHMINER_LOCAL,
  FORK_BLOCK,
  GO_MARS_FAST_DOCS,
  GO_MARS_GENESIS,
  GO_MARS_MINER_DOCS,
  GO_MARS_README,
  GO_MARS_RELEASES,
  GO_MARS_REPO,
  INIT_NODE,
  LOCAL_RPC,
  REQUIRED_BLOCKS_FLAG,
  RUN_CPU_MINER,
  STATIC_NODES_JSON,
  SYMBOL,
} from "@/lib/mining"

export const metadata: Metadata = {
  title: "Start Mining",
  description:
    "Solo-mine Mars Credit (MARS) on your own node. Mac and Windows apps, Linux CLI, and GPU/HiveOS against localhost only.",
}

function Ext({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-mars-300 underline underline-offset-4 hover:text-mars-200 break-all">
      {children}
    </a>
  )
}

const facts = [
  { label: "Network", value: "Mars Credit · Ethash Proof-of-Work L1" },
  { label: "Chain ID", value: String(CHAIN_ID) },
  { label: "Native asset", value: `${SYMBOL} (18 decimals)` },
  { label: "Block time", value: "~2 seconds after fork " + FORK_BLOCK.toLocaleString("en-US") },
  { label: "Block reward", value: `${BLOCK_REWARD} MARS` },
  { label: "Mining", value: "Solo only — your own local node" },
]

export default function StartMiningPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container max-w-4xl mx-auto px-4 pt-36 pb-24 space-y-16">
        <header className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-text-hi">Start mining Mars Credit</h1>
          <p className="text-lg text-text-med leading-relaxed">
            Mars Credit is a mineable Ethash chain. There is <strong>no mining pool</strong> and no public stratum.
            You run a node, you mine to that node. Do not point miners at the public RPC
            ({" "}
            <Ext href={links.rpc}>{links.rpc}</Ext>
            ) — that endpoint is for wallets and apps, not work.
          </p>
          <p className="text-sm text-text-lo">
            This page is a how-to, not an offer and not financial advice. Hashrate, rewards, and electricity cost
            are yours to judge.
          </p>
        </header>

        <nav className="flex flex-wrap gap-3 text-sm">
          <a href="#macos-windows" className="rounded-full border border-white/15 px-4 py-2 text-white/80 hover:text-white hover:border-white/40">
            Mac &amp; Windows
          </a>
          <a href="#linux" className="rounded-full border border-white/15 px-4 py-2 text-white/80 hover:text-white hover:border-white/40">
            Linux
          </a>
          <a href="#gpu" className="rounded-full border border-white/15 px-4 py-2 text-white/80 hover:text-white hover:border-white/40">
            GPU / HiveOS
          </a>
          <a href="#wallet" className="rounded-full border border-white/15 px-4 py-2 text-white/80 hover:text-white hover:border-white/40">
            Add the chain
          </a>
        </nav>

        <section className="grid sm:grid-cols-2 gap-4">
          {facts.map((f) => (
            <div key={f.label} className="rounded-xl border border-white/10 p-4">
              <div className="text-sm text-text-med">{f.label}</div>
              <div className="text-lg font-semibold text-text-hi">{f.value}</div>
            </div>
          ))}
        </section>

        <section id="macos-windows" className="space-y-4 scroll-mt-28">
          <h2 className="text-2xl font-semibold text-text-hi">macOS and Windows — Mars Credit Miner app</h2>
          <p className="text-text-med leading-relaxed">
            The desktop app bundles a compatible go-marscredit node (geth <code className="text-mars-200">1.10.18-mars-fast1</code>),
            a wallet, and CPU mining. There is no Linux GUI build of this app.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {DOWNLOADS.map((dl) => (
              <a
                key={dl.platform}
                href={dl.url}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-center text-white hover:bg-white/10 hover:border-white/40"
              >
                Download {dl.label}
              </a>
            ))}
          </div>
          <p className="text-sm text-text-lo">
            Unsigned builds: on macOS use right-click → Open, or remove quarantine with{" "}
            <code className="text-text-med">xattr -dr com.apple.quarantine</code>. Windows SmartScreen may warn.
          </p>
        </section>

        <section id="linux" className="space-y-4 scroll-mt-28">
          <h2 className="text-2xl font-semibold text-text-hi">Linux — run your own node and CPU-mine</h2>
          <p className="text-text-med leading-relaxed">
            Linux users run <strong>go-marscredit</strong> (geth) themselves. Official Linux binaries are being
            produced in that repository now — we will not invent download URLs. Use the README and releases page:
          </p>
          <ul className="list-disc pl-6 text-text-med space-y-1">
            <li>
              Repository: <Ext href={GO_MARS_REPO}>{GO_MARS_REPO}</Ext>
            </li>
            <li>
              Build from source: <Ext href={GO_MARS_README}>Building the source</Ext>
            </li>
            <li>
              Mining notes: <Ext href={GO_MARS_MINER_DOCS}>Running a private miner</Ext>
            </li>
            <li>
              Fast-block fork (mars-fast1): <Ext href={GO_MARS_FAST_DOCS}>MARS_FAST.md on mars-fast-v1</Ext>
            </li>
            <li>
              Binary placeholder: <Ext href={GO_MARS_RELEASES}>{GO_MARS_RELEASES}</Ext>
            </li>
            <li>
              Genesis: <Ext href={GO_MARS_GENESIS}>genesis.json</Ext>
            </li>
          </ul>
          <p className="text-text-med leading-relaxed">
            You need the <code className="text-mars-200">mars-fast-v1</code> client (prints{" "}
            <code className="text-mars-200">1.10.18-mars-fast1</code>). The 2-second block fork activated at block{" "}
            {FORK_BLOCK.toLocaleString("en-US")}. A pre-fork geth build will follow the wrong chain. Until official
            Linux packages land, build from that branch:
          </p>
          <CopyBlock label="Build" code={BUILD_GETH} />
          <CopyBlock label="Initialize" code={INIT_NODE} />
          <p className="text-text-med leading-relaxed">
            Then start the node bound to <strong>localhost</strong>, mining to your address. Replace{" "}
            <code className="text-mars-200">0xYOUR_REWARD_ADDRESS</code>. HTTP is 127.0.0.1 only so GPU miners on
            the same machine can call getWork locally — not the public internet.
          </p>
          <CopyBlock label="Run (CPU mine on your node)" code={RUN_CPU_MINER} />
          <p className="text-sm text-text-med leading-relaxed">
            <code className="text-mars-200">{REQUIRED_BLOCKS_FLAG}</code> plus{" "}
            <code className="text-mars-200">--networkid {CHAIN_ID}</code> keeps the node on the public chain after
            the fork.
          </p>
          <p className="text-sm text-text-lo">
            Railway bootnodes are TCP-only. Put the same enodes in{" "}
            <code className="text-text-med">$HOME/.marscredit/geth/static-nodes.json</code> so geth re-dials them
            after restart:
          </p>
          <CopyBlock label="static-nodes.json" code={STATIC_NODES_JSON} />
          <ul className="list-disc pl-6 text-sm text-text-lo space-y-1">
            {BOOTNODES.map((e) => (
              <li key={e} className="break-all font-mono">{e}</li>
            ))}
          </ul>
        </section>

        <section id="gpu" className="space-y-4 scroll-mt-28">
          <h2 className="text-2xl font-semibold text-text-hi">GPU and HiveOS — solo against your local node</h2>
          <p className="text-text-med leading-relaxed">
            GPU miners (ethminer, similar Ethash miners, HiveOS flight sheets) must talk to{" "}
            <strong>your own geth</strong> over getWork on localhost. That means the node from the Linux section
            (or the Mac/Windows app) is running on the same LAN machine the GPUs can reach, with HTTP on{" "}
            <code className="text-mars-200">{LOCAL_RPC}</code>. Run that node with the same fork pin and chain ID{" "}
            {CHAIN_ID} — a pre-fork geth build will follow the wrong chain.
          </p>
          <CopyBlock label="Run (local node for GPU getWork)" code={RUN_CPU_MINER} />
          <p className="text-sm text-text-med leading-relaxed">
            <code className="text-mars-200">{REQUIRED_BLOCKS_FLAG}</code> plus{" "}
            <code className="text-mars-200">--networkid {CHAIN_ID}</code> keeps the node on the public chain after
            the fork.
          </p>
          <div className="rounded-xl border border-mars-500/40 bg-mars-950/40 p-4 space-y-2">
            <div className="text-sm font-semibold uppercase tracking-wider text-mars-300">Hard rules</div>
            <ul className="list-disc pl-6 text-text-med space-y-1">
              <li>No mining pool.</li>
              <li>No public stratum.</li>
              <li>
                Never point a miner at <code className="text-mars-200">rpc.marscredit.xyz</code> or any other public RPC.
              </li>
            </ul>
          </div>
          <p className="text-text-med">ethminer example (local getWork only):</p>
          <CopyBlock label="ethminer" code={ETHMINER_LOCAL} />
          <p className="text-text-med leading-relaxed">
            HiveOS: add a custom Ethash miner, farm URL <code className="text-mars-200">{LOCAL_RPC}</code>, wallet
            your etherbase, coin {SYMBOL}. The farm is your node, not a pool. If HiveOS and geth are on different
            boxes, bind HTTP to the LAN IP of the node — still not a public RPC.
          </p>
        </section>

        <section id="wallet" className="space-y-4 scroll-mt-28">
          <h2 className="text-2xl font-semibold text-text-hi">Add the chain to a wallet</h2>
          <ul className="list-disc pl-6 text-text-med space-y-1">
            <li>Chain ID: {CHAIN_ID}</li>
            <li>Symbol: {SYMBOL}</li>
            <li>Decimals: {DECIMALS}</li>
            <li>
              RPC (wallets / apps, <em>not mining</em>): <Ext href={links.rpc}>{links.rpc}</Ext>
            </li>
            <li>
              Explorer: <Ext href={links.blockscan}>{links.blockscan}</Ext>
            </li>
            <li>
              Chainlist: <Ext href={CHAINLIST}>{CHAINLIST}</Ext>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-text-hi">Community</h2>
          <p className="text-text-med">
            Discord <Ext href={links.discord}>{links.discord}</Ext>
            {" · "}
            Telegram <Ext href={links.telegram}>{links.telegram}</Ext>
            {" · "}
            X <Ext href={links.twitter}>{links.twitter}</Ext>
          </p>
          <p className="text-sm text-text-lo">
            Questions about node flags belong in those channels or on{" "}
            <Ext href={GO_MARS_REPO}>go-marscredit</Ext>.{" "}
            <Link href="/tokenomics" className="text-mars-300 underline underline-offset-4 hover:text-mars-200">
              Tokenomics
            </Link>{" "}
            explains supply. Nothing here is for sale.
          </p>
        </section>
      </main>
    </div>
  )
}
