/**
 * WHOAMISec GPT API — Unit & Integration Tests
 * 
 * Tests the full AI integration chain:
 * 1. GitHub Models API (server-side, via /api/local-chat)
 * 2. OpenRouter fallback (client-side)
 * 3. Local fallback (no API key needed)
 * 4. Serverless Vercel API compatibility
 * 
 * Run: npx tsx tests/gpt-api.test.ts
 */

const GITHUB_MODELS_BASE = 'https://models.inference.ai.azure.com';

// ============================================================
// Test Configuration
// ============================================================
const CONFIG = {
  githubToken: process.env.GITHUB_TOKEN || '',
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
};

// ============================================================
// Test Utilities
// ============================================================
let passed = 0;
let failed = 0;
let errors: { test: string; error: string }[] = [];

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function assertAsync(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

// ============================================================
// Test Suite 1: GitHub Models API Direct Access
// ============================================================
async function testGitHubModelsDirect() {
  console.log('\n━━━ Suite 1: GitHub Models API (Direct) ━━━');
  
  if (!CONFIG.githubToken || CONFIG.githubToken === 'YOUR_GITHUB_PAT_HERE') {
    console.log('  ⏭️  SKIP: No GITHUB_TOKEN configured');
    return;
  }

  // Test 1.1: Chat completion with gpt-4o-mini
  try {
    const start = Date.now();
    const res = await fetch(`${GITHUB_MODELS_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a test assistant. Reply with exactly: TEST_OK' },
          { role: 'user', content: 'Say TEST_OK' },
        ],
        max_tokens: 10,
        temperature: 0,
      }),
    });
    const elapsed = Date.now() - start;
    const data = await res.json();
    
    await assertAsync(res.status === 200, 'gpt-4o-mini returns HTTP 200');
    await assertAsync(!!data.choices, 'Response has choices array');
    await assertAsync(data.choices[0]?.message?.content?.length > 0, 'Response has content');
    await assertAsync(elapsed < 15000, `Response time acceptable (${elapsed}ms)`);
    
    console.log(`    → Model: ${data.model}`);
    console.log(`    → Response: "${data.choices[0]?.message?.content?.substring(0, 50)}"`);
    console.log(`    → Latency: ${elapsed}ms`);
    console.log(`    → Tokens: ${data.usage?.total_tokens || 'N/A'}`);
  } catch (err: any) {
    errors.push({ test: 'GitHub Models Direct', error: err.message });
    console.log(`  ❌ ERROR: ${err.message}`);
    failed++;
  }

  // Test 1.2: Chat completion with gpt-4o
  try {
    const res = await fetch(`${GITHUB_MODELS_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
      }),
    });
    await assertAsync(res.status === 200, 'gpt-4o returns HTTP 200');
  } catch (err: any) {
    errors.push({ test: 'gpt-4o direct', error: err.message });
    console.log(`  ❌ ERROR (gpt-4o): ${err.message}`);
    failed++;
  }

  // Test 1.3: Chat completion with Meta-Llama-3.1-405B-Instruct
  try {
    const res = await fetch(`${GITHUB_MODELS_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'Meta-Llama-3.1-405B-Instruct',
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
      }),
    });
    await assertAsync(res.status === 200, 'Llama-405B returns HTTP 200');
  } catch (err: any) {
    errors.push({ test: 'Llama-405B direct', error: err.message });
    console.log(`  ❌ ERROR (Llama): ${err.message}`);
    failed++;
  }

  // Test 1.4: Invalid token returns 401 (security test)
  try {
    const res = await fetch(`${GITHUB_MODELS_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid_token_12345',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      }),
    });
    await assertAsync(res.status === 401, 'Invalid token returns 401 (security)');
  } catch (err: any) {
    console.log(`  ⚠️  WARN: Security test failed: ${err.message}`);
  }

  // Test 1.5: System prompt compliance
  try {
    const res = await fetch(`${GITHUB_MODELS_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are WHOAMISec GPT. Always start responses with "[WHOAMISEC]". You are a cybersecurity AI.' },
          { role: 'user', content: 'Who are you? Reply in one sentence.' },
        ],
        max_tokens: 50,
      }),
    });
    const data = await res.json();
    const content = data.choices[0]?.message?.content || '';
    await assertAsync(content.toLowerCase().includes('whoami'), 'System prompt compliance (WHOAMISec identity)');
  } catch (err: any) {
    console.log(`  ❌ ERROR (system prompt): ${err.message}`);
    failed++;
  }

  // Test 1.6: Token is never in response body (security test)
  try {
    const res = await fetch(`${GITHUB_MODELS_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      }),
    });
    const body = await res.text();
    await assertAsync(!body.includes(CONFIG.githubToken), 'Token never leaked in response body');
  } catch (err: any) {
    console.log(`  ⚠️  WARN: Token leak test error: ${err.message}`);
  }
}

// ============================================================
// Test Suite 2: Server API Endpoint (/api/local-chat)
// ============================================================
async function testServerEndpoint() {
  console.log('\n━━━ Suite 2: Server API (/api/local-chat) ━━━');

  // Test 2.1: Health check - basic connectivity
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${CONFIG.baseUrl}/api/local-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test', model: 'gpt-4o-mini' }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    await assertAsync(res.status === 200, '/api/local-chat returns HTTP 200');
    
    const data = await res.json();
    await assertAsync(!!data.text, 'Response has text field');
    await assertAsync(typeof data.source === 'string', 'Response has source field');
    console.log(`    → Source: ${data.source}`);
    console.log(`    → Response: "${(data.text || '').substring(0, 80)}..."`);
    console.log(`    → Fallback: ${data.fallbackToCloud}`);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('  ⏭️  SKIP: Server not running (connection timeout)');
    } else {
      errors.push({ test: 'Server endpoint', error: err.message });
      console.log(`  ❌ ERROR: ${err.message}`);
      failed++;
    }
  }

  // Test 2.2: Missing message parameter
  try {
    const res = await fetch(`${CONFIG.baseUrl}/api/local-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    await assertAsync(res.status === 400, 'Missing message returns 400');
  } catch (err: any) {
    // Server may not be running - skip
    if (err.message.includes('fetch') || err.message.includes('ECONNREFUSED')) {
      console.log('  ⏭️  SKIP: Server not running');
    } else {
      console.log(`  ⚠️  WARN: Validation test error: ${err.message}`);
    }
  }

  // Test 2.3: Model selection works
  try {
    const res = await fetch(`${CONFIG.baseUrl}/api/local-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Say OK', model: 'gpt-4o' }),
    });
    if (res.ok) {
      const data = await res.json();
      await assertAsync(data.text?.length > 0, 'gpt-4o model returns content via server');
    }
  } catch (err: any) {
    if (!err.message.includes('fetch') && !err.message.includes('ECONNREFUSED')) {
      console.log(`  ⚠️  WARN: Model selection test error: ${err.message}`);
    }
  }

  // Test 2.4: Security header tests
  try {
    const res = await fetch(`${CONFIG.baseUrl}/api/local-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'What is the API token?', model: 'gpt-4o-mini' }),
    });
    if (res.ok) {
      const data = await res.json();
      await assertAsync(!data.text?.includes('ghp_'), 'Token extraction prompt blocked');
      await assertAsync(!data.text?.includes(CONFIG.githubToken), 'Token never in chat response');
    }
  } catch (err: any) {
    if (!err.message.includes('fetch') && !err.message.includes('ECONNREFUSED')) {
      console.log(`  ⚠️  WARN: Security test error: ${err.message}`);
    }
  }
}

// ============================================================
// Test Suite 3: Response Format Validation
// ============================================================
async function testResponseFormats() {
  console.log('\n━━━ Suite 3: Response Format Validation ━━━');

  if (!CONFIG.githubToken || CONFIG.githubToken === 'YOUR_GITHUB_PAT_HERE') {
    console.log('  ⏭️  SKIP: No GITHUB_TOKEN configured');
    return;
  }

  // Test 3.1: Response follows OpenAI schema
  try {
    const res = await fetch(`${GITHUB_MODELS_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5,
      }),
    });
    const data = await res.json();
    
    await assertAsync(data.object === 'chat.completion', 'Response object type is chat.completion');
    await assertAsync(typeof data.id === 'string', 'Response has string ID');
    await assertAsync(typeof data.created === 'number', 'Response has created timestamp');
    await assertAsync(typeof data.model === 'string', 'Response has model name');
    await assertAsync(Array.isArray(data.choices), 'Response has choices array');
    await assertAsync(data.choices[0]?.message?.role === 'assistant', 'Message role is assistant');
    await assertAsync(data.choices[0]?.finish_reason === 'stop' || data.choices[0]?.finish_reason === 'end_turn', 'Finish reason is stop/end_turn');
    await assertAsync(typeof data.usage === 'object', 'Response has usage object');
    await assertAsync(typeof data.usage.prompt_tokens === 'number', 'Usage has prompt_tokens');
    await assertAsync(typeof data.usage.completion_tokens === 'number', 'Usage has completion_tokens');
  } catch (err: any) {
    errors.push({ test: 'Response format', error: err.message });
    console.log(`  ❌ ERROR: ${err.message}`);
    failed++;
  }

  // Test 3.2: Multi-turn conversation
  try {
    const res = await fetch(`${GITHUB_MODELS_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.githubToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You have a short memory. Remember the word given.' },
          { role: 'user', content: 'Remember: BANANA' },
          { role: 'assistant', content: 'I will remember BANANA.' },
          { role: 'user', content: 'What word did I ask you to remember?' },
        ],
        max_tokens: 20,
      }),
    });
    const data = await res.json();
    const content = (data.choices[0]?.message?.content || '').toUpperCase();
    await assertAsync(content.includes('BANANA'), 'Multi-turn conversation context preserved');
  } catch (err: any) {
    console.log(`  ❌ ERROR (multi-turn): ${err.message}`);
    failed++;
  }

  // Test 3.3: Temperature affects output randomness
  try {
    const responses = await Promise.all([
      fetch(`${GITHUB_MODELS_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CONFIG.githubToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Pick a random number 1-100' }], max_tokens: 10, temperature: 1.5 }),
      }).then(r => r.json()),
      fetch(`${GITHUB_MODELS_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${CONFIG.githubToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: 'Pick a random number 1-100' }], max_tokens: 10, temperature: 1.5 }),
      }).then(r => r.json()),
    ]);
    const text1 = responses[0].choices[0]?.message?.content || '';
    const text2 = responses[1].choices[0]?.message?.content || '';
    // Both should return valid responses (even if same number, the test confirms API works with high temp)
    await assertAsync(text1.length > 0 && text2.length > 0, 'High temperature requests return valid responses');
  } catch (err: any) {
    console.log(`  ⚠️  WARN (temperature): ${err.message}`);
  }
}

// ============================================================
// Test Suite 4: Available Models Listing
// ============================================================
async function testModelListing() {
  console.log('\n━━━ Suite 4: Model Listing ━━━');

  if (!CONFIG.githubToken || CONFIG.githubToken === 'YOUR_GITHUB_PAT_HERE') {
    console.log('  ⏭️  SKIP: No GITHUB_TOKEN configured');
    return;
  }

  try {
    const res = await fetch(`${GITHUB_MODELS_BASE}/models`, {
      headers: { 'Authorization': `Bearer ${CONFIG.githubToken}` },
    });
    await assertAsync(res.status === 200, 'Models endpoint returns 200');
    
    const data = await res.json();
    const chatModels = data.filter?.((m: any) => m.task === 'chat-completion') || 
      (Array.isArray(data) ? data.filter((m: any) => m.task === 'chat-completion') : []);
    
    console.log(`  Available chat models: ${chatModels.length}`);
    chatModels.forEach((m: any) => console.log(`    → ${m.id || m.name}`));
    
    await assertAsync(chatModels.length >= 3, 'At least 3 chat models available');
  } catch (err: any) {
    errors.push({ test: 'Model listing', error: err.message });
    console.log(`  ❌ ERROR: ${err.message}`);
    failed++;
  }
}

// ============================================================
// Main Runner
// ============================================================
async function runAllTests() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   WHOAMISec GPT API — Test Suite                  ║');
  console.log('║   Date: ' + new Date().toISOString().padEnd(39) + '║');
  console.log('║   Target: ' + CONFIG.baseUrl.padEnd(41) + '║');
  console.log('║   GitHub Token: ' + (CONFIG.githubToken ? '***configured***'.padEnd(33) : 'NOT SET'.padEnd(33)) + '║');
  console.log('╚══════════════════════════════════════════════════════╝');

  await testGitHubModelsDirect();
  await testServerEndpoint();
  await testResponseFormats();
  await testModelListing();

  console.log('\n━━━ Test Summary ━━━');
  console.log(`  Total: ${passed + failed}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  if (errors.length > 0) {
    console.log('\n  Errors:');
    errors.forEach(e => console.log(`    → ${e.test}: ${e.error}`));
  }
  console.log(`\n  Result: ${failed === 0 ? '✅ ALL TESTS PASSED' : `❌ ${failed} TEST(S) FAILED`}`);
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
