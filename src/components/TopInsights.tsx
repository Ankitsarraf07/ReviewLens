"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { AnalyzedReview } from "@/types";
import { deriveInsights } from "@/lib/dashboard";

interface TopInsightsProps {
  reviews: AnalyzedReview[];
}

interface InsightItem {
  text: string;
  count: number;
  products: string[];
}

function InsightCard({
  title,
  items,
  icon: Icon,
  emptyText,
  accentColor,
}: {
  title: string;
  items: InsightItem[];
  icon: React.ElementType;
  emptyText: string;
  accentColor: "rose" | "emerald";
}) {
  const colors = {
    rose: {
      headerBg: "bg-rose-50",
      headerText: "text-rose-700",
      icon: "text-rose-500",
      badge: "bg-rose-100 text-rose-700",
      border: "border-rose-200",
    },
    emerald: {
      headerBg: "bg-emerald-50",
      headerText: "text-emerald-700",
      icon: "text-emerald-500",
      badge: "bg-emerald-100 text-emerald-700",
      border: "border-emerald-200",
    },
  };

  const c = colors[accentColor];

  return (
    <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden">
      <div className={`px-5 py-3 ${c.headerBg} border-b ${c.border} flex items-center gap-2`}>
        <Icon className={`h-4.5 w-4.5 ${c.icon}`} />
        <h3 className={`font-semibold ${c.headerText}`}>{title}</h3>
      </div>
      <div className="p-5">
        {items.length === 0 ? (
          <p className="text-sm text-slate-400 italic">{emptyText}</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${c.badge}`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 capitalize leading-snug">
                    {item.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">
                      {item.count} review{item.count !== 1 ? "s" : ""}
                    </span>
                    <span className="text-xs text-slate-300">·</span>
                    <span className="text-xs text-slate-400 truncate">
                      {item.products.join(", ")}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function TopInsights({ reviews }: TopInsightsProps) {
  const complaints = deriveInsights(reviews, "negative");
  const praises = deriveInsights(reviews, "positive");

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
        Top Insights
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        <InsightCard
          title="Top Complaints"
          items={complaints}
          icon={ThumbsDown}
          emptyText="No negative reviews found"
          accentColor="rose"
        />
        <InsightCard
          title="Top Praises"
          items={praises}
          icon={ThumbsUp}
          emptyText="No positive reviews found"
          accentColor="emerald"
        />
      </div>
    </div>
  );
}
