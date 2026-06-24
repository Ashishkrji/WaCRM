"use client";

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from "react";
import { Send, LayoutTemplate, QrCode, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ReplyQuote } from "./reply-quote";
import { createClient } from "@/lib/supabase/client";
import type { QuickReply } from "@/types";
import { toast } from "sonner";

interface ReplyDraft {
  /** Internal UUID of the message being replied to — sent back through onSend. */
  id: string;
  authorLabel: string;
  preview: string;
}

interface MessageComposerProps {
  conversationId: string;
  sessionExpired: boolean;
  onSend: (text: string, replyToId?: string, isInternal?: boolean) => void;
  onOpenTemplates: () => void;
  replyTo?: ReplyDraft | null;
  onClearReply?: () => void;
  onTyping?: (typing: boolean) => void;
  locked?: boolean;
  lockedBy?: string;
  onOverrideLock?: () => void;
}

export function MessageComposer({
  conversationId,
  sessionExpired,
  onSend,
  onOpenTemplates,
  replyTo,
  onClearReply,
  onTyping,
  locked = false,
  lockedBy = "",
  onOverrideLock,
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [recommendedReplies, setRecommendedReplies] = useState<QuickReply[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const supabase = createClient();

  // India-specific UPI request generator states
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiVpa, setUpiVpa] = useState("wacrm.merchant@okhdfcbank");
  const [upiAmount, setUpiAmount] = useState("999");
  const [upiNote, setUpiNote] = useState("Order Confirmation");

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    // Max 4 lines (~96px)
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, []);

  const handleAiAssist = useCallback(async () => {
    if (drafting || (sessionExpired && !isInternal)) return;
    setDrafting(true);

    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.draft) {
        setText(data.draft);
        setRecommendedReplies(data.recommendedReplies || []);
        if (textareaRef.current) {
          textareaRef.current.focus();
          setTimeout(adjustHeight, 0);
        }
        toast.success("AI draft generated!");
      } else {
        const err = data.error || `HTTP ${res.status}`;
        console.error("AI Assist failed:", err);
        toast.error(`AI Assist failed: ${err}`);
      }
    } catch (error) {
      console.error("AI Assist network error:", error);
      toast.error("AI Assist network error");
    } finally {
      setDrafting(false);
    }
  }, [conversationId, drafting, sessionExpired, isInternal, adjustHeight]);

  useEffect(() => {
    async function loadQR() {
      const { data } = await supabase.from("quick_replies").select("*");
      if (data) setQuickReplies(data);
    }
    loadQR();
  }, [supabase]);

  useEffect(() => {
    // Reset internal switch when conversation swaps
    setIsInternal(false);
  }, [conversationId]);

  const activeQuickReplies = quickReplies.filter(qr => 
    qr.shortcut.toLowerCase().startsWith(text.toLowerCase())
  );

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || (sessionExpired && !isInternal)) return;

    setSending(true);
    try {
      onSend(trimmed, replyTo?.id, isInternal);
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      if (onTyping) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        onTyping(false);
      }
    } finally {
      setSending(false);
    }
  }, [text, sending, sessionExpired, onSend, replyTo?.id, isInternal, onTyping]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        
        if (showQuickReplies && activeQuickReplies.length > 0) {
          setText(activeQuickReplies[0].message_text);
          setShowQuickReplies(false);
          return;
        }

        handleSend();
      }
      
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

      if (onTyping) {
        onTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false);
        }, 2000);
      }
    },
    [adjustHeight, onTyping]
  );

  function selectQuickReply(qr: QuickReply) {
    setText(qr.message_text);
    setShowQuickReplies(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(adjustHeight, 0);
    }
  }

  return (
    <div className="border-t border-slate-800 bg-slate-900 p-3">
      {/* Collision Lock Warning */}
      {locked && (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-rose-500/10 px-3 py-2 border border-rose-500/20 animate-pulse">
          <p className="text-xs text-rose-400 font-semibold">
            🔒 Locked: {lockedBy} is currently typing/replying...
          </p>
          {onOverrideLock && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
              onClick={onOverrideLock}
            >
              Admin Override
            </Button>
          )}
        </div>
      )}

      {/* Switcher */}
      <div className="flex gap-4 mb-2 px-1 text-[11px] border-b border-slate-800/40 pb-2">
        <button
          type="button"
          onClick={() => setIsInternal(false)}
          className={cn(
            "pb-1 border-b-2 font-semibold transition-all px-1",
            !isInternal
              ? "border-primary text-primary"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          Reply (WhatsApp)
        </button>
        <button
          type="button"
          onClick={() => setIsInternal(true)}
          className={cn(
            "pb-1 border-b-2 font-semibold transition-all px-1",
            isInternal
              ? "border-amber-400 text-amber-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          )}
        >
          Internal Note (Private)
        </button>
      </div>

      {replyTo && (
        <div className="mb-2">
          <ReplyQuote
            authorLabel={replyTo.authorLabel}
            preview={replyTo.preview}
            onDismiss={onClearReply}
          />
        </div>
      )}
      {sessionExpired && !isInternal && (
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

      {recommendedReplies.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5 items-center bg-indigo-950/20 p-2 rounded-xl border border-indigo-500/10">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />
            AI Suggestions:
          </span>
          {recommendedReplies.map(qr => (
            <button
              key={qr.id}
              type="button"
              onClick={() => {
                selectQuickReply(qr);
                setRecommendedReplies([]);
              }}
              className="text-[11px] bg-slate-800 hover:bg-indigo-955 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500/35 px-2.5 py-1 rounded-full transition-all text-slate-300 flex items-center gap-1.5 font-medium"
              title={qr.message_text}
            >
              <span className="font-semibold font-mono text-[9px] text-primary">{qr.shortcut}</span>
              <span className="truncate max-w-[150px]">{qr.message_text}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRecommendedReplies([])}
            className="text-[10px] text-slate-500 hover:text-slate-300 ml-auto px-1.5 font-medium"
          >
            Clear
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-slate-400 hover:text-white"
            onClick={onOpenTemplates}
            disabled={locked}
            title="Send template"
          >
            <LayoutTemplate className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 w-9 p-0 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/60 transition-all rounded-lg",
              drafting && "animate-pulse"
            )}
            onClick={handleAiAssist}
            disabled={drafting || (sessionExpired && !isInternal) || locked}
            title="Ask AI Team Assistant to draft a reply"
          >
            {drafting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-450 border-t-transparent" />
            ) : (
              <Sparkles className="h-4.5 w-4.5" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/60 transition-all rounded-lg"
            onClick={() => setShowUpiModal(true)}
            disabled={locked}
            title="Generate UPI Payment Request"
          >
            <QrCode className="h-4.5 w-4.5" />
          </Button>
        </div>

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
              locked
                ? "Composer is locked..."
                : sessionExpired && !isInternal
                  ? "Session expired - use a template"
                  : "Type a message... (Shift+Enter for new line)"
            }
            disabled={(sessionExpired && !isInternal) || locked}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors block focus:border-primary/50",
              isInternal
                ? "border-amber-500/30 bg-amber-500/5 focus:border-amber-500/50"
                : "border-slate-700 bg-slate-800 focus:border-primary/50",
              ((sessionExpired && !isInternal) || locked) && "cursor-not-allowed opacity-50"
            )}
          />
        </div>

        <Button
          size="sm"
          className="h-9 w-9 shrink-0 bg-primary p-0 hover:bg-primary/90 disabled:opacity-40"
          disabled={!text.trim() || ((sessionExpired && !isInternal) || sending || locked)}
          onClick={handleSend}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <p className="mt-1 pl-20 text-[10px] text-slate-650">
        Type &apos;/&apos; for quick replies or generate Indian UPI QR invoices
      </p>

      {/* RAZORPAY & BHIM COMPLIANT UPI QR REQUEST MAKER MODAL */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 text-white overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-950/40">
              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <QrCode className="h-4 w-4" />
                BHIM UPI Payment Request Link
              </span>
              <button 
                type="button"
                onClick={() => setShowUpiModal(false)} 
                className="text-slate-400 hover:text-white focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold uppercase">Merchant UPI ID (VPA)</label>
                <input 
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="merchant@upi"
                  className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-lg text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Amount (INR)</label>
                  <input 
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value)}
                    placeholder="e.g. 999"
                    className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Transaction Note</label>
                  <input 
                    value={upiNote}
                    onChange={(e) => setUpiNote(e.target.value)}
                    placeholder="Order Confirmation"
                    className="w-full bg-slate-950 border border-slate-800 p-2 text-xs rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="h-px bg-slate-800 my-2" />

              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowUpiModal(false)}
                  className="border-slate-800 bg-slate-950 text-slate-400 hover:text-white text-xs h-8 px-3 rounded-lg"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    const cleanNote = encodeURIComponent(upiNote);
                    const payLink = `upi://pay?pa=${upiVpa}&pn=WaCRM%20Merchant&am=${upiAmount}&cu=INR&tn=${cleanNote}`;
                    const upiText = `👉 *UPI Payment Request* 👈\n\n*Amount:* ₹${upiAmount}\n*Description:* ${upiNote}\n\nScan this QR or click the link to pay instantly using any UPI App (GPay/PhonePe/Paytm):\n\n🔗 ${payLink}`;
                    
                    setText(upiText);
                    setShowUpiModal(false);
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                      setTimeout(adjustHeight, 0);
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-4 rounded-lg border-0 font-semibold"
                >
                  Insert Payment Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
