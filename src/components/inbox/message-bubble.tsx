"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Message, MessageReaction } from "@/types";
import {
  Clock,
  Check,
  CheckCheck,
  XCircle,
  FileText,
  MapPin,
  LayoutTemplate,
  ImageOff,
  CornerDownLeft,
  QrCode,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { ReplyQuote } from "./reply-quote";
import { MessageReactions } from "./message-reactions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface UpiRequestCardProps {
  message: Message;
}

function UpiRequestCard({ message }: UpiRequestCardProps) {
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const text = message.content_text || "";
  
  // Extract transaction details
  const amountMatch = text.match(/\*Amount:\*\s*₹([\d\.]+)/i);
  const descMatch = text.match(/\*Description:\*\s*(.+)/i);
  const vpaMatch = text.match(/pa=([^&]+)/i);

  const amount = amountMatch ? amountMatch[1] : "999";
  const description = descMatch ? descMatch[1].trim() : "Order Payment";
  const vpa = vpaMatch ? decodeURIComponent(vpaMatch[1]) : "merchant@upi";

  const handleSimulatedPay = async () => {
    setPaying(true);
    const supabase = createClient();
    
    try {
      // Simulate bank clearing house latency
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Update Deals table: find any open deal associated with this conversation
      let { data: deals } = await supabase
        .from("deals")
        .select("*")
        .eq("conversation_id", message.conversation_id)
        .eq("status", "open");
        
      if (!deals || deals.length === 0) {
        // Fallback: update any open deal in the system to demonstrate pipeline integration
        const { data: fallbackDeals } = await supabase
          .from("deals")
          .select("*")
          .eq("status", "open")
          .limit(1);
        deals = fallbackDeals;
      }

      if (deals && deals.length > 0) {
        const deal = deals[0];
        await supabase
          .from("deals")
          .update({ status: "won" })
          .eq("id", deal.id);
        
        toast.success(`Payment verified! Deal "${deal.title}" automatically updated to WON.`);
      } else {
        toast.info("No open deals found in pipeline, but UPI transaction completed successfully!");
      }

      // Insert system success notification in thread
      const mockTx = `UPI${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      await supabase
        .from("messages")
        .insert({
          conversation_id: message.conversation_id,
          sender_type: "bot",
          content_type: "text",
          content_text: `✅ *UPI Payment Success* 👈\n\n*Amount:* ₹${amount}\n*Transaction ID:* ${mockTx}\n\nThe customer has successfully paid ₹${amount} via UPI. The deal stage has been automatically updated to *Won/Paid*!`,
          status: "read",
        });

      setPaid(true);
    } catch (e) {
      console.error(e);
      toast.error("Simulated payment failed");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="my-2 rounded-2xl border border-indigo-500/30 bg-slate-900 text-white shadow-xl max-w-xs relative overflow-hidden p-4">
      <div className="absolute top-0 right-0 bg-indigo-650 text-indigo-300 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-bl">
        BHIM UPI QR
      </div>
      
      <div className="flex items-center gap-2 mb-3">
        <QrCode className="h-5 w-5 text-indigo-400" />
        <div>
          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">UPI Payment Request</h4>
          <p className="text-[9px] text-slate-500 font-mono truncate max-w-[180px]">{vpa}</p>
        </div>
      </div>

      <div className="bg-slate-950/65 rounded-xl p-3 border border-slate-800/80 mb-3 space-y-1">
        <span className="text-[9px] text-slate-500 font-bold uppercase block">Amount Requested:</span>
        <h3 className="text-xl font-extrabold text-emerald-400">₹{parseFloat(amount).toLocaleString("en-IN")}.00</h3>
        <p className="text-[10px] text-slate-400 font-medium">Ref: {description}</p>
      </div>

      <div className="flex items-center justify-center p-2 rounded-xl bg-white mb-3">
        <div className="grid grid-cols-5 gap-0.5 w-24 h-24 bg-white p-1 text-slate-950 font-bold text-center">
          <div className="border-4 border-slate-950"></div>
          <div></div>
          <div className="bg-slate-950"></div>
          <div></div>
          <div className="border-4 border-slate-950"></div>
          
          <div></div>
          <div className="bg-slate-950"></div>
          <div></div>
          <div className="bg-slate-950"></div>
          <div></div>
          
          <div className="bg-slate-950"></div>
          <div></div>
          <div className="bg-slate-950"></div>
          <div></div>
          <div className="bg-slate-950"></div>
          
          <div></div>
          <div className="bg-slate-950"></div>
          <div></div>
          <div className="bg-slate-950"></div>
          <div></div>
          
          <div className="border-4 border-slate-950"></div>
          <div></div>
          <div className="bg-slate-950"></div>
          <div></div>
          <div className="border-4 border-slate-950"></div>
        </div>
      </div>

      {paid ? (
        <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Paid & Synced
        </div>
      ) : (
        <button
          onClick={handleSimulatedPay}
          disabled={paying}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 focus:outline-none"
        >
          {paying ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Processing payment...
            </>
          ) : (
            "Simulate Customer Pay"
          )}
        </button>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  /** Pre-computed quote info for messages that reply to another. */
  reply?: { authorLabel: string; preview: string } | null;
  reactions?: MessageReaction[];
  currentUserId?: string;
  onToggleReaction?: (emoji: string) => void;
}

function StatusIcon({ status }: { status: Message["status"] }) {
  switch (status) {
    case "sending":
      return <Clock className="h-3 w-3 text-slate-400" />;
    case "sent":
      return <Check className="h-3 w-3 text-slate-400" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-slate-400" />;
    case "read":
      return <CheckCheck className="h-3 w-3 text-blue-400" />;
    case "failed":
      return <XCircle className="h-3 w-3 text-red-400" />;
    default:
      return null;
  }
}

function MediaUnavailable({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-slate-700/40 px-3 py-2 text-xs text-slate-300">
      <ImageOff className="h-4 w-4 shrink-0 text-slate-500" />
      <span>{label} unavailable</span>
    </div>
  );
}

function MediaImage({ url, alt }: { url: string; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadImage = useCallback(async () => {
    if (!url) return;

    // Proxy URLs need auth fetch to create blob URL
    if (url.startsWith("/api/whatsapp/media/")) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load media");
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        setSrc(blobUrl);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    } else {
      setSrc(url);
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    loadImage();
    return () => {
      if (src?.startsWith("blob:")) {
        URL.revokeObjectURL(src);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadImage]);

  if (error) {
    return (
      <div className="flex h-40 w-60 items-center justify-center rounded-lg bg-slate-700">
        <ImageOff className="h-8 w-8 text-slate-500" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-40 w-60 items-center justify-center rounded-lg bg-slate-700">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <img
      src={src ?? ""}
      alt={alt}
      className="max-h-64 max-w-60 rounded-lg object-cover"
      onError={() => setError(true)}
    />
  );
}

function MessageContent({ message }: { message: Message }) {
  switch (message.content_type) {
    case "text":
      if (message.content_text?.includes("👉 *UPI Payment Request* 👈")) {
        return <UpiRequestCard message={message} />;
      }
      return (
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.content_text}
        </p>
      );

    case "image":
      return (
        <div>
          {message.media_url ? (
            <MediaImage url={message.media_url} alt="Shared image" />
          ) : (
            <MediaUnavailable label="Image" />
          )}
          {message.content_text && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">
              {message.content_text}
            </p>
          )}
        </div>
      );

    case "video":
      return (
        <div>
          {message.media_url ? (
            <video
              src={message.media_url}
              controls
              className="max-h-64 max-w-60 rounded-lg"
            />
          ) : (
            <MediaUnavailable label="Video" />
          )}
          {message.content_text && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">
              {message.content_text}
            </p>
          )}
        </div>
      );

    case "audio":
      return (
        <div>
          {message.media_url ? (
            <audio src={message.media_url} controls className="max-w-60" />
          ) : (
            <MediaUnavailable label="Audio" />
          )}
        </div>
      );

    case "document":
      if (!message.media_url) {
        return <MediaUnavailable label={message.content_text || "Document"} />;
      }
      return (
        <a
          href={message.media_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-slate-700/50 px-3 py-2 text-sm hover:bg-slate-700"
        >
          <FileText className="h-5 w-5 shrink-0 text-slate-400" />
          <span className="truncate">
            {message.content_text || "Document"}
          </span>
        </a>
      );

    case "template":
      return (
        <div>
          <span className="mb-1 inline-flex items-center gap-1 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            <LayoutTemplate className="h-3 w-3" />
            Template
          </span>
          {message.content_text && (
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">
              {message.content_text}
            </p>
          )}
        </div>
      );

    case "location":
      return (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
          <span>{message.content_text || "Location shared"}</span>
        </div>
      );

    case "interactive": {
      // Customer tapped a reply button or list row on a message the bot
      // sent. We show the tapped option's title (already in content_text,
      // set by parseMessageContent in the webhook) with a small affordance
      // so agents reading the inbox can tell at a glance that this is a
      // tap rather than the customer typing the same words.
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
            <CornerDownLeft className="h-3 w-3" />
            Button reply
          </span>
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content_text || "[Interactive reply]"}
          </p>
        </div>
      );
    }

    default:
      return (
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.content_text || "[Unsupported message type]"}
        </p>
      );
  }
}

export function MessageBubble({
  message,
  reply,
  reactions,
  currentUserId,
  onToggleReaction,
}: MessageBubbleProps) {
  const isAgent = message.sender_type === "agent" || message.sender_type === "bot";
  const time = format(new Date(message.created_at), "HH:mm");

  // Row alignment + width cap are owned by <MessageActions> so its hover
  // group matches the bubble's content area, not the full row.
  return (
    <div
      className={cn(
        "flex flex-col",
        isAgent ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "relative rounded-2xl px-3 py-2",
          isAgent
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-slate-800 text-slate-100",
        )}
      >
        {reply && (
          <ReplyQuote authorLabel={reply.authorLabel} preview={reply.preview} />
        )}
        <MessageContent message={message} />
        <div
          className={cn(
            "mt-1 flex items-center gap-1",
            isAgent ? "justify-end" : "justify-start",
          )}
        >
          <span className="text-[10px] text-white/60">{time}</span>
          {isAgent && <StatusIcon status={message.status} />}
        </div>
      </div>
      {reactions && reactions.length > 0 && onToggleReaction && (
        <MessageReactions
          reactions={reactions}
          currentUserId={currentUserId}
          onToggle={onToggleReaction}
        />
      )}
    </div>
  );
}
