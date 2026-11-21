import { readFile, mkdir, writeFile } from 'node:fs/promises';
const base = process.argv[2] || 'http://127.0.0.1:3100';
async function json(url, init) {
  const response = await fetch(base + url, { ...init, signal: AbortSignal.timeout(300000) });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.error || `Request failed: ${response.status}`);
  return body.data;
}
async function upload() {
  const form = new FormData(); form.append('file', new Blob([await readFile('public/reviews.csv')], { type: 'text/csv' }), 'reviews.csv');
  return json('/api/upload', { method: 'POST', body: form });
}
async function analyze(data) { return json('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ reviews: data.reviews }) }); }
function check(condition, message) { if (!condition) throw new Error(message); }
try {
  const uploaded = await upload();
  check(uploaded.total === 30 && uploaded.empty === 1 && uploaded.duplicates === 1, 'Dataset cleaning counts are incorrect.');
  const first = await analyze(uploaded);
  const successful = first.analyzed.filter(r => r.analysis);
  check(successful.length === 28, `Only ${successful.length}/28 reviews succeeded. ${first.warnings?.join(' ') || ''}`);
  for (const id of ['R003', 'R008', 'R012']) check(first.analyzed.find(r => r.review_id === id)?.analysis?.sentiment === 'negative', `${id} was not classified as negative.`);
  check(first.analyzed.find(r => r.review_id === 'R012')?.analysis?.needs_reply, 'R012 must need a reply.');
  check(successful.every(r => !/[\u0900-\u097F\r\n]/.test(r.analysis.summary)), 'Summaries must be single-line English.');
  const second = await analyze(await upload());
  check(second.stats.ai_calls_made === 0 && second.stats.cache_hits === 28, 'Repeat upload did not use the cache completely.');
  const target = first.analyzed.find(r => r.review_id === 'R007');
  const reply = await json('/api/reply', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ review_text: target.cleaned_text, sentiment: target.analysis.sentiment, summary: target.analysis.summary }) });
  check(typeof reply.reply === 'string' && reply.reply.length > 0, 'Reply generation failed.');
  await mkdir('output', { recursive: true });
  await writeFile('output/live-results.json', JSON.stringify(first, null, 2));
  const verification = { passed: true, unique_reviews_analyzed: successful.length, first_run: first.stats, second_run: second.stats, injection_sarcasm_mismatch: 'passed', reply_generated: true };
  await writeFile('output/live-verification.json', JSON.stringify(verification, null, 2));
  console.log(JSON.stringify(verification, null, 2));
} catch (error) { console.error('Live verification failed: ' + error.message); process.exitCode = 1; }
