"use client"

import { useState } from "react"

export function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="relative group rounded-xl border border-white/10 bg-black/60 overflow-hidden">
      {label ? (
        <div className="px-4 pt-3 text-xs uppercase tracking-wider text-text-lo">{label}</div>
      ) : null}
      <pre className="p-4 overflow-x-auto text-sm text-text-med font-mono whitespace-pre-wrap break-all">
        {code}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2 right-2 text-xs px-2 py-1 rounded-md bg-white/10 text-white hover:bg-white/20"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  )
}
