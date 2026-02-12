"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MarsOrbProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "h-16 w-16",
  md: "h-24 w-24", 
  lg: "h-32 w-32",
  xl: "h-48 w-48",
}

export function MarsOrb({ className, size = "lg" }: MarsOrbProps) {
  return (
    <div className={cn("relative", className)}>
      <motion.div
        className={cn(
          "mars-orb rounded-full relative overflow-hidden",
          sizeClasses[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-mars-500/30 to-transparent" />
        
        {/* Surface details */}
        <div className="absolute inset-0 rounded-full">
          <div className="absolute top-1/4 left-1/3 h-2 w-2 rounded-full bg-mars-800 opacity-60" />
          <div className="absolute top-2/3 right-1/4 h-1 w-1 rounded-full bg-mars-900 opacity-40" />
          <div className="absolute bottom-1/3 left-1/4 h-1.5 w-1.5 rounded-full bg-mars-700 opacity-50" />
        </div>
        
        {/* Atmospheric glow */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-mars-500/20 to-mars-300/10 blur-sm" />
      </motion.div>
      
      {/* Orbital particles */}
      <motion.div
        className="absolute inset-0 rounded-full border border-mars-500/20"
        style={{ padding: size === 'xl' ? '2rem' : '1rem' }}
        animate={{ rotate: -360 }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div className="absolute top-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-mars-500 opacity-60" />
        <div className="absolute bottom-0 right-1/2 h-0.5 w-0.5 translate-x-1/2 rounded-full bg-mars-300 opacity-40" />
      </motion.div>
    </div>
  )
}

