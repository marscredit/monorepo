"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { links } from "@/lib/config"
import { cn } from "@/lib/utils"
import { ExternalLink, Github, Pickaxe, X } from "lucide-react"

const navigation = [
  { name: "Home", href: "/" },
  { name: "The Story", href: "/story" },
  { name: "Updates", href: "/updates" },
  { name: "Blockscan", href: links.blockscan, external: true },
]

const actionButtons = [
  { name: "Mine Mars", href: "https://github.com/marscredit/go-marscredit", icon: Pickaxe, variant: "outline" as const },
  { name: "GitHub", href: links.github, icon: Github, variant: "ghost" as const },
]

export function Navigation() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-6 px-4">
      <div
        className={cn(
          "w-full max-w-5xl rounded-full border border-white/10 transition-all duration-300 shadow-2xl shadow-black/50",
          isScrolled 
            ? "bg-black/40 backdrop-blur-2xl" 
            : "bg-black/30 backdrop-blur-2xl"
        )}
      >
        <div className="flex h-14 items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/brand/marscredit_square_transparent.png"
              alt="Mars Credit"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
            <span className="ml-2 text-white font-semibold text-sm tracking-tight hidden sm:inline">
              Mars Credit
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-white",
                  pathname === item.href 
                    ? "text-white" 
                    : "text-white/70"
                )}
                {...(item.external && { target: "_blank", rel: "noopener noreferrer" })}
              >
                {item.name}
                {item.external && <ExternalLink className="ml-1 h-3 w-3 inline" />}
              </Link>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            {actionButtons.map((button) => {
              const Icon = button.icon
              return (
                <Link
                  key={button.name}
                  href={button.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center text-sm font-medium transition-colors hover:text-white px-3 py-1.5 rounded-full",
                    button.variant === "outline" 
                      ? "bg-white/10 text-white hover:bg-white/20" 
                      : "text-white/70"
                  )}
                >
                  <Icon className="mr-1.5 h-4 w-4" />
                  {button.name}
                </Link>
              )
            })}
          </div>

          {/* Mobile menu button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Separate Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden w-full max-w-5xl mt-2 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl shadow-black/50 py-4 px-6">
          <nav className="flex flex-col space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-white",
                  pathname === item.href 
                    ? "text-white" 
                    : "text-white/70"
                )}
                {...(item.external && { target: "_blank", rel: "noopener noreferrer" })}
              >
                {item.name}
                {item.external && <ExternalLink className="ml-1 h-3 w-3 inline" />}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 flex flex-col space-y-2">
              {actionButtons.map((button) => {
                const Icon = button.icon
                return (
                  <Link
                    key={button.name}
                    href={button.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "inline-flex items-center justify-center text-sm font-medium transition-colors hover:text-white px-3 py-2 rounded-full",
                      button.variant === "outline" 
                        ? "bg-white/10 text-white hover:bg-white/20" 
                        : "text-white/70"
                    )}
                  >
                    <Icon className="mr-1.5 h-4 w-4" />
                    {button.name}
                  </Link>
                )
              })}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
