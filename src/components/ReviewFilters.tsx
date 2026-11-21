"use client";

import { Filter } from "lucide-react";

export interface Filters {
  product: string;
  sentiment: string;
  topic: string;
}

interface ReviewFiltersProps {
  filters: Filters;
  products: string[];
  topics: string[];
  onChange: (filters: Filters) => void;
}

const SENTIMENTS = ["all", "positive", "neutral", "negative"];

export default function ReviewFilters({
  filters,
  products,
  topics,
  onChange,
}: ReviewFiltersProps) {
  const selectClasses =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Filter className="h-4 w-4" />
        <span className="font-medium">Filters:</span>
      </div>

      <select
        aria-label="Filter by product"
        value={filters.product}
        onChange={(e) => onChange({ ...filters, product: e.target.value })}
        className={selectClasses}
      >
        <option value="all">All Products</option>
        {products.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by sentiment"
        value={filters.sentiment}
        onChange={(e) => onChange({ ...filters, sentiment: e.target.value })}
        className={selectClasses}
      >
        {SENTIMENTS.map((s) => (
          <option key={s} value={s}>
            {s === "all" ? "All Sentiments" : s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by topic"
        value={filters.topic}
        onChange={(e) => onChange({ ...filters, topic: e.target.value })}
        className={selectClasses}
      >
        <option value="all">All Topics</option>
        {topics.map((t) => (
          <option key={t} value={t}>
            {t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}
          </option>
        ))}
      </select>

      {(filters.product !== "all" ||
        filters.sentiment !== "all" ||
        filters.topic !== "all") && (
        <button
          onClick={() =>
            onChange({ product: "all", sentiment: "all", topic: "all" })
          }
          className="text-xs text-blue-500 hover:text-blue-700 font-medium"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
