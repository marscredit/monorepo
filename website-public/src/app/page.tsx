"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { StatCard } from "@/components/stat-card"
import { FeatureCard } from "@/components/feature-card"
import { BoomerangVideo } from "@/components/boomerang-video"
import { LiveBlockTicker } from "@/components/live-block-ticker"
import { links } from "@/lib/config"
import { 
  Zap, 
  Shield, 
  Code, 
  Pickaxe,
  ExternalLink,
  Download,
  ArrowRightLeft,
  Users,
  TrendingUp,
  Globe,
  FileText,
  Github,
  MessageCircle,
  Instagram,
  Send
} from "lucide-react"

const FALLBACK_BLOCK = 3300000

function formatBlocksMined(block: number): string {
  const millions = block / 1_000_000
  return `${millions >= 10 ? Math.floor(millions) : millions.toFixed(1)}M+`
}

const STATS_LABELS = [
  { label: "Blocks Mined", hint: "Proof-of-Work" },
  { label: "Consensus", value: "PoW", hint: "Secure & Decentralized" },
  { label: "Compatibility", value: "EVM", hint: "Ethereum Tools" },
  { label: "Block Time", value: "Fast", hint: "Quick Confirmations" },
] as const

const features = [
  {
    icon: Zap,
    title: "Larger Blocks",
    description: "Increased transaction capacity for higher throughput and better scalability."
  },
  {
    icon: TrendingUp,
    title: "Faster Consensus",
    description: "Optimized block times for quicker confirmations while maintaining security."
  },
  {
    icon: Code,
    title: "EVM Compatibility", 
    description: "Seamless Ethereum ecosystem support - deploy contracts without changes."
  },
  {
    icon: Shield,
    title: "Proof-of-Work Mining",
    description: "Secure, decentralized network powered by miners around the world."
  },
]

export default function HomePage() {
  const [block, setBlock] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/network")
      .then((res) => res.json())
      .then((data: { block?: number }) => {
        if (typeof data?.block === "number") setBlock(data.block)
      })
      .catch(() => {})
  }, [])

  const blocksMinedValue = block !== null ? formatBlocksMined(block) : formatBlocksMined(FALLBACK_BLOCK)
  const stats = [
    { label: STATS_LABELS[0].label, value: blocksMinedValue, hint: STATS_LABELS[0].hint },
    { label: STATS_LABELS[1].label, value: STATS_LABELS[1].value!, hint: STATS_LABELS[1].hint },
    { label: STATS_LABELS[2].label, value: STATS_LABELS[2].value!, hint: STATS_LABELS[2].hint },
    { label: STATS_LABELS[3].label, value: STATS_LABELS[3].value!, hint: STATS_LABELS[3].hint },
  ]

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32" style={{ overflow: 'hidden' }}>
        {/* Background Video - Full Viewport Width */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100vw',
          height: '100%',
          zIndex: 0
        }}>
          <BoomerangVideo 
            src="/media/social_lifeof_jer_hero_with_badass_spacesuit_overlooking_mars_colony_971a9015-10c4-4611-a53d-6a36cafd91ee_3.mp4"
            className=""
            opacity={0.8}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-background" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
          <div className="mx-auto max-w-4xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold text-white mb-6 text-balance"
            >
              MARS Credit: Your Cryptocurrency for Mars Colonization
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl text-text-med mb-8 max-w-2xl mx-auto text-balance"
            >
              Mineable. EVM‑native. Built for Mars. A Layer 1 blockchain designed to support 
              the economic and operational needs of Mars colonization.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button size="lg" asChild>
                <a href={links.github} target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-5 w-5" />
                  View on GitHub
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href={links.blockscan} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Explore Blockscan
                </a>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                hint={stat.hint}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Mars Vision Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Image
                src="/media/mars_00015.png"
                alt="Mars landscape"
                width={600}
                height={600}
                className="rounded-3xl shadow-2xl shadow-mars-500/20"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-6">
                Built for the Red Planet
              </h2>
              <p className="text-lg text-text-med mb-6 leading-relaxed">
                Mars Credit is more than a cryptocurrency—it's the foundation of an interplanetary economy. 
                Our blockchain infrastructure is designed to support the complex economic and operational needs 
                of Mars colonization.
              </p>
              <p className="text-lg text-text-med leading-relaxed">
                With EVM compatibility, proof-of-work security, and optimized transaction processing, 
                MARS provides the financial rails for humanity's greatest adventure.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-display font-bold text-text-hi mb-6"
            >
              About Mars Credit
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-lg text-text-med text-balance"
            >
              Mars Credit (MARS) is a Layer 1 blockchain forked from Ethereum's Proof‑of‑Work network, 
              designed to support the economic and operational needs of Mars colonization.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Additional Mars Showcase */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/media/mars_00018.png"
            alt=""
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background" />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl sm:text-5xl font-display font-bold text-white mb-6">
              The Future is Interplanetary
            </h2>
            <p className="text-xl text-text-med leading-relaxed mb-8">
              Mars Credit isn't just preparing for the future—it's building the economic infrastructure 
              that will power humanity's expansion into the cosmos. Every transaction, every block mined, 
              brings us one step closer to a truly interplanetary civilization.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Ecosystem Links */}
      <section className="py-20 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-display font-bold text-text-hi mb-6"
            >
              Ecosystem
            </motion.h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: "RPC URL", href: links.rpc, icon: Globe },
              { name: "GitHub", href: links.github, icon: Github },
              { name: "Blockscan", href: links.blockscan, icon: ExternalLink },
              { name: "Whitepaper", href: links.whitepaper, icon: FileText },
              { name: "Discord", href: links.discord || "#", icon: MessageCircle },
            ].map((link, index) => {
              const Icon = link.icon
              return (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target={link.href.startsWith('/') ? '_self' : '_blank'}
                  rel={link.href.startsWith('/') ? undefined : 'noopener noreferrer'}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className="card-glow p-4 text-center transition-all duration-200">
                    <div className="relative z-10">
                      <Icon className="h-8 w-8 text-mars-400 mx-auto mb-2 group-hover:text-mars-300 transition-colors" />
                      <div className="text-sm font-medium text-text-med group-hover:text-white transition-colors">
                        {link.name}
                      </div>
                    </div>
                  </div>
                </motion.a>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center space-y-6">
            {/* Live block ticker */}
            <div className="w-full max-w-sm">
              <LiveBlockTicker initialBlock={block ?? FALLBACK_BLOCK} />
            </div>
            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <a 
                href="https://instagram.com/marscredit.xyz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-text-lo hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://x.com/marscredit" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-text-lo hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a 
                href="https://t.me/marscreditxyz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-text-lo hover:text-white transition-colors"
              >
                <Send className="h-5 w-5" />
              </a>
              <a 
                href="https://t.me/MarscreditOfficial" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-text-lo hover:text-white transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a 
                href="https://discord.gg/57bg77dCV8" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-text-lo hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>

            {/* Logo and tagline */}
            <div className="flex flex-col md:flex-row justify-between items-center w-full">
              <div className="flex items-center space-x-3 mb-4 md:mb-0">
                <Image
                  src="/brand/marscredit_wide_transparent.png"
                  alt="Mars Credit"
                  width={120}
                  height={24}
                  className="h-6 w-auto brightness-200"
                />
                <span className="text-xs bg-mars-400/20 text-mars-400 px-2 py-1 rounded-full">
                  Open Source
                </span>
              </div>
              <div className="text-sm text-text-lo">
                Built for the Red Planet. Mineable. EVM-compatible.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}