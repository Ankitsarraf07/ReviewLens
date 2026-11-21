"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { uploadAndAnalyze, type AnalysisPayload } from "@/lib/client-api";

type UploadStatus = "idle" | "uploading" | "analyzing" | "done" | "error";

interface FileUploadProps {
  onUploadComplete: (result: AnalysisPayload) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setFileName(file.name);
      setError(null);

      try {
        setStatus("uploading");
        const result = await uploadAndAnalyze(file, () => setStatus("analyzing"));
        setStatus("done");
        onUploadComplete(result);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    },
    [onUploadComplete]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) processFile(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const statusContent: Record<UploadStatus, React.ReactNode> = {
    idle: (
      <div className="flex flex-col items-center gap-3">
        <Upload className="h-10 w-10 text-slate-400" />
        <div>
          <p className="text-lg font-semibold text-slate-700">
            Drop your CSV file here
          </p>
          <p className="text-sm text-slate-500 mt-1">
            or click to browse
          </p>
        </div>
      </div>
    ),
    uploading: (
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <div>
          <p className="text-lg font-semibold text-slate-700">Uploading...</p>
          <p className="text-sm text-slate-500 mt-1">
            Parsing and cleaning <span className="font-medium">{fileName}</span>
          </p>
        </div>
      </div>
    ),
    analyzing: (
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 text-purple-500 animate-spin" />
        <div>
          <p className="text-lg font-semibold text-slate-700">
            Analyzing with AI...
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Running sentiment analysis and topic extraction
          </p>
        </div>
      </div>
    ),
    done: (
      <div className="flex flex-col items-center gap-3">
        <CheckCircle className="h-10 w-10 text-emerald-500" />
        <div>
          <p className="text-lg font-semibold text-emerald-700">
            Analysis Complete!
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Upload another file to start over
          </p>
        </div>
      </div>
    ),
    error: (
      <div className="flex flex-col items-center gap-3">
        <AlertCircle className="h-10 w-10 text-rose-500" />
        <div>
          <p className="text-lg font-semibold text-rose-700">Upload Failed</p>
          <p className="text-sm text-rose-500 mt-1">{error}</p>
          <p className="text-xs text-slate-500 mt-2">Click or drop to try again</p>
        </div>
      </div>
    ),
  };

  const isProcessing = status === "uploading" || status === "analyzing";

  return (
    <div
      role="button"
      tabIndex={isProcessing ? -1 : 0}
      aria-label="Upload reviews CSV"
      aria-busy={isProcessing}
      onKeyDown={(e) => { if (!isProcessing && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); fileInputRef.current?.click(); } }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !isProcessing && fileInputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-xl border-2 border-dashed p-12
        transition-all duration-200 text-center
        ${isDragOver
          ? "border-blue-400 bg-blue-50"
          : status === "error"
          ? "border-rose-300 bg-rose-50/50"
          : status === "done"
          ? "border-emerald-300 bg-emerald-50/50"
          : "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50"
        }
        ${isProcessing ? "pointer-events-none" : ""}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        aria-label="Reviews CSV file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {fileName && status !== "idle" && (
        <div className="absolute top-3 left-4 flex items-center gap-1.5 text-xs text-slate-500">
          <FileText className="h-3.5 w-3.5" />
          {fileName}
        </div>
      )}

      {statusContent[status]}
    </div>
  );
}
