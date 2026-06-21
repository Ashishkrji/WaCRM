import { Sparkles, ArrowRightLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIStatusBadgeProps {
  senderType?: string;
  handedOff?: boolean;
  className?: string;
}

export function AIStatusBadge({ senderType, handedOff, className }: AIStatusBadgeProps) {
  if (senderType === 'bot') {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-full select-none",
        className
      )}>
        <Sparkles className="h-2.5 w-2.5" />
        AI Bot
      </span>
    )
  }

  if (handedOff) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full select-none",
        className
      )}>
        <ArrowRightLeft className="h-2.5 w-2.5" />
        Handed Off
      </span>
    )
  }

  return null
}
export default AIStatusBadge;
