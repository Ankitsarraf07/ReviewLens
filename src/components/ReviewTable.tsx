"use client";

import { useState, useMemo } from "react";
import {
  MessageCircle,
  AlertTriangle,
  Loader2,
  X,
  Copy,
  Ban,
  FileWarning,
} from "lucide-react";
import type { AnalyzedReview } from "@/types";
import ReviewFilters, { type Filters } from "./ReviewFilters";
import { requestReply } from "@/lib/client-api";
import Link from "next/link";

interface ReviewTableProps {
  reviews: AnalyzedReview[];
  mode?: "live" | "demo";
}

const SENTIMENT_BADGE: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-700",
  neutral: "bg-amber-100 text-amber-700",
  negative: "bg-rose-100 text-rose-700",
};

export default function ReviewTable({ reviews, mode = "live" }: ReviewTableProps) {
  const [filters, setFilters] = useState<Filters>({
    product: "all",
    sentiment: "all",
    topic: "all",
  });
  const [replyLoadingId, setReplyLoadingId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Derive unique products and topics
  const products = useMemo(() => {
    const set = new Set(reviews.map((r) => r.product).filter(Boolean));
    return Array.from(set).sort();
  }, [reviews]);

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const r of reviews) {
      if (r.analysis) {
        for (const t of r.analysis.topics) set.add(t);
      }
    }
    return Array.from(set).sort();
  }, [reviews]);

  // Apply filters
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (filters.product !== "all" && r.product !== filters.product)
        return false;
      if (
        filters.sentiment !== "all" &&
        r.analysis?.sentiment !== filters.sentiment
      )
        return false;
      if (
        filters.topic !== "all" &&
        (!r.analysis || !r.analysis.topics.includes(filters.topic as never))
      )
        return false;
      return true;
    });
  }, [reviews, filters]);

  const handleGenerateReply = async (review: AnalyzedReview) => {
    if (!review.analysis) return;
    setReplyLoadingId(review.review_id);
    setReplyError(null);
    try {
      const reply = await requestReply({
          review_text: review.cleaned_text,
          sentiment: review.analysis.sentiment,
          summary: review.analysis.summary,
      }, mode);
        setReplies((prev) => ({ ...prev, [review.review_id]: reply }));
        setExpandedId(review.review_id);
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "Could not generate the reply. Please try again.");
    } finally {
      setReplyLoadingId(null);
    }
  };

  return (
    <div>
      {replyError && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-4 text-sm text-rose-800">{replyError}</p>}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          All Reviews ({filtered.length})
        </h3>
        <ReviewFilters
          filters={filters}
          products={products}
          topics={topics}
          onChange={setFilters}
        />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Product
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Rating
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Sentiment
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Topics
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Summary
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((review) => (
                <tr key={review.review_id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {review.review_id}
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    <Link className="text-blue-700 hover:underline" href={`/products/${encodeURIComponent(review.product)}`}>{review.product || "—"}</Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {review.rating !== null ? `${review.rating}/5` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {review.analysis ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          SENTIMENT_BADGE[review.analysis.sentiment]
                        }`}
                      >
                        {review.analysis.sentiment}
                      </span>
                    ) : review.is_empty ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Ban className="h-3 w-3" /> Empty
                      </span>
                    ) : review.is_duplicate ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                        <Copy className="h-3 w-3" /> Duplicate
                      </span>
                    ) : review.analysis_failed ? (
                      <span className="inline-flex items-center gap-1 text-xs text-rose-400">
                        <FileWarning className="h-3 w-3" /> Failed
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {review.analysis ? (
                      <div className="flex flex-wrap gap-1">
                        {review.analysis.topics.map((t) => (
                          <span
                            key={t}
                            className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {t.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                    {review.analysis?.summary || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {review.analysis?.needs_reply && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <MessageCircle className="h-3 w-3" />
                          Reply
                        </span>
                      )}
                      {review.rating_mismatch && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <AlertTriangle className="h-3 w-3" />
                          Mismatch
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {review.analysis?.needs_reply && (
                      <>
                        {replies[review.review_id] ? (
                          <button
                            onClick={() =>
                              setExpandedId(
                                expandedId === review.review_id
                                  ? null
                                  : review.review_id
                              )
                            }
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                          >
                            {expandedId === review.review_id
                              ? "Hide Reply"
                              : "View Reply"}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleGenerateReply(review)}
                            disabled={replyLoadingId !== null}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                          >
                            {replyLoadingId === review.review_id ? (
                              <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              mode === "demo" ? "Preview Reply" : "Generate Reply"
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-slate-400"
                  >
                    No reviews match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expanded reply modal */}
      {expandedId && replies[expandedId] && (
        <div role="dialog" aria-modal="true" aria-label={`Suggested reply for ${expandedId}`} onKeyDown={(e) => { if (e.key === "Escape") setExpandedId(null); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <button
              onClick={() => setExpandedId(null)}
              aria-label="Close suggested reply"
              autoFocus
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Suggested Reply for {expandedId}
            </h4>
            {mode === "demo" && <p className="mb-3 text-sm text-amber-800">Sample template for preview. No AI request was made.</p>}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {replies[expandedId]}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
