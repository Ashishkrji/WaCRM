"use client";

import { useState, useRef, useCallback, KeyboardEvent, useEffect } from "react";
import { Send, LayoutTemplate, QrCode, X } from "lucide-react";
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

  // India-specific UPI request generator states
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiVpa, setUpiVpa] = useState("wacrm.merchant@okhdfcbank");
  const [upiAmount, setUpiAmount] = useState("999");
  const [upiNote, setUpiNote] = useState("Order Confirmation");

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
    },
    [adjustHeight]
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
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-slate-400 hover:text-white"
            onClick={onOpenTemplates}
            title="Send template"
          >
            <LayoutTemplate className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/60 transition-all rounded-lg"
            onClick={() => setShowUpiModal(true)}
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
