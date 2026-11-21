"use client";

import {
  BarChart3,
  ThumbsUp,
  Minus,
  ThumbsDown,
  MessageCircle,
  Zap,
  Database,
  Clock,
  CheckCircle,
} from "lucide-react";
import type { DashboardSummary, ProcessingStats } from "@/types";

interface SummaryCardsProps {
  summary: DashboardSummary;
  stats: ProcessingStats | null;
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtext,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  subtext?: string;
}) {
  const colorMap: Record<string, { bg: string; icon: string; text: string }> = {
    slate: { bg: "bg-slate-50", icon: "text-slate-500", text: "text-slate-700" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-500", text: "text-emerald-700" },
    amber: { bg: "bg-amber-50", icon: "text-amber-500", text: "text-amber-700" },
    rose: { bg: "bg-rose-50", icon: "text-rose-500", text: "text-rose-700" },
    blue: { bg: "bg-blue-50", icon: "text-blue-500", text: "text-blue-700" },
    purple: { bg: "bg-purple-50", icon: "text-purple-500", text: "text-purple-700" },
  };

  const c = colorMap[color] || colorMap.slate;

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`mt-1.5 text-2xl font-bold ${c.text}`}>{value}</p>
          {subtext && (
            <p className="mt-0.5 text-xs text-slate-400">{subtext}</p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${c.bg}`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({ summary, stats }: SummaryCardsProps) {
  return (
    <div className="space-y-6">
      {/* Sentiment Stats */}
      <div>
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Review Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard
            label="Total Reviews"
            value={summary.total_reviews}
            icon={BarChart3}
            color="slate"
            subtext={`${summary.analyzed_count} analyzed`}
          />
          <StatCard
            label="Positive"
            value={`${summary.positive_pct.toFixed(1)}%`}
            icon={ThumbsUp}
            color="emerald"
          />
          <StatCard
            label="Neutral"
            value={`${summary.neutral_pct.toFixed(1)}%`}
            icon={Minus}
            color="amber"
          />
          <StatCard
            label="Negative"
            value={`${summary.negative_pct.toFixed(1)}%`}
            icon={ThumbsDown}
            color="rose"
          />
          <StatCard
            label="Needs Reply"
            value={summary.needs_reply_count}
            icon={MessageCircle}
            color="blue"
          />
          <StatCard
            label="Rating Agreement"
            value={summary.rating_agreement_pct === null ? "N/A" : `${summary.rating_agreement_pct.toFixed(1)}%`}
            icon={CheckCircle}
            color="purple"
            subtext="Rating matches sentiment"
          />
        </div>
      </div>

      <p className="text-sm text-slate-600" role="status">{summary.skipped_count} skipped (empty or duplicate) · {summary.failed_count} failed · Percentages use successfully analysed reviews.</p>

      {/* Processing Stats */}
      {stats && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Processing Stats
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="AI Calls Made"
              value={stats.ai_calls_made}
              icon={Zap}
              color="purple"
            />
            <StatCard
              label="Cache Hits"
              value={stats.cache_hits}
              icon={Database}
              color="emerald"
            />
            <StatCard
              label="Processing Time"
              value={`${(stats.processing_time_ms / 1000).toFixed(1)}s`}
              icon={Clock}
              color="blue"
            />
            <StatCard
              label="Batches"
              value={stats.batches_processed}
              icon={BarChart3}
              color="slate"
            />
          </div>
        </div>
      )}
    </div>
  );
}
