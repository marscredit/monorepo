"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Navigation } from "@/components/navigation"
import { MarsOrb } from "@/components/mars-orb"
import { StatCard } from "@/components/stat-card"
import { FeatureCard } from "@/components/feature-card"
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
  Globe
} from "lucide-react"

const stats = [
  { label: "Blocks Mined", value: "2.5M+", hint: "Proof-of-Work" },
  { label: "Consensus", value: "PoW", hint: "Secure & Decentralized" },
  { label: "Compatibility", value: "EVM", hint: "Ethereum Tools" },
  { label: "Block Time", value: "Fast", hint: "Quick Confirmations" },
]

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

const ecosystemLinks = [
  { name: "RPC URL", href: "#", icon: Globe },
  { name: "GitHub", href: links.github, icon: Code },
  { name: "Docs", href: links.docs, icon: ExternalLink },
  { name: "Blockscan", href: links.blockscan, icon: ExternalLink },
  { name: "Bridge", href: links.bridge, icon: ArrowRightLeft },
  { name: "Mining App", href: links.mining, icon: Download },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <MarsOrb size="xl" className="mx-auto mb-8" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-display font-bold text-text-hi mb-6 text-balance"
            >
              MARS Credit: Your Cryptocurrency for{" "}
              <span className="text-transparent bg-gradient-to-r from-mars-400 to-mars-200 bg-clip-text">
                Mars Colonization
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-text-med mb-8 max-w-2xl mx-auto text-balance"
            >
              Mineable. EVM‑native. Built for Mars. A Layer 1 blockchain designed to support 
              the economic and operational needs of Mars colonization.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Button size="lg" asChild>
                <a href={links.mining} target="_blank" rel="noopener noreferrer">
                  <Download className="mr-2 h-5 w-5" />
                  Download MacOS Mining App
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href={links.trade} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Trade on Solana
                </a>
              </Button>
              <Button variant="ghost" size="lg" asChild>
                <a href="/story">
                  Join the Mission
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

      {/* About Section */}
      <section className="py-20">
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
              designed to support the economic and operational needs of Mars colonization. With larger 
              block sizes and a faster consensus mechanism, Mars Credit enhances transaction throughput 
              and efficiency while maintaining Ethereum's security and decentralization.
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

      {/* Mining Section */}
      <section className="py-20 bg-gradient-to-r from-mars-950/50 to-mars-900/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <Pickaxe className="h-16 w-16 text-mars-400 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-hi mb-6">
                Mine on Mars Credit
              </h2>
              <p className="text-lg text-text-med mb-8 text-balance">
                Secure the blockchain, earn rewards, and support Mars colonies. 
                Our MacOS Mining App makes it easy to get started.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" asChild>
                  <a href={links.mining} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-5 w-5" />
                    Download MacOS App
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href={links.docs} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    View Docs
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trading Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <ArrowRightLeft className="h-16 w-16 text-mars-400 mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-hi mb-6">
                Buy or Sell MARS on Solana
              </h2>
              <p className="text-lg text-text-med mb-8 text-balance">
                Mars Credit has been bridged to Solana, expanding liquidity and access. 
                Trade with confidence on established DEX platforms.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" asChild>
                  <a href={links.trade} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Trade on GeckoTerminal
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href={links.bridge} target="_blank" rel="noopener noreferrer">
                    <ArrowRightLeft className="mr-2 h-5 w-5" />
                    Bridge to Solana
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
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

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ecosystemLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <motion.a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <div className="card-glow p-4 text-center hover:scale-105 transition-all duration-200">
                    <Icon className="h-8 w-8 text-mars-400 mx-auto mb-2 group-hover:text-mars-300 transition-colors" />
                    <div className="text-sm font-medium text-text-med group-hover:text-text-hi transition-colors">
                      {link.name}
                    </div>
                  </div>
                </motion.a>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-mars-950/50 to-mars-900/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-hi mb-6">
                Spin up a node. Point a rig.{" "}
                <span className="text-transparent bg-gradient-to-r from-mars-400 to-mars-200 bg-clip-text">
                  Help secure Mars.
                </span>
              </h2>
              <p className="text-lg text-text-med mb-8 text-balance">
                Join the mission to build the economic infrastructure for Mars colonization.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" asChild>
                  <a href={links.mining} target="_blank" rel="noopener noreferrer">
                    <Pickaxe className="mr-2 h-5 w-5" />
                    Start Mining
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href={links.discord} target="_blank" rel="noopener noreferrer">
                    <Users className="mr-2 h-5 w-5" />
                    Join Discord
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="mars-orb h-6 w-6 rounded-full"></div>
              <span className="font-display font-bold text-text-hi">Mars Credit</span>
              <span className="text-xs bg-mars-500/20 text-mars-300 px-2 py-1 rounded-full">
                Open Source
              </span>
            </div>
            <div className="text-sm text-text-lo">
              Built for the Red Planet. Mineable. EVM-compatible.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
