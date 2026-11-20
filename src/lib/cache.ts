import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { ReviewAnalysis } from "@/types";
import { validateAnalysis } from "./schema";

// Version the namespace when the prompt/schema changes. Old analyses stay isolated.
export const CACHE_VERSION = "reviewlens-v2";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    const dbPath = process.env.REVIEW_CACHE_PATH || path.join(process.cwd(), "review-cache.db");
    if (dbPath !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("busy_timeout = 5000");

    // Create cache table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS review_cache (
        text_hash TEXT PRIMARY KEY,
        review_text TEXT NOT NULL,
        analysis_json TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  }
  return db;
}

/**
 * Look up a cached analysis by text hash.
 */
export function getCachedAnalysis(textHash: string): ReviewAnalysis | null {
  const database = getDb();
  const row = database
    .prepare("SELECT analysis_json FROM review_cache WHERE text_hash = ?")
    .get(cacheKey(textHash)) as { analysis_json: string } | undefined;

  if (row) {
    try {
      const checked = validateAnalysis(JSON.parse(row.analysis_json));
      return checked.success ? checked.data : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Store an analysis result in the cache.
 */
export function setCachedAnalysis(
  textHash: string,
  reviewText: string,
  analysis: ReviewAnalysis
): void {
  const database = getDb();
  database
    .prepare(
      `INSERT OR REPLACE INTO review_cache (text_hash, review_text, analysis_json)
       VALUES (?, ?, ?)`
    )
    .run(cacheKey(textHash), reviewText, JSON.stringify(analysis));
}

function cacheKey(textHash: string) {
  return `${CACHE_VERSION}:${process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"}:${textHash}`;
}

/**
 * Get cache stats.
 */
export function getCacheStats(): { total_entries: number } {
  const database = getDb();
  const row = database
    .prepare("SELECT COUNT(*) as count FROM review_cache")
    .get() as { count: number };
  return { total_entries: row.count };
}

/**
 * Close the database connection (for cleanup).
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
