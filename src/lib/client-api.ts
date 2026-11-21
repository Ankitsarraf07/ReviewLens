import { z } from "zod/v4";
import { AnalysisPayloadSchema, UploadPayloadSchema, ReplyRequestSchema } from "./schema";
export type AnalysisPayload = z.infer<typeof AnalysisPayloadSchema>;

async function readResponse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) throw new Error(typeof body?.error === "string" ? body.error : "The server could not complete this request. Please retry.");
  const checked = schema.safeParse(body.data);
  if (!checked.success) throw new Error("The server returned an unexpected response. Please refresh and retry.");
  return checked.data;
}
export async function analyzeReviews(reviews: unknown[]): Promise<AnalysisPayload> {
  return readResponse(await fetch("/api/analyze", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviews }),
  }), AnalysisPayloadSchema);
}
export async function uploadAndAnalyze(file: File, onAnalyzing: () => void): Promise<AnalysisPayload> {
  if (!file.name.toLowerCase().endsWith(".csv")) throw new Error("Choose a CSV file.");
  if (file.size > 2 * 1024 * 1024) throw new Error("CSV must be smaller than 2 MB.");
  const form = new FormData(); form.append("file", file);
  const uploaded = await readResponse(await fetch("/api/upload", { method: "POST", body: form }), UploadPayloadSchema);
  onAnalyzing();
  const analyzed = await analyzeReviews(uploaded.reviews);
  return { ...analyzed, warnings: [...uploaded.warnings, ...analyzed.warnings] };
}
export async function loadSample(): Promise<AnalysisPayload> {
  return readResponse(await fetch("/api/demo"), AnalysisPayloadSchema);
}
export async function requestReply(input: z.infer<typeof ReplyRequestSchema>, mode: "live" | "demo" = "live"): Promise<string> {
  if (mode === "demo") return "Thank you for sharing your experience. We are sorry for the issue. Please contact the store with your order details so the team can investigate and discuss the available resolution options.";
  const data = await readResponse(await fetch("/api/reply", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  }), z.object({ reply: z.string().trim().min(1) }));
  return data.reply;
}
