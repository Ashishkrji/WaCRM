"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  KeyboardEvent,
} from "react";
import {
  Send,
  LayoutTemplate,
  Paperclip,
  Image as ImageIcon,
  Video,
  FileText,
  Mic,
  Square,
  X,
  Loader2,
  Sparkles,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GatedButton } from "@/components/ui/gated-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCan } from "@/hooks/use-can";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  uploadAccountMedia,
  deleteAccountMedia,
  MEDIA_MAX_BYTES_BY_KIND,
} from "@/lib/storage/upload-media";
import { ReplyQuote } from "./reply-quote";
import { createClient } from "@/lib/supabase/client";
import type { QuickReply } from "@/types";

/** Media content types an agent can send from the composer. */
export type ComposerMediaKind = "image" | "video" | "document" | "audio";

/** Supabase Storage bucket holding agent-sent chat attachments (migration 023). */
export const CHAT_MEDIA_BUCKET = "chat-media";

/** Meta caps media captions at 1024 chars. Enforced here and in the send route. */
export const MEDIA_CAPTION_MAX = 1024;

/** Hard cap on a single voice recording so it can't blow the upload/
 *  transcode limits — auto-stops the recorder when reached. */
const MAX_RECORDING_SECONDS = 5 * 60;

export interface SendMediaPayload {
  kind: ComposerMediaKind;
  /** Public chat-media URL Meta fetches at send time. */
  mediaUrl: string;
  /** Storage object path — lets the caller GC the object if the send fails. */
  path: string;
  /** Optional caption (image/video/document only). */
  caption?: string;
  /** Original file name — surfaced to the recipient for documents. */
  filename?: string;
  replyToId?: string;
}

interface ReplyDraft {
  /** Internal UUID of the message being replied to — sent back through onSend. */
  id: string;
  authorLabel: string;
  preview: string;
}

// Mirrors the chat-media bucket's allowed_mime_types (migration 023) for
// the file picker so unsupported files are rejected before upload rather
// than failing with a confusing Storage error. Audio has no picker — it's
// captured via the recorder.
const PICKER_ACCEPT: Record<"image" | "video" | "document", string> = {
  image: "image/png,image/jpeg,image/webp",
  video: "video/mp4,video/3gpp",
  document:
    "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain",
};

interface MediaDraft {
  kind: ComposerMediaKind;
  mediaUrl: string;
  /** Storage path — used to GC the object if the draft is discarded. */
  path: string;
  filename: string;
  caption: string;
}

interface MessageComposerProps {
  conversationId: string;
  sessionExpired: boolean;
  onSend: (text: string, replyToId?: string, isInternal?: boolean) => void;
  onSendMedia: (payload: SendMediaPayload) => void;
  onOpenTemplates: () => void;
  replyTo?: ReplyDraft | null;
  onClearReply?: () => void;
  onTyping?: (typing: boolean) => void;
  locked?: boolean;
  lockedBy?: string;
  onOverrideLock?: () => void;
  recommendedReplies?: QuickReply[];
  setRecommendedReplies?: (replies: QuickReply[]) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Worker that encodes mic input to Ogg/Opus entirely in the browser
 *  (vendored from opus-recorder into /public). Recording client-side in a
 *  Meta-accepted format means no server ffmpeg / transcode step. */
const OPUS_ENCODER_PATH = "/opus/encoderWorker.min.js";

export function MessageComposer({
  conversationId,
  sessionExpired,
  onSend,
  onSendMedia,
  onOpenTemplates,
  replyTo,
  onClearReply,
  onTyping,
  locked = false,
  lockedBy,
  onOverrideLock,
  recommendedReplies = [],
  setRecommendedReplies = () => {},
}: MessageComposerProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local CRM states
  const [isInternal, setIsInternal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiVpa, setUpiVpa] = useState("merchant@upi");
  const [upiAmount, setUpiAmount] = useState("");
  const [upiNote, setUpiNote] = useState("");
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [drafting, setDrafting] = useState(false);

  // Media attachment state. `draft` holds an uploaded-but-not-yet-sent
  // attachment; `busy` covers the upload/transcode window.
  const [draft, setDraft] = useState<MediaDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  // Mirror of `draft` for the unmount cleanup, which can't read render
  // state. Kept in sync below so navigating away with a staged-but-unsent
  // attachment GCs the orphaned object.
  const draftRef = useRef<MediaDraft | null>(null);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  // Best-effort GC of a staged object the user never sent. Fire-and-forget.
  const removeStaged = useCallback((path: string | undefined) => {
    if (!path) return;
    void deleteAccountMedia(CHAT_MEDIA_BUCKET, path).catch(() => {});
  }, []);

  // Voice recording state. The recorder encodes Ogg/Opus in-browser
  // (opus-recorder) so there's no server-side transcode.
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recorderRef = useRef<import("opus-recorder").default | null>(null);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Viewers (read-only role) can browse the inbox but never send.
  // For solo users this is always true — single-owner accounts pass
  // every capability — so the disabled branch is a no-op there.
  const canSend = useCan("send-messages");
  const readOnly = !canSend;
  // Media (like free-form text) is only allowed inside the 24h window (unless internal).
  const inputsDisabled = readOnly || ((sessionExpired && !isInternal) || locked);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Tear down any live recording + timer on unmount so a mid-record
  // navigation doesn't leak the mic, and GC a staged-but-unsent
  // attachment so it doesn't orphan in the bucket.
  useEffect(() => {
    return () => {
      clearTimer();
      cancelledRef.current = true;
      // stop() releases the mic stream + audio context inside opus-recorder.
      void recorderRef.current?.stop().catch(() => {});
      removeStaged(draftRef.current?.path);
    };
  }, [clearTimer, removeStaged]);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    // Max 4 lines (~96px)
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || (sessionExpired && !isInternal) || locked) return;

    setSending(true);
    try {
      onSend(trimmed, replyTo?.id, isInternal);
      setText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      onClearReply?.();
    } finally {
      setSending(false);
    }
  }, [text, sending, sessionExpired, isInternal, locked, onSend, replyTo?.id, onClearReply]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
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

  // Upload a captured file to chat-media and stage it as a draft.
  const stageUpload = useCallback(
    async (kind: ComposerMediaKind, file: File) => {
      const max = MEDIA_MAX_BYTES_BY_KIND[kind];
      if (file.size > max) {
        toast.error(
          `File is ${(file.size / 1024 / 1024).toFixed(1)} MB — ${kind} limit is ${Math.round(
            max / 1024 / 1024,
          )} MB.`,
        );
        return;
      }
      setBusy(true);
      try {
        const { publicUrl, path } = await uploadAccountMedia(CHAT_MEDIA_BUCKET, file);
        removeStaged(draftRef.current?.path);
        setDraft({ kind, mediaUrl: publicUrl, path, filename: file.name, caption: "" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setBusy(false);
      }
    },
    [removeStaged],
  );

  const handlePicked = useCallback(
    (kind: "image" | "video" | "document", file: File | undefined) => {
      if (file) void stageUpload(kind, file);
    },
    [stageUpload],
  );

  // ---- Voice recording ---
  const finalizeRecording = useCallback(
    async (bytes: Uint8Array) => {
      const file = new File([bytes as unknown as BlobPart], `voice-${Date.now()}.ogg`, {
        type: "audio/ogg",
      });
      if (file.size === 0) return;
      if (file.size > MEDIA_MAX_BYTES_BY_KIND.audio) {
        toast.error("Recording is too long (over 16 MB).");
        return;
      }
      setBusy(true);
      try {
        const { publicUrl, path } = await uploadAccountMedia(CHAT_MEDIA_BUCKET, file);
        removeStaged(draftRef.current?.path);
        setDraft({ kind: "audio", mediaUrl: publicUrl, path, filename: file.name, caption: "" });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setBusy(false);
      }
    },
    [removeStaged],
  );

  const startRecording = useCallback(async () => {
    if (inputsDisabled || busy || recording) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof AudioContext === "undefined") {
      toast.error("Voice recording isn't supported in this browser.");
      return;
    }
    try {
      const { default: Recorder } = await import("opus-recorder");
      const recorder = new Recorder({
        encoderPath: OPUS_ENCODER_PATH,
        numberOfChannels: 1,
        encoderApplication: 2048,
        encoderSampleRate: 48000,
        streamPages: false,
      });
      cancelledRef.current = false;
      recorder.ondataavailable = (bytes) => {
        if (cancelledRef.current) return;
        void finalizeRecording(bytes);
      };
      recorderRef.current = recorder;
      await recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      void recorderRef.current?.stop().catch(() => {});
      recorderRef.current = null;
      toast.error("Microphone access denied or unavailable.");
    }
  }, [inputsDisabled, busy, recording, finalizeRecording]);

  const stopRecording = useCallback(() => {
    clearTimer();
    setRecording(false);
    void recorderRef.current?.stop().catch(() => {});
  }, [clearTimer]);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    clearTimer();
    setRecording(false);
    void recorderRef.current?.stop().catch(() => {});
  }, [clearTimer]);

  useEffect(() => {
    if (recording && recordSeconds >= MAX_RECORDING_SECONDS) {
      stopRecording();
    }
  }, [recording, recordSeconds, stopRecording]);

  // ---- Draft send / discard ---
  const sendDraft = useCallback(() => {
    if (!draft || busy) return;
    onSendMedia({
      kind: draft.kind,
      mediaUrl: draft.mediaUrl,
      path: draft.path,
      caption:
        draft.kind === "audio" ? undefined : draft.caption.trim() || undefined,
      filename: draft.kind === "document" ? draft.filename : undefined,
      replyToId: replyTo?.id,
    });
    setDraft(null);
    onClearReply?.();
  }, [draft, busy, onSendMedia, replyTo?.id, onClearReply]);

  const discardDraft = useCallback(() => {
    removeStaged(draft?.path);
    setDraft(null);
  }, [draft?.path, removeStaged]);

  const setCaption = useCallback((caption: string) => {
    setDraft((d) => (d ? { ...d, caption } : d));
  }, []);

  // Fetch quick replies
  useEffect(() => {
    const fetchQuickReplies = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("quick_replies").select("*");
      if (data) {
        setQuickReplies(data);
      }
    };
    void fetchQuickReplies();
  }, []);

  const activeQuickReplies = useMemo(() => {
    if (!text.startsWith("/")) return [];
    const query = text.slice(1).toLowerCase();
    return quickReplies.filter(
      (qr) =>
        qr.shortcut.toLowerCase().includes(query) ||
        qr.message_text.toLowerCase().includes(query)
    );
  }, [text, quickReplies]);

  const selectQuickReply = useCallback((qr: QuickReply) => {
    setText(qr.message_text);
    setShowQuickReplies(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(adjustHeight, 0);
    }
  }, [adjustHeight]);

  const handleAiAssist = useCallback(async () => {
    if (drafting || !conversationId) return;
    setDrafting(true);
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      const data = await res.json();
      if (res.ok && data.draft) {
        setText(data.draft);
        if (textareaRef.current) {
          textareaRef.current.focus();
          setTimeout(adjustHeight, 0);
        }
      } else {
        toast.error(data.message || "Failed to draft reply");
      }
    } catch (err) {
      toast.error("AI Assistant is currently offline.");
    } finally {
      setDrafting(false);
    }
  }, [conversationId, drafting, adjustHeight]);

  const handleSendUpiRequest = () => {
    if (!upiVpa) {
      toast.error("Please enter a valid VPA");
      return;
    }
    const upiLink = `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=Merchant&am=${encodeURIComponent(upiAmount)}&cu=INR&tn=${encodeURIComponent(upiNote || "Payment Request")}`;
    onSend(`💳 Payment Request Generated:\n\n*Amount:* ₹${upiAmount}\n*Note:* ${upiNote || "N/A"}\n\nTap to pay: ${upiLink}`, replyTo?.id, isInternal);
    setShowUpiModal(false);
    setUpiAmount("");
    setUpiNote("");
  };

  return (
    <div className="border-t border-border bg-card p-3">
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
      <div className="flex gap-4 mb-2 px-1 text-[11px] border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setIsInternal(false)}
          className={cn(
            "pb-1 border-b-2 font-semibold transition-all px-1",
            !isInternal
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
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
              : "border-transparent text-muted-foreground hover:text-foreground"
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
        <div className="mb-2 flex flex-wrap gap-1.5 items-center bg-primary/10 p-2 rounded-xl border border-primary/20">
          <span className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            AI Suggestions:
          </span>
          {recommendedReplies.map((qr) => (
            <button
              key={qr.id}
              type="button"
              onClick={() => {
                selectQuickReply(qr);
                setRecommendedReplies([]);
              }}
              className="text-[11px] bg-muted hover:bg-primary/20 hover:text-primary border border-border hover:border-primary/40 px-2.5 py-1 rounded-full transition-all text-foreground flex items-center gap-1.5 font-medium"
              title={qr.message_text}
            >
              <span className="font-semibold font-mono text-[9px] text-primary">{qr.shortcut}</span>
              <span className="truncate max-w-[150px]">{qr.message_text}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setRecommendedReplies([])}
            className="text-[10px] text-muted-foreground hover:text-foreground ml-auto px-1.5 font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {draft && (
        <div className="mb-2">
          <MediaDraftPreview
            draft={draft}
            busy={busy}
            readOnly={readOnly}
            onCaptionChange={setCaption}
            onDiscard={discardDraft}
            onSend={sendDraft}
          />
        </div>
      )}

      {recording && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
            </span>
            <span>Recording {formatDuration(recordSeconds)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90"
            >
              <Square className="h-3 w-3" />
              Stop & Stage
            </button>
          </div>
        </div>
      )}

      {!draft && !recording && (
        <div className="flex items-end gap-2">
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenTemplates}
              disabled={inputsDisabled}
              className="h-9 w-9 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Templates"
            >
              <LayoutTemplate className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={inputsDisabled}
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground outline-none focus:bg-muted"
                title="Attach file"
              >
                <Paperclip className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="top"
                sideOffset={8}
                className="min-w-36 bg-popover text-popover-foreground ring-border"
              >
                <DropdownMenuItem
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Image</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span>Video</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => documentInputRef.current?.click()}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Document</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Hidden file pickers */}
            <input
              type="file"
              ref={imageInputRef}
              accept={PICKER_ACCEPT.image}
              onChange={(e) => handlePicked("image", e.target.files?.[0])}
              className="hidden"
            />
            <input
              type="file"
              ref={videoInputRef}
              accept={PICKER_ACCEPT.video}
              onChange={(e) => handlePicked("video", e.target.files?.[0])}
              className="hidden"
            />
            <input
              type="file"
              ref={documentInputRef}
              accept={PICKER_ACCEPT.document}
              onChange={(e) => handlePicked("document", e.target.files?.[0])}
              className="hidden"
            />

            {/* Voice record button */}
            <button
              type="button"
              disabled={inputsDisabled}
              onClick={startRecording}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
              title="Record voice note"
            >
              <Mic className="h-4 w-4" />
            </button>

            {/* AI Assist & UPI Buttons */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-9 p-0 text-primary hover:text-primary hover:bg-muted/60 transition-all rounded-lg",
                drafting && "animate-pulse"
              )}
              onClick={handleAiAssist}
              disabled={drafting || inputsDisabled}
              title="Ask AI Team Assistant to draft a reply"
            >
              {drafting ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Sparkles className="h-4.5 w-4.5" />
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-primary hover:text-primary hover:bg-muted/60 transition-all rounded-lg"
              onClick={() => setShowUpiModal(true)}
              disabled={inputsDisabled}
              title="Generate UPI Payment Request"
            >
              <QrCode className="h-4.5 w-4.5" />
            </Button>
          </div>

          <div className="relative flex-1">
            {showQuickReplies && activeQuickReplies.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-full max-h-[200px] overflow-y-auto rounded-xl border border-border bg-popover shadow-xl z-50">
                <ul className="p-1">
                  {activeQuickReplies.map((qr) => (
                    <li key={qr.id}>
                      <button
                        className="w-full flex flex-col text-left px-3 py-2 hover:bg-muted rounded-lg transition-colors"
                        onClick={() => selectQuickReply(qr)}
                      >
                        <span className="text-primary font-mono text-xs font-semibold">{qr.shortcut}</span>
                        <span className="text-muted-foreground text-xs truncate w-full">{qr.message_text}</span>
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
              disabled={inputsDisabled}
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl border px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors block focus:border-primary/50",
                isInternal
                  ? "border-amber-555 bg-amber-500/5 focus:border-amber-500/50"
                  : "border-border bg-muted focus:border-primary/50",
                inputsDisabled && "cursor-not-allowed opacity-50"
              )}
            />
          </div>

          <GatedButton
            size="sm"
            canAct={!readOnly}
            gateReason="send messages"
            disabled={!text.trim() || inputsDisabled || sending}
            onClick={handleSend}
            className="h-9 w-9 shrink-0 bg-primary p-0 hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </GatedButton>
        </div>
      )}

      {/* Hint */}
      {!draft && !recording && (
        <p className="mt-1 pl-[9.5rem] text-[10px] text-muted-foreground">
          Type &apos;/&apos; for quick replies or generate Indian UPI QR invoices
        </p>
      )}

      {/* RAZORPAY & BHIM COMPLIANT UPI QR REQUEST MAKER MODAL */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card text-foreground overflow-hidden shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/40">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <QrCode className="h-4 w-4" />
                BHIM UPI Payment Request Link
              </span>
              <button 
                type="button"
                onClick={() => setShowUpiModal(false)} 
                className="text-muted-foreground hover:text-foreground focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground font-bold uppercase">Merchant UPI ID (VPA)</label>
                <input 
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="merchant@upi"
                  className="w-full bg-muted border border-border p-2 text-xs rounded-lg text-foreground font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase">Amount (INR)</label>
                  <input 
                    value={upiAmount}
                    onChange={(e) => setUpiAmount(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    className="w-full bg-muted border border-border p-2 text-xs rounded-lg text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-bold uppercase">Transaction Note</label>
                  <input 
                    value={upiNote}
                    onChange={(e) => setUpiNote(e.target.value)}
                    placeholder="Invoice #..."
                    className="w-full bg-muted border border-border p-2 text-xs rounded-lg text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowUpiModal(false)} 
                  className="flex-1 text-xs h-9"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSendUpiRequest} 
                  disabled={!upiVpa || !upiAmount} 
                  className="flex-1 text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Generate & Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Staged-attachment preview with caption + send/discard.
 */
function MediaDraftPreview({
  draft,
  busy,
  readOnly,
  onCaptionChange,
  onDiscard,
  onSend,
}: {
  draft: MediaDraft;
  busy: boolean;
  readOnly: boolean;
  onCaptionChange: (caption: string) => void;
  onDiscard: () => void;
  onSend: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {draft.kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft.mediaUrl}
              alt={draft.filename}
              className="max-h-40 rounded-lg object-cover"
            />
          )}
          {draft.kind === "video" && (
            <video src={draft.mediaUrl} controls className="max-h-40 rounded-lg" />
          )}
          {draft.kind === "audio" && (
            <audio src={draft.mediaUrl} controls className="w-full" />
          )}
          {draft.kind === "document" && (
            <div className="flex items-center gap-2 text-sm text-foreground">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="truncate">{draft.filename}</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDiscard}
          aria-label="Remove attachment"
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex items-end gap-2">
        {draft.kind !== "audio" && (
          <input
            value={draft.caption}
            maxLength={MEDIA_CAPTION_MAX}
            onChange={(e) => onCaptionChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Add a caption…"
            className="flex-1 rounded-xl border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-primary/50"
          />
        )}
        <GatedButton
          size="sm"
          canAct={!readOnly}
          gateReason="send messages"
          disabled={busy}
          onClick={onSend}
          className={cn(
            "h-9 w-9 shrink-0 bg-primary p-0 hover:bg-primary/90 disabled:opacity-40",
            draft.kind === "audio" && "ml-auto",
          )}
        >
          <Send className="h-4 w-4" />
        </GatedButton>
      </div>
    </div>
  );
}
