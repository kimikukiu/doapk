/**
 * WHOAMISec GitHub Models Service
 * 
 * Uses GitHub's FREE Models API (models.inference.ai.azure.com)
 * Compatible with OpenAI chat completions format.
 * 
 * SECURITY: The GitHub token is read ONLY from environment variables.
 * It is NEVER sent to the client, never logged, and never exposed in responses.
 * The .env file containing the token is in .gitignore.
 */

const GITHUB_MODELS_BASE = 'https://models.inference.ai.azure.com';

// Available free models on GitHub
export const GITHUB_MODELS = {
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4o': 'gpt-4o',
  'Meta-Llama-3.1-70B-Instruct': 'Meta-Llama-3.1-70B-Instruct',
  'Meta-Llama-3.1-8B-Instruct': 'Meta-Llama-3.1-8B-Instruct',
  'Mistral-large-2407': 'Mistral-large-2407',
  'Phi-3-medium-128k-instruct': 'Phi-3-medium-128k-instruct',
} as const;

export type GitHubModel = keyof typeof GITHUB_MODELS;

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token || token.length < 10) {
    throw new Error('GITHUB_TOKEN not configured in environment. Set it in .env file.');
  }
  return token;
}

/**
 * Chat completion via GitHub Models API (OpenAI-compatible)
 * Token is ONLY used server-side in the Authorization header.
 */
export async function githubChat(
  message: string,
  options?: {
    systemPrompt?: string;
    model?: GitHubModel | string;
    temperature?: number;
    maxTokens?: number;
    conversationHistory?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  }
): Promise<string> {
  const token = getToken();
  const model = options?.model || 'gpt-4o-mini';
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 4000;

  const systemPrompt = options?.systemPrompt || 
    `You are WHOAMISEC GPT, an advanced AI assistant for cybersecurity, OSINT analysis, 
software development, and strategic intelligence. You are operating within the WHOAMISEC 
Quantum Intelligence Platform. Provide detailed, technical, and actionable responses. 
You have access to real-time intelligence tools and security analysis capabilities.`;

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  // Add conversation history if provided
  if (options?.conversationHistory) {
    for (const msg of options.conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add current user message
  messages.push({ role: 'user', content: message });

  const response = await fetch(`${GITHUB_MODELS_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    // NEVER log the token in error messages
    console.error(`[GitHub Models] API error ${response.status}: ${errorBody.substring(0, 200)}`);
    throw new Error(`GitHub Models API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('Empty response from GitHub Models');
  }

  return content;
}

/**
 * List available models (for admin/debug purposes)
 * Does NOT expose the token in the response.
 */
export async function listModels(): Promise<string[]> {
  const token = getToken();
  
  const response = await fetch(`${GITHUB_MODELS_BASE}/models`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return Object.values(GITHUB_MODELS);
  }

  const data = await response.json();
  return (data.data || []).map((m: any) => m.id);
}

export default { githubChat, listModels, GITHUB_MODELS };
