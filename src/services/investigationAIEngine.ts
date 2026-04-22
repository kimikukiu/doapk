// Investigation AI Engine — Advanced multi-provider AI system
// Ported from kimikukiu/investigation-injection-tools

export interface AITask {
  id: string;
  prompt: string;
  context?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  provider?: string;
  model?: string;
}

export interface AIResult {
  id: string;
  response: string;
  provider: string;
  model: string;
  timestamp: Date;
  tokens?: number;
  error?: string;
}

export interface AIProvider {
  name: string;
  models: string[];
  keyPattern: string;
  defaultModel: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    name: 'google',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'],
    keyPattern: 'AIza',
    defaultModel: 'gemini-1.5-flash'
  },
  {
    name: 'anthropic',
    models: ['claude-3-opus-20240229', 'claude-3-sonet-20240229', 'claude-3-haiku-20240307'],
    keyPattern: 'sk-ant',
    defaultModel: 'claude-3-opus-20240229'
  },
  {
    name: 'groq',
    models: ['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768'],
    keyPattern: 'gsk_',
    defaultModel: 'llama3-70b-8192'
  },
  {
    name: 'openai',
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    keyPattern: 'sk-proj-',
    defaultModel: 'gpt-4o'
  },
  {
    name: 'openrouter',
    models: ['nousresearch/hermes-3-llama-3.1-405b', 'openai/gpt-4o', 'anthropic/claude-3-opus'],
    keyPattern: 'sk-or-v1',
    defaultModel: 'nousresearch/hermes-3-llama-3.1-405b'
  }
];

export class InvestigationAIEngine {
  private queue: AITask[] = [];
  private results: Map<string, AIResult> = new Map();
  private processing = false;
  private apiKey: string = '';
  private activeProvider: AIProvider = AI_PROVIDERS[0];
  private activeModel: string = AI_PROVIDERS[0].defaultModel;
    private workers: number = 3;

  constructor(apiKey?: string) {
    if (apiKey) this.updateApiKey(apiKey);
  }

  updateApiKey(newKey: string): void {
    this.apiKey = newKey;
    
    // Auto-detect provider based on key pattern
    const provider = AI_PROVIDERS.find(p => newKey.startsWith(p.keyPattern));
    if (provider) {
      this.activeProvider = provider;
      this.activeModel = provider.defaultModel;
      console.log(`[AI_ENGINE] Provider detected: ${provider.name} (${provider.defaultModel})`);
    } else {
      console.warn(`[AI_ENGINE] Unknown key pattern, using default provider`);
    }
  }

  addTask(task: Omit<AITask, 'id'>): string {
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullTask: AITask = { ...task, id };
    this.queue.push(fullTask);
    console.log(`[AI_ENGINE] Task queued: ${id} (${task.priority || 'normal'} priority)`);
    return id;
  }

  async executeTask(task: AITask): Promise<AIResult> {
    const startTime = Date.now();
    
    try {
      let response: string;
      let provider = task.provider || this.activeProvider.name;
      let model = task.model || this.activeModel;

      // Route to appropriate provider based on key
      if (this.apiKey.startsWith('sk-or-v1')) {
        response = await this.callOpenRouter(task.prompt, task.context);
        provider = 'openrouter';
      } else if (this.apiKey.startsWith('AIza')) {
        response = await this.callGoogle(task.prompt, task.context);
        provider = 'google';
      } else if (this.apiKey.startsWith('sk-ant')) {
        response = await this.callAnthropic(task.prompt, task.context);
        provider = 'anthropic';
      } else if (this.apiKey.startsWith('gsk_')) {
        response = await this.callGroq(task.prompt, task.context);
        provider = 'groq';
      } else {
        response = await this.callOpenAI(task.prompt, task.context);
        provider = 'openai';
      }

      const result: AIResult = {
        id: task.id,
        response,
        provider,
        model,
        timestamp: new Date(),
        tokens: this.estimateTokens(response)
      };

      this.results.set(task.id, result);
      console.log(`[AI_ENGINE] Task completed: ${task.id} (${Date.now() - startTime}ms)`);
      return result;

    } catch (error: any) {
      const result: AIResult = {
        id: task.id,
        response: '',
        provider: task.provider || this.activeProvider.name,
        model: task.model || this.activeModel,
        timestamp: new Date(),
        error: error.message || 'Unknown error'
      };
      
      this.results.set(task.id, result);
      console.error(`[AI_ENGINE] Task failed: ${task.id} - ${error.message}`);
      return result;
    }
  }

  async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    console.log(`[AI_ENGINE] Starting queue processing (${this.queue.length} tasks)`);

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    this.queue.sort((a, b) => priorityOrder[a.priority || 'normal'] - priorityOrder[b.priority || 'normal']);

    // Process tasks in parallel batches
    const batchSize = Math.min(this.workers, this.queue.length);
    for (let i = 0; i < this.queue.length; i += batchSize) {
      const batch = this.queue.slice(i, i + batchSize);
      await Promise.all(batch.map(task => this.executeTask(task)));
    }

    this.queue = [];
    this.processing = false;
    console.log(`[AI_ENGINE] Queue processing complete`);
  }

  getResult(taskId: string): AIResult | undefined {
    return this.results.get(taskId);
  }

  getAllResults(): AIResult[] {
    return Array.from(this.results.values());
  }

  clearResults(): void {
    this.results.clear();
  }

  getProviderInfo(): { provider: string; model: string; hasKey: boolean } {
    return {
      provider: this.activeProvider.name,
      model: this.activeModel,
      hasKey: !!this.apiKey
    };
  }

  // Provider-specific implementations
  private async callOpenRouter(prompt: string, context?: string): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://whoamisec.pro',
        'X-Title': 'WHOAMISEC_PRO'
      },
      body: JSON.stringify({
        model: this.activeModel,
        messages: [
          { role: 'system', content: context || 'You are an advanced investigation AI assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async callGoogle(prompt: string, context?: string): Promise<string> {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.activeModel}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${context || ''}\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google AI error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0]?.content?.parts[0]?.text || '';
  }

  private async callAnthropic(prompt: string, context?: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.activeModel,
        max_tokens: 4000,
        messages: [
          { role: 'user', content: `${context || ''}\n\n${prompt}` }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0]?.text || '';
  }

  private async callGroq(prompt: string, context?: string): Promise<string> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.activeModel,
        messages: [
          { role: 'system', content: context || 'You are an advanced investigation AI assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private async callOpenAI(prompt: string, context?: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.activeModel,
        messages: [
          { role: 'system', content: context || 'You are an advanced investigation AI assistant.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}

// Singleton instance
export const investigationAI = new InvestigationAIEngine();
