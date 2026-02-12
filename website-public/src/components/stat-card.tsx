"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string
  hint?: string
  className?: string
  delay?: number
}

export function StatCard({ label, value, hint, className, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn("transition-all duration-200", className)}
    >
      <Card className="text-center relative">
        <div className="relative z-10">
          <div className="text-sm font-medium text-text-lo uppercase tracking-wider">
            {label}
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {value}
          </div>
          {hint && (
            <div className="mt-1 text-xs text-text-lo opacity-75">
              {hint}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

