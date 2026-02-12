"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
  delay?: number
}

export function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  className, 
  delay = 0 
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className={cn("group cursor-default", className)}
    >
      <Card className="h-full p-6 transition-all duration-300">
        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-black border border-mars-600 group-hover:border-mars-400 transition-all duration-300 shadow-[0_0_20px_rgba(204,0,0,0.2)]">
            <Icon className="h-8 w-8 text-mars-400 group-hover:text-mars-300 transition-colors duration-300" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white group-hover:text-mars-300 transition-colors duration-300">
              {title}
            </h3>
            <p className="text-text-med text-balance leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

