"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { BarChart3, Loader2 } from "lucide-react";
import FileUpload from "./FileUpload";
import SummaryCards from "./SummaryCards";
import TopInsights from "./TopInsights";
import ReviewTable from "./ReviewTable";
import { analyzeReviews, loadSample, type AnalysisPayload } from "@/lib/client-api";
import { AnalysisPayloadSchema } from "@/lib/schema";
import { deriveSummary } from "@/lib/dashboard";

const STORAGE_KEY = "reviewlens-dashboard-v2";
function subscribeToStorage(callback: () => void) { window.addEventListener("storage", callback); return () => window.removeEventListener("storage", callback); }
function storageSnapshot() { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } }
export default function Dashboard({ configured, model, product }: { configured: boolean; model: string; product?: string }) {
  const [activeData, setData] = useState<AnalysisPayload | null | undefined>(undefined);
  const saved = useSyncExternalStore(subscribeToStorage, storageSnapshot, () => null);
  const data = useMemo(() => {
    if (activeData !== undefined) return activeData;
    try { const parsed = AnalysisPayloadSchema.safeParse(JSON.parse(saved || "null")); return parsed.success ? parsed.data : null; } catch { return null; }
  }, [activeData, saved]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const accept = (result: AnalysisPayload) => {
    setData(result); setError(null); setRevision((v) => v + 1);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result)); } catch { /* Non-persistent browsers can still use this dashboard. */ }
  };
  const visible = useMemo(() => data?.analyzed.filter((r) => !product || r.product === product) || [], [data, product]);
  const summary = useMemo(() => deriveSummary(visible), [visible]);
  const products = useMemo(() => [...new Set(data?.analyzed.map((r) => r.product) || [])].sort(), [data]);
  const run = async (sample: boolean) => {
    setBusy(true); setError(null);
    try { accept(sample ? await loadSample() : await analyzeReviews(data!.analyzed)); }
    catch (e) { setError(e instanceof Error ? e.message : "Please try again."); }
    finally { setBusy(false); }
  };
  return <div className="space-y-8">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-600 p-2.5"><BarChart3 className="h-6 w-6 text-white" /></div>
        <div><h1 className="text-2xl font-bold text-slate-900">ReviewLens</h1><p className="text-sm text-slate-600">Turn customer feedback into your next action.</p></div>
      </Link>
      <a href="/reviews.csv" download className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Download assessment CSV</a>
    </header>
    {!product && <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">{configured ? `Live AI configured · ${model}` : "Add GEMINI_API_KEY to .env.local to analyse your own reviews."}</p>
        <button disabled={busy} onClick={() => run(true)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? <Loader2 aria-label="Loading" className="h-4 w-4 animate-spin" /> : "Try sample dashboard"}</button>
      </div>
      <FileUpload onUploadComplete={accept} />
    </>}
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}
    {data?.stats.mode === "demo" && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Sample preview.</strong> Hand-authored sample analyses and reply templates. No AI calls or live cache entries were created. Upload the CSV to run real AI analysis.</div>}
    {product && <div><Link href="/" className="text-sm font-medium text-blue-700 hover:underline">All products</Link><h2 className="mt-3 text-2xl font-bold text-slate-900">{product}</h2></div>}
    {data ? <>
      {data.warnings.length > 0 && <div role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">Processing notes</p><ul className="mt-2 list-inside list-disc">{data.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></div>}
      {summary.failed_count > 0 && data.stats.mode === "live" && <div className="flex flex-wrap items-center gap-3 rounded-xl bg-rose-50 p-4"><p className="text-sm text-rose-800">{summary.failed_count} reviews could not be analysed. Successful results are cached.</p><button disabled={busy} onClick={() => run(false)} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{busy ? "Retrying…" : "Retry failed reviews"}</button></div>}
      <SummaryCards summary={summary} stats={product ? null : data.stats} />
      {!product && <nav aria-label="Product dashboards" className="flex flex-wrap gap-2">{products.map((name) => <Link key={name} href={`/products/${encodeURIComponent(name)}`} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-blue-700 hover:border-blue-400">{name}</Link>)}</nav>}
      {product && visible.length === 0 ? <p className="rounded-xl bg-white p-6 text-slate-600">No reviews for this product. Upload a CSV from the main dashboard.</p> : <><TopInsights reviews={visible} /><ReviewTable key={`${product || "all"}-${revision}`} reviews={visible} mode={data.stats.mode} /></>}
      <button onClick={() => { setData(null); try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage can be disabled. */ } }} className="text-sm text-slate-600 underline">Clear saved dashboard</button>
    </> : <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">{product ? "Upload reviews from the main dashboard to open a product view." : "Upload the assessment CSV to get sentiment, recurring themes and suggested replies, or explore the sample dashboard."}</p>}
  </div>;
}
