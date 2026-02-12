"use client"

import Image from "next/image"
import { use } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { site } from "@/lib/config"
import { CalendarDays, Clock, ArrowLeft, ExternalLink, Instagram, Send, MessageCircle } from "lucide-react"

// Mock data - in a real app this would come from MDX files
const updates: Record<string, {
  title: string
  date: string
  readTime: string
  tags: string[]
  content: React.ReactNode
}> = {
  "solana-bridge-paused": {
    title: "Solana Bridge Paused",
    date: "2025-11-01",
    readTime: "3 min read",
    tags: ["bridge", "solana", "infrastructure"],
    content: (
      <div className="prose prose-lg max-w-none prose-invert">
        <p className="text-xl text-text-med leading-relaxed">
          We're temporarily pausing the Solana bridge to focus our efforts on strengthening 
          the core Mars Credit network infrastructure. This decision allows us to dedicate 
          our resources to improving the primary blockchain while planning a more robust 
          bridge solution for the future.
        </p>
        
        <h2 className="text-2xl font-bold text-text-hi mt-8 mb-4">Why We're Pausing</h2>
        <p className="text-text-med leading-relaxed">
          Running a self-hosted bridge requires significant ongoing maintenance and monitoring. 
          We've decided to pause operations to:
        </p>
        <ul className="text-text-med space-y-2">
          <li>• <strong>Focus on Core Network:</strong> Dedicate resources to Mars Credit's primary blockchain</li>
          <li>• <strong>Improve Reliability:</strong> Address infrastructure challenges with our self-hosted solution</li>
          <li>• <strong>Plan Better Solution:</strong> Research integration with established bridge providers</li>
          <li>• <strong>Enhance Security:</strong> Leverage proven bridge infrastructure instead of self-hosting</li>
        </ul>

        <h2 className="text-2xl font-bold text-text-hi mt-8 mb-4">What This Means for Users</h2>
        <p className="text-text-med leading-relaxed">
          If you currently have MARS tokens on Solana, they remain safe. However, new bridging 
          operations are temporarily unavailable. We recommend holding your tokens until we 
          relaunch the bridge with a more reliable solution.
        </p>

        <div className="bg-mars-950/50 border border-mars-500/20 rounded-lg p-6 my-8">
          <h3 className="text-lg font-semibold text-mars-300 mb-2">Important Notice</h3>
          <p className="text-text-med text-sm">
            Existing MARS tokens on Solana remain valid. We'll provide advance notice and 
            clear migration instructions when the new bridge solution is ready.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-text-hi mt-8 mb-4">Future Plans</h2>
        <p className="text-text-med leading-relaxed">
          We're exploring partnerships with established bridge providers like Wormhole and other 
          trusted cross-chain infrastructure services. This approach will offer:
        </p>
        <ul className="text-text-med space-y-2">
          <li>• <strong>Better Reliability:</strong> Professional bridge infrastructure with 24/7 monitoring</li>
          <li>• <strong>Enhanced Security:</strong> Battle-tested bridge technology</li>
          <li>• <strong>Lower Maintenance:</strong> Managed services reduce our operational burden</li>
          <li>• <strong>Multi-Chain Support:</strong> Potential expansion to additional blockchains</li>
        </ul>

        <h2 className="text-2xl font-bold text-text-hi mt-8 mb-4">Stay Updated</h2>
        <p className="text-text-med leading-relaxed">
          We'll announce our new bridge solution once we've selected a partner and completed 
          integration testing. Follow our updates page and social channels for the latest news.
        </p>
      </div>
    )
  },
  "solana-bridge-live": {
    title: "Solana Bridge Now Live",
    date: "2025-08-15",
    readTime: "3 min read",
    tags: ["bridge", "solana", "trading"],
    content: (
      <div className="prose prose-lg max-w-none prose-invert">
        <p className="text-xl text-text-med leading-relaxed">
          We're excited to announce that Mars Credit (MARS) is now available on Solana! 
          This integration marks a significant milestone in our mission to make MARS 
          accessible across multiple blockchain ecosystems.
        </p>
        
        <h2 className="text-2xl font-bold text-text-hi mt-8 mb-4">What This Means</h2>
        <p className="text-text-med leading-relaxed">
          The Solana bridge opens up new opportunities for MARS holders:
        </p>
        <ul className="text-text-med space-y-2">
          <li>• <strong>Enhanced Liquidity:</strong> Trade MARS on Solana's vibrant DEX ecosystem</li>
          <li>• <strong>Lower Fees:</strong> Benefit from Solana's low transaction costs</li>
          <li>• <strong>Faster Trades:</strong> Near-instant transaction finality</li>
          <li>• <strong>DeFi Integration:</strong> Use MARS in Solana DeFi protocols</li>
        </ul>

        <h2 className="text-2xl font-bold text-text-hi mt-8 mb-4">How to Use the Bridge</h2>
        <p className="text-text-med leading-relaxed">
          Bridging your MARS tokens to Solana is straightforward:
        </p>
        <ol className="text-text-med space-y-2">
          <li>1. Visit our bridge interface at <code>bridge.marscredit.org</code></li>
          <li>2. Connect your Mars Credit and Solana wallets</li>
          <li>3. Specify the amount of MARS to bridge</li>
          <li>4. Confirm the transaction and wait for confirmation</li>
        </ol>

        <h2 className="text-2xl font-bold text-text-hi mt-8 mb-4">Trading on Solana</h2>
        <p className="text-text-med leading-relaxed">
          Once your MARS tokens are on Solana, you can trade them on popular DEX platforms. 
          We recommend using established platforms like Jupiter or Raydium for the best 
          trading experience.
        </p>

        <div className="bg-mars-950/50 border border-mars-500/20 rounded-lg p-6 my-8">
          <h3 className="text-lg font-semibold text-mars-300 mb-2">Security Notice</h3>
          <p className="text-text-med text-sm">
            Always verify contract addresses and use official bridge interfaces. 
            The Mars Credit team will never ask for your private keys or seed phrases.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-text-hi mt-8 mb-4">What's Next</h2>
        <p className="text-text-med leading-relaxed">
          This bridge is just the beginning. We're working on additional integrations 
          and features to make Mars Credit the most accessible interplanetary currency. 
          Stay tuned for more updates!
        </p>
      </div>
    )
  },
  "macos-mining-app-released": {
    title: "MacOS Mining App Released", 
    date: "2025-07-28",
    readTime: "2 min read",
    tags: ["mining", "macos", "app"],
    content: (
      <div className="prose prose-lg max-w-none prose-invert">
        <p className="text-xl text-text-med leading-relaxed">
          Mining Mars Credit just got easier! We're thrilled to announce the release 
          of our native MacOS mining application, making it simple for Mac users to 
          start mining MARS tokens.
        </p>

        <h2 className="text-2xl font-bold text-text-hi mt-8 mb-4">Features</h2>
        <ul className="text-text-med space-y-2">
          <li>• <strong>One-Click Mining:</strong> Start mining with minimal configuration</li>
          <li>• <strong>Real-time Stats:</strong> Monitor hashrate, earnings, and network status</li>
          <li>• <strong>Wallet Integration:</strong> Built-in wallet management</li>
          <li>• <strong>Energy Efficient:</strong> Optimized for Mac hardware</li>
        </ul>

        <h2 className="text-2xl font-bold text-text-hi mt-8 mb-4">Download and Install</h2>
        <p className="text-text-med leading-relaxed">
          The app is available for download from our official GitHub releases page. 
          Simply download the .dmg file, install, and you're ready to start mining!
        </p>

        <div className="bg-mars-950/50 border border-mars-500/20 rounded-lg p-6 my-8">
          <h3 className="text-lg font-semibold text-mars-300 mb-2">System Requirements</h3>
          <ul className="text-text-med text-sm space-y-1">
            <li>• macOS 11.0 or later</li>
            <li>• 4GB RAM minimum (8GB recommended)</li>
            <li>• Stable internet connection</li>
          </ul>
        </div>
      </div>
    )
  }
}

const tagColors: Record<string, string> = {
  bridge: "bg-blue-500/20 text-blue-300",
  solana: "bg-purple-500/20 text-purple-300", 
  trading: "bg-green-500/20 text-green-300",
  mining: "bg-mars-500/20 text-mars-300",
  macos: "bg-gray-500/20 text-gray-300",
  app: "bg-cyan-500/20 text-cyan-300",
  infrastructure: "bg-red-500/20 text-red-300",
  mainnet: "bg-mars-400/20 text-mars-200",
  milestone: "bg-yellow-500/20 text-yellow-300",
  pow: "bg-orange-500/20 text-orange-300",
  grants: "bg-emerald-500/20 text-emerald-300",
  community: "bg-pink-500/20 text-pink-300",
  development: "bg-indigo-500/20 text-indigo-300",
}

interface UpdatePageProps {
  params: Promise<{
    slug: string
  }>
}

export default function UpdatePage({ params }: UpdatePageProps) {
  const { slug } = use(params)
  const update = updates[slug]
  
  if (!update) {
    notFound()
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: update.title,
    datePublished: update.date,
    author: {
      "@type": "Organization",
      name: site.name,
    },
    url: `${site.url}/updates/${slug}`,
  }

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Navigation />
      
      {/* Header */}
      <section className="py-12 border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Button variant="ghost" asChild className="mb-6">
                <Link href="/updates" className="inline-flex items-center text-text-med hover:text-text-hi">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Updates
                </Link>
              </Button>
              
              <div className="flex items-center space-x-4 mb-4 text-sm text-text-lo">
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-1" />
                  {formatDate(update.date)}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {update.readTime}
                </div>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-hi mb-6 text-balance">
                {update.title}
              </h1>
              
              <div className="flex flex-wrap gap-2 mb-8">
                {update.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-3 py-1 rounded-full ${
                      tagColors[tag] || "bg-panel text-text-med"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="prose prose-lg max-w-none"
            >
              {update.content}
            </motion.article>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <section className="py-12 border-t border-white/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex justify-between items-center">
              <Button variant="outline" asChild>
                <Link href="/updates">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All Updates
                </Link>
              </Button>
              
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <a 
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out: ${update.title}`)}&url=${encodeURIComponent(`https://marscredit.org/updates/${slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
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

