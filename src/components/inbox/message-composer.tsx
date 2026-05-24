"use client";

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from "react";
import { Send, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReplyQuote } from "./reply-quote";
import { createClient } from "@/lib/supabase/client";
import type { QuickReply } from "@/types";

interface ReplyDraft {
  /** Internal UUID of the message being replied to — sent back through onSend. */
  id: string;
  authorLabel: string;
  preview: string;
}

interface MessageComposerProps {
  conversationId: string;
  sessionExpired: boolean;
  onSend: (text: string, replyToId?: string) => void;
  onOpenTemplates: () => void;
  replyTo?: ReplyDraft | null;
  onClearReply?: () => void;
}

export function MessageComposer({
  conversationId,
  sessionExpired,
  onSend,
  onOpenTemplates,
  replyTo,
  onClearReply,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadQR() {
      const { data } = await supabase.from("quick_replies").select("*");
      if (data) setQuickReplies(data);
    }
    loadQR();
  }, [supabase]);

  const activeQuickReplies = quickReplies.filter(qr => 
    qr.shortcut.toLowerCase().startsWith(text.toLowerCase())
  );

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    // Max 4 lines (~96px)
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || sessionExpired) return;

    setSending(true);
    try {
      onSend(trimmed, replyTo?.id);
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setSending(false);
    }
  }, [text, sending, sessionExpired, onSend, replyTo?.id]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        
        // If showing quick replies and there's an exact match or just one, maybe select it?
        // Keep it simple: Enter sends the message if not selecting. 
        // We will let them click to select for now to avoid sending accidentally.
        if (showQuickReplies && activeQuickReplies.length > 0) {
          setText(activeQuickReplies[0].message_text);
          setShowQuickReplies(false);
          return;
        }

        handleSend();
      }
      
      // Close quick replies if escape is pressed
      if (e.key === "Escape") {
        setShowQuickReplies(false);
      }
    },
    [handleSend, showQuickReplies, activeQuickReplies]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setText(val);
      adjustHeight();
      
      if (val.startsWith("/")) {
        setShowQuickReplies(true);
      } else {
        setShowQuickReplies(false);
      }
    },
    [adjustHeight]
  );

  function selectQuickReply(qr: QuickReply) {
    setText(qr.message_text);
    setShowQuickReplies(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
      // small delay to let react update before adjusting height
      setTimeout(adjustHeight, 0);
    }
  }

  return (
    <div className="border-t border-slate-800 bg-slate-900 p-3">
      {replyTo && (
        <div className="mb-2">
          <ReplyQuote
            authorLabel={replyTo.authorLabel}
            preview={replyTo.preview}
            onDismiss={onClearReply}
          />
        </div>
      )}
      {sessionExpired && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-amber-500/10 px-3 py-2">
          <p className="text-xs text-amber-400">
            24-hour session expired. Use a template to re-engage.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-amber-400 hover:text-amber-300"
            onClick={onOpenTemplates}
          >
            <LayoutTemplate className="mr-1 h-3 w-3" />
            Templates
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 shrink-0 p-0 text-slate-400 hover:text-white"
          onClick={onOpenTemplates}
          title="Send template"
        >
          <LayoutTemplate className="h-4 w-4" />
        </Button>

        <div className="relative flex-1">
          {showQuickReplies && activeQuickReplies.length > 0 && (
            <div className="absolute bottom-full left-0 mb-2 w-full max-h-[200px] overflow-y-auto rounded-xl border border-slate-700 bg-slate-800 shadow-xl z-50">
              <ul className="p-1">
                {activeQuickReplies.map(qr => (
                  <li key={qr.id}>
                    <button
                      className="w-full flex flex-col text-left px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors"
                      onClick={() => selectQuickReply(qr)}
                    >
                      <span className="text-primary font-mono text-xs font-semibold">{qr.shortcut}</span>
                      <span className="text-slate-300 text-xs truncate w-full">{qr.message_text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              sessionExpired
                ? "Session expired - use a template"
                : "Type a message... (Shift+Enter for new line)"
            }
            disabled={sessionExpired}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-primary/50 block",
              sessionExpired && "cursor-not-allowed opacity-50"
            )}
          />
        </div>

        <Button
          size="sm"
          className="h-9 w-9 shrink-0 bg-primary p-0 hover:bg-primary/90 disabled:opacity-40"
          disabled={!text.trim() || sessionExpired || sending}
          onClick={handleSend}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Hint sits outside the flex row so its height doesn't push
          `items-end` buttons below the textarea. Indented to line up
          under the textarea left edge (w-9 button + gap-2 = 44px). */}
      <p className="mt-1 pl-11 text-[10px] text-slate-600">
        Type &apos;/&apos; for quick replies
      </p>
    </div>
  );
}
