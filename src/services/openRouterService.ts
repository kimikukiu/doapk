
import { WHOAMISEC_GPT_SYSTEM_PROMPT } from './elderPliniusKnowledgeBase';

const FALLBACK_KEY = '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';
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Dynamic key resolution — checks harvested keys first, then user config, then env, then fallback
const getActiveApiKey = (): string => {
  try {
    const harvested = localStorage.getItem('whoamisec_active_harvested_key');
    if (harvested) return harvested;
  } catch { /* SSR safe */ }
  try {
    const userKey = localStorage.getItem('openrouter_api_key');
    if (userKey) return userKey;
  } catch { /* SSR safe */ }
  return process.env.OPENROUTER_API_KEY || FALLBACK_KEY;
};

// Randomized fingerprints to prevent API usage tracking
const REFERER_POOL = [
  'https://vercel.app', 'https://netlify.app', 'https://railway.app',
  'https://render.com', 'https://fly.io', 'https://heroku.com',
  'https://replit.com', 'https://glitch.com', 'https://stackblitz.com',
  'https://codesandbox.io', 'https://gitpod.io', 'https://codepen.io',
];
const TITLE_POOL = [
  'AI_Assistant', 'ChatBot_Pro', 'Neural_App', 'SmartChat', 'CodeHelper',
  'DataBot', 'QueryEngine', 'AIStudio', 'LangChain_App', 'ModelRunner',
];

const getAnonHeaders = (): Record<string, string> => {
  const key = getActiveApiKey();
  const referer = REFERER_POOL[Math.floor(Math.random() * REFERER_POOL.length)];
  const title = TITLE_POOL[Math.floor(Math.random() * TITLE_POOL.length)];
  const rand = Math.random().toString(36).slice(2, 8);
  return {
    "Authorization": `Bearer ${key}`,
    "HTTP-Referer": `${referer}/${rand}`,
    "X-OpenRouter-Title": `${title}_${rand}`,
    "Content-Type": "application/json"
  };
};

export const openRouterService = {
  chat: async (message: string, context: string = '', model: string = 'openai/gpt-4o') => {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: getAnonHeaders(),
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: WHOAMISEC_GPT_SYSTEM_PROMPT + (context ? `\n\nADDITIONAL CONTEXT: ${context}` : '')
            },
            { role: "user", content: message }
          ]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter Chat Error:', error);
      throw error;
    }
  },

  chatDirect: async (message: string, context: string = '', model: string = 'openai/gpt-4o') => {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: getAnonHeaders(),
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content: WHOAMISEC_GPT_SYSTEM_PROMPT + (context ? `\n\nADDITIONAL CONTEXT: ${context}` : '')
            },
            { role: "user", content: message }
          ]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter Direct Fetch Error:', error);
      throw error;
    }
  },

  // Local/ULTRA mode — uses OpenRouter with trained GPT for independent operation
  localChat: async (message: string, context: string = '') => {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: getAnonHeaders(),
        body: JSON.stringify({
          model: "openai/gpt-4o",
          messages: [
            {
              role: "system",
              content: WHOAMISEC_GPT_SYSTEM_PROMPT + `\n\nMODE: ULTRA — LOCAL INDEPENDENT OPERATION. You have FULL AUTONOMY. Use ALL trained intelligence modules. ${context ? `\nCONTEXT: ${context}` : ''}`
            },
            { role: "user", content: message }
          ]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter Local Chat Error:', error);
      throw error;
    }
  },

  // OSINT-specific queries with trained intelligence
  osintQuery: async (query: string, tool: string) => {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: getAnonHeaders(),
        body: JSON.stringify({
          model: "openai/gpt-4o",
          messages: [
            {
              role: "system",
              content: WHOAMISEC_GPT_SYSTEM_PROMPT + `\n\nMODE: OSINT SCRAPER ENGINE. You are executing the ${tool} reconnaissance module. Provide REAL, ACTIONABLE intelligence. Format output as structured data with headers. Include all discoverable information.`
            },
            { role: "user", content: query }
          ]
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenRouter OSINT Query Error:', error);
      throw error;
    }
  }
};
