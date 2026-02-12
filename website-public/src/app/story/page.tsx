"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Navigation } from "@/components/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { links } from "@/lib/config"
import { 
  Rocket, 
  Zap, 
  Users, 
  Globe, 
  Shield,
  ArrowRight,
  MessageCircle,
  Instagram,
  Send
} from "lucide-react"

const timeline = [
  {
    phase: "Genesis",
    title: "The Fork",
    description: "Mars Credit was born from Ethereum's Proof-of-Work foundation, preserving the security and decentralization that makes blockchain trustworthy.",
    icon: Shield,
    status: "completed"
  },
  {
    phase: "Launch",
    title: "First Blocks Mined",
    description: "The network came alive with miners securing the first blocks, establishing the foundation for Mars' economic infrastructure.",
    icon: Zap,
    status: "completed"
  },
  {
    phase: "Tools",
    title: "MacOS Mining App",
    description: "Making mining accessible to everyone with an intuitive desktop application for Mac users.",
    icon: Rocket,
    status: "completed"
  },
  {
    phase: "Bridge",
    title: "Solana Integration",
    description: "Expanding accessibility by bridging MARS to Solana, bringing liquidity and trading opportunities.",
    icon: Globe,
    status: "completed"
  },
  {
    phase: "Community",
    title: "Grants Program",
    description: "Supporting builders and innovators who share our vision of interplanetary commerce and settlement.",
    icon: Users,
    status: "active"
  },
  {
    phase: "Future",
    title: "Mars Settlement",
    description: "The ultimate goal: a robust economic system ready to support human civilization on Mars.",
    icon: Rocket,
    status: "future"
  },
]

const principles = [
  {
    title: "Fairness",
    description: "No premine, no insider allocations. Every MARS token is earned through mining or fair market exchange."
  },
  {
    title: "Simplicity", 
    description: "Clear economics, predictable behavior. No complex tokenomics or governance drama."
  },
  {
    title: "Durability",
    description: "Built to last. Proof-of-Work consensus that can survive in the harsh environment of space."
  },
  {
    title: "Compatibility",
    description: "EVM-native from day one. All Ethereum tools, wallets, and contracts work seamlessly."
  }
]

export default function StoryPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        {/* Background Mars Imagery */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/70 to-background z-10" />
          <Image
            src="/media/mars_00017.png"
            alt=""
            fill
            className="object-cover opacity-25"
            priority
          />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-6xl font-display font-bold text-white mb-6 text-balance"
            >
              The Mars Credit Story
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl text-text-med mb-8 max-w-2xl mx-auto text-balance"
            >
              Currency for harsh frontiers. A blockchain designed not just for Earth, 
              but for the challenges of interplanetary commerce and settlement.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-hi mb-8">
                Why Mars Credit Exists
              </h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-text-med text-lg leading-relaxed mb-6">
                  Mars Credit (MARS) emerges at a pivotal moment in human history, where Earth's 
                  ecological and societal crises necessitate bold solutions. As humanity prepares 
                  for interplanetary expansion, we need economic systems that can operate reliably 
                  in the harsh environment of space.
                </p>
                <p className="text-text-med text-lg leading-relaxed mb-6">
                  Inspired by the vision of Mars colonization and the need for a decentralized, 
                  trustworthy currency, Mars Credit leverages blockchain technology to create 
                  the foundation for interplanetary commerce. Every aspect of our design prioritizes 
                  reliability, security, and simplicity—qualities essential for survival on Mars.
                </p>
                <p className="text-text-med text-lg leading-relaxed">
                  Mars Credit is both a technical blockchain and a symbolic mission for survival 
                  and exploration. It represents humanity's determination to build sustainable 
                  economic infrastructure wherever we choose to make our home.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 border-y border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-display font-bold text-text-hi mb-12 text-center"
            >
              Our Journey
            </motion.h2>

            <div className="space-y-8">
              {timeline.map((milestone, index) => {
                const Icon = milestone.icon
                return (
                  <motion.div
                    key={milestone.phase}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`
                        flex h-12 w-12 items-center justify-center rounded-2xl
                        ${milestone.status === 'completed' ? 'bg-mars-500/20 text-mars-400' : 
                          milestone.status === 'active' ? 'bg-mars-400/30 text-mars-300' :
                          'bg-panel text-text-lo'}
                      `}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-xs font-semibold text-mars-400 uppercase tracking-wider">
                            {milestone.phase}
                          </span>
                          {milestone.status === 'completed' && (
                            <span className="text-xs bg-mars-500/20 text-mars-300 px-2 py-1 rounded-full">
                              ✓ Complete
                            </span>
                          )}
                          {milestone.status === 'active' && (
                            <span className="text-xs bg-mars-400/30 text-mars-200 px-2 py-1 rounded-full animate-pulse">
                              ⚡ Active
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-text-hi mb-2">
                          {milestone.title}
                        </h3>
                        <p className="text-text-med leading-relaxed">
                          {milestone.description}
                        </p>
                      </div>
                    </div>
                    
                    {index < timeline.length - 1 && (
                      <div className="absolute left-6 top-12 h-8 w-px bg-gradient-to-b from-mars-500/50 to-transparent" />
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-hi mb-8">
                The Vision
              </h2>
              <div className="text-lg text-text-med leading-relaxed space-y-6 text-balance">
                <p>
                  Mars Credit is more than a cryptocurrency—it's the economic backbone for 
                  humanity's greatest adventure. When the first permanent settlements are 
                  established on Mars, they'll need a currency that works reliably in an 
                  environment where Earth-based financial systems simply cannot reach.
                </p>
                <p>
                  Our blockchain is designed to operate autonomously, secured by miners who 
                  understand that they're not just processing transactions—they're building 
                  the foundation for interplanetary civilization.
                </p>
                <p className="text-xl font-semibold text-text-hi">
                  "Mars Credit is a proof‑of‑work, EVM chain that chooses simplicity over spectacle. 
                  If you can run a node, you can help secure the network. If you can ship a contract, 
                  you can deploy on day one."
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="py-20 bg-gradient-to-r from-mars-950/50 to-mars-900/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl font-display font-bold text-text-hi mb-12 text-center"
            >
              Our Principles
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-8">
              {principles.map((principle, index) => (
                <motion.div
                  key={principle.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full">
                    <h3 className="text-xl font-semibold text-text-hi mb-4">
                      {principle.title}
                    </h3>
                    <p className="text-text-med leading-relaxed">
                      {principle.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-text-hi mb-6">
                Join the Mission
              </h2>
              <p className="text-lg text-text-med mb-8 text-balance">
                Every miner, developer, and community member is helping build the economic 
                infrastructure for humanity's future among the stars.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button variant="outline" size="lg" asChild>
                  <a href={links.telegram} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Join Telegram
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="/updates">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Latest Updates
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
          <div className="flex flex-col items-center space-y-6">
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

