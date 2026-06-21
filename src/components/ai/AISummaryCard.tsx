import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ClipboardCopy, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface AISummaryCardProps {
  summary: string;
  messageCount?: number;
  createdAt?: string;
}

export function AISummaryCard({ summary, messageCount, createdAt }: AISummaryCardProps) {
  if (!summary) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    toast.success("Summary copied to clipboard!");
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-950/20 to-slate-900/60 border-slate-800 shadow-md relative overflow-hidden group">
      <div className="absolute top-0 right-0 h-24 w-24 bg-indigo-500/5 blur-xl rounded-full pointer-events-none" />
      
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-bold text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            AI Conversation Summary
          </CardTitle>
          <CardDescription className="text-[10px] text-slate-500 mt-0.5">
            Quick brief derived from chat history
          </CardDescription>
        </div>
        
        <button
          onClick={handleCopy}
          className="text-slate-500 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
          title="Copy Summary"
        >
          <ClipboardCopy className="h-3.5 w-3.5" />
        </button>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-3">
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {summary}
        </p>
        
        {(messageCount || createdAt) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-slate-500 pt-2 border-t border-slate-850/50">
            {messageCount && (
              <span className="flex items-center gap-1">
                <strong>{messageCount}</strong> messages summarized
              </span>
            )}
            {createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(createdAt).toLocaleDateString()} at {new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AISummaryCard;
