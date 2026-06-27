"use client"

import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

interface KpiCardProps {
  label: string
  value: string | number
  subValue?: string
  trend?: number // percentage change
  trendLabel?: string
  icon?: React.ReactNode
  color?: 'emerald' | 'blue' | 'violet' | 'orange' | 'red' | 'amber' | 'cyan' | 'rose'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const COLOR_STYLES: Record<string, string> = {
  emerald: 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5',
  blue: 'border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5',
  violet: 'border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-violet-600/5',
  orange: 'border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5',
  red: 'border-red-500/20 bg-gradient-to-br from-red-500/10 to-red-600/5',
  amber: 'border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5',
  cyan: 'border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5',
  rose: 'border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-rose-600/5',
}

export function KpiCard({ label, value, subValue, trend, trendLabel, icon, color = 'blue', size = 'md', loading }: KpiCardProps) {
  const trendUp = trend !== undefined && trend > 0
  const trendDown = trend !== undefined && trend < 0

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border p-4 transition-all hover:shadow-lg hover:shadow-black/20",
      COLOR_STYLES[color],
    )}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {icon && (
        <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900/50">
          {icon}
        </div>
      )}

      <p className={cn(
        "font-bold text-slate-100 leading-none",
        size === 'sm' ? 'text-xl' : size === 'lg' ? 'text-4xl' : 'text-2xl',
      )}>
        {value}
      </p>

      {subValue && <p className="mt-1 text-xs text-slate-500">{subValue}</p>}

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-slate-400">{label}</p>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-0.5 text-xs font-medium",
            trendUp ? "text-emerald-400" : trendDown ? "text-red-400" : "text-slate-500",
          )}>
            {trendUp ? <ArrowUpRight className="h-3 w-3" /> : trendDown ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {Math.abs(trend).toFixed(1)}%
            {trendLabel && <span className="ml-1 text-slate-600">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
