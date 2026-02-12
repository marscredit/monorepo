"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { links } from "@/lib/config"
import { CalendarDays, Clock, ArrowRight, Zap, Instagram, Send, MessageCircle } from "lucide-react"

// Mock data for now - in a real app this would come from MDX files or a CMS
const updates = [
  {
    slug: "solana-bridge-paused",
    title: "Solana Bridge Paused",
    date: "2025-11-01",
    summary: "We've paused the Solana bridge to focus on our core network infrastructure. In the future, we will reintegrate the bridge through a service like Wormhole or other established bridge providers instead of a self-hosted solution to ensure better reliability and security.",
    tags: ["bridge", "solana", "infrastructure"],
    readTime: "3 min read",
  },
  {
    slug: "solana-bridge-live",
    title: "Solana Bridge Now Live",
    date: "2025-08-15",
    summary: "Mars Credit is now available on Solana! Trade MARS tokens with improved liquidity and access through our new bridge integration.",
    tags: ["bridge", "solana", "trading"],
    readTime: "3 min read",
  },
  {
    slug: "macos-mining-app-released",
    title: "MacOS Mining App Released",
    date: "2025-07-28",
    summary: "Mining Mars Credit is now easier than ever with our native MacOS application. Download and start mining with just a few clicks.",
    tags: ["mining", "macos", "app"],
    readTime: "2 min read",
  },
  {
    slug: "mainnet-milestone-3-3m-blocks",
    title: "Mainnet Milestone: 3.3M+ Blocks Mined",
    date: "2025-06-12",
    summary: "The Mars Credit network has successfully mined over 3.3 million blocks, demonstrating the strength and reliability of our proof-of-work consensus.",
    tags: ["mainnet", "milestone", "pow"],
    readTime: "4 min read",
  },
  {
    slug: "grants-program-launched", 
    title: "Mars Credit Grants Program Launched",
    date: "2025-05-20",
    summary: "Supporting developers and innovators building on Mars Credit with our new grants program. Apply now to bring your Mars-focused projects to life.",
    tags: ["grants", "community", "development"],
    readTime: "5 min read",
  },
]

const tagColors: Record<string, string> = {
  bridge: "bg-blue-500/20 text-blue-300",
  solana: "bg-purple-500/20 text-purple-300", 
  trading: "bg-green-500/20 text-green-300",
  mining: "bg-mars-500/20 text-mars-300",
  macos: "bg-gray-500/20 text-gray-300",
  app: "bg-cyan-500/20 text-cyan-300",
  mainnet: "bg-mars-400/20 text-mars-200",
  milestone: "bg-yellow-500/20 text-yellow-300",
  pow: "bg-orange-500/20 text-orange-300",
  grants: "bg-emerald-500/20 text-emerald-300",
  community: "bg-pink-500/20 text-pink-300",
  development: "bg-indigo-500/20 text-indigo-300",
  infrastructure: "bg-red-500/20 text-red-300",
}

function isNew(dateString: string): boolean {
  const postDate = new Date(dateString)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return postDate > weekAgo
}

export default function UpdatesPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Zap className="h-16 w-16 text-mars-400 mx-auto mb-6" />
              <h1 className="text-4xl sm:text-6xl font-display font-bold text-white mb-6 text-balance">
                Mars Credit Updates
              </h1>
              <p className="text-xl text-text-med mb-8 max-w-2xl mx-auto text-balance">
                Stay informed about the latest developments, milestones, and announcements 
                from the Mars Credit ecosystem.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Updates List */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {updates.length > 0 ? (
              <div className="space-y-8">
                {updates.map((update, index) => (
                  <motion.article
                    key={update.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="group hover:shadow-2xl hover:shadow-mars-500/10 transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <div className="flex items-center text-sm text-text-lo">
                                <CalendarDays className="h-4 w-4 mr-1" />
                                {formatDate(update.date)}
                              </div>
                              <div className="flex items-center text-sm text-text-lo">
                                <Clock className="h-4 w-4 mr-1" />
                                {update.readTime}
                              </div>
                              {isNew(update.date) && (
                                <span className="text-xs bg-mars-500/20 text-mars-300 px-2 py-1 rounded-full animate-pulse">
                                  New
                                </span>
                              )}
                            </div>
                            <CardTitle className="text-2xl mb-3 group-hover:text-mars-300 transition-colors">
                              {update.title}
                            </CardTitle>
                            <p className="text-text-med leading-relaxed mb-4">
                              {update.summary}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {update.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    tagColors[tag] || "bg-panel text-text-med"
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button variant="ghost" asChild className="group/btn p-0 h-auto">
                          <Link 
                            href={`/updates/${update.slug}`}
                            className="inline-flex items-center text-mars-400 hover:text-mars-300 transition-colors"
                          >
                            Read full update
                            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.article>
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center py-20"
              >
                <Zap className="h-16 w-16 text-text-lo mx-auto mb-6 opacity-50" />
                <h2 className="text-2xl font-semibold text-text-hi mb-4">
                  Silence before the storm
                </h2>
                <p className="text-text-med text-balance">
                  Updates land here soon. Follow our progress on GitHub and Discord 
                  to stay informed about the latest developments.
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
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
                Stay in the Loop
              </h2>
              <p className="text-lg text-text-med mb-8 text-balance">
                Join our community to get the latest updates about Mars Credit development, 
                mining opportunities, and ecosystem growth.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button variant="outline" size="lg" asChild>
                  <a href={links.twitter} target="_blank" rel="noopener noreferrer">
                    Follow on X
                  </a>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href={links.telegram} target="_blank" rel="noopener noreferrer">
                    Follow on Telegram
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

