import { GoogleGenerativeAI } from '@google/generative-ai';
const key = process.env.GEMINI_API_KEY?.trim();
if (!key || key === 'your_api_key_here') { console.error('AI check: API key is missing or a placeholder.'); process.exit(1); }
try {
  if (process.argv.includes('--list-models')) {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(30000) });
    const body = await response.json();
    console.log(JSON.stringify({ status: response.status, models: body.models?.filter(m => m.supportedGenerationMethods?.includes('generateContent')).map(m => m.name) || [] }));
    process.exit(response.ok ? 0 : 1);
  }
  const modelIndex = process.argv.indexOf('--model');
  const modelName = modelIndex >= 0 ? process.argv[modelIndex + 1] : process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const model = new GoogleGenerativeAI(key).getGenerativeModel({ model: modelName, generationConfig: { maxOutputTokens: 256 } }, { timeout: 45000 });
  await model.generateContent('Reply with exactly OK.');
  console.log('AI check: model responded successfully.');
} catch (error) {
  const message = String(error?.message || '');
  console.error(JSON.stringify({ check: 'AI connection', status: error.status || null, reason: /API key not valid|API_KEY_INVALID/i.test(message) ? 'API_KEY_INVALID' : /fetch failed|EACCES|ENOTFOUND|ECONNREFUSED/i.test(message) ? 'NETWORK_ERROR' : error.status === 429 ? 'QUOTA_OR_RATE_LIMIT' : error.status === 404 ? 'MODEL_UNAVAILABLE' : 'PROVIDER_REQUEST_FAILED', detail: message.replaceAll(key, '[redacted]').slice(-600) }));
  process.exitCode = 1;
}
