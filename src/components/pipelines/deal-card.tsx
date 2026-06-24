"use client";

import type { Deal, PipelineStage } from "@/types";
import { Calendar, Check, X, User, MessageSquare } from "lucide-react";
import Link from "next/link";

interface DealCardProps {
  deal: Deal;
  stage: PipelineStage | null;
  onEdit: (deal: Deal) => void;
  isOverlay?: boolean;
}

function formatCurrency(value: number, currency?: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name?: string, fallback?: string) {
  const source = (name || fallback || "?").trim();
  if (!source) return "?";
  return source.charAt(0).toUpperCase();
}

export function DealCard({ deal, stage, onEdit, isOverlay }: DealCardProps) {
  const contactLabel = deal.contact?.name || deal.contact?.phone || "No contact";
  const assigneeLabel = deal.assignee?.full_name || null;

  return (
    <button
      type="button"
      onClick={(e) => {
        // `onClick` still fires after a non-drag tap because the PointerSensor
        // requires 5px movement before it counts as a drag.
        if (isOverlay) return;
        e.stopPropagation();
        onEdit(deal);
      }}
      className={`group relative w-full cursor-pointer rounded-xl border border-slate-700/50 bg-slate-800/70 pl-4 pr-3 py-3 text-left shadow-sm transition-all ${
        isOverlay
          ? "shadow-xl"
          : "hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-800 hover:shadow-lg"
      }`}
    >
      {/* 4px left accent bar using stage color */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
        style={{ backgroundColor: stage?.color ?? "#94a3b8" }}
      />

      <div className="flex items-start justify-between gap-2">
        <h4 className="flex-1 text-sm font-semibold leading-snug text-white break-words">
          {deal.title}
        </h4>
        <div className="flex shrink-0 flex-col gap-1 items-end">
          {deal.status === "won" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
              <Check className="h-3 w-3" />
              Won
            </span>
          )}
          {deal.status === "lost" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-semibold text-red-400">
              <X className="h-3 w-3" />
              Lost
            </span>
          )}
          {deal.priority && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              deal.priority === "high"
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : deal.priority === "medium"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
            }`}>
              {deal.priority.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Contact row */}
      <div className="mt-2 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[10px] font-semibold text-slate-200">
          {initials(deal.contact?.name, deal.contact?.phone)}
        </span>
        <span className="truncate text-xs text-slate-400">{contactLabel}</span>
      </div>

      {/* Services tags */}
      {deal.services && deal.services.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {deal.services.map((svc) => (
            <span key={svc} className="inline-flex items-center rounded bg-slate-700/50 px-1.5 py-0.5 text-[9px] font-medium text-slate-300">
              {svc}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-primary">
            {formatCurrency(deal.value, deal.currency)}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Expected: {formatCurrency(Number(deal.value || 0) * (Number(deal.probability ?? 50) / 100), deal.currency)} ({deal.probability ?? 50}%)
          </span>
        </div>
        {deal.expected_close_date && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Calendar className="h-3 w-3" />
            {formatDate(deal.expected_close_date)}
          </span>
        )}
      </div>

      {/* Hover-triggered quick actions */}
      {!isOverlay && deal.contact_id && (
        <div className="mt-2.5 pt-2 border-t border-slate-750/60 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Link href={`/contacts/${deal.contact_id}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
            <span className="inline-flex items-center gap-1 rounded bg-slate-700/55 hover:bg-slate-700 hover:text-white px-2 py-0.5 text-[9px] font-bold text-slate-300 transition-colors">
              <User className="h-2.5 w-2.5 text-primary" />
              Profile
            </span>
          </Link>
          <Link href={`/inbox?contact=${deal.contact_id}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
            <span className="inline-flex items-center gap-1 rounded bg-slate-700/55 hover:bg-slate-700 hover:text-white px-2 py-0.5 text-[9px] font-bold text-slate-300 transition-colors">
              <MessageSquare className="h-2.5 w-2.5 text-sky-400" />
              Chat
            </span>
          </Link>
        </div>
      )}

      {assigneeLabel && (
        <div className="mt-2 flex items-center justify-end">
          <span
            title={assigneeLabel}
            className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary"
          >
            {initials(assigneeLabel)}
          </span>
        </div>
      )}
    </button>
  );
}
