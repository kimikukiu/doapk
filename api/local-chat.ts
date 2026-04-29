import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message, model, apiKey } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  // Accept token from request body (from frontend) or env var
  const token = apiKey || process.env.GITHUB_TOKEN || process.env.OPENAI_API_KEY;
  const hasToken = token && token.length > 10;
  
  // Check if it's OpenAI key (starts with sk-) or GitHub token
  const isOpenAI = token?.startsWith('sk-');

  // GitHub Models AI OR OpenAI
  if (hasToken) {
    try {
      let aiResp;
      if (isOpenAI) {
        // OpenAI API
        aiResp = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are WHOAMISec GPT, an advanced cybersecurity and development AI assistant. Be concise and technical.' },
              { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 2048
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
      } else {
        // GitHub Models
        aiResp = await axios.post(
          'https://models.inference.ai.azure.com/chat/completions',
          {
            model: model || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You are WHOAMISec GPT, an advanced cybersecurity and development AI assistant. Be concise and technical.' },
              { role: 'user', content: message }
            ],
            temperature: 0.7,
            max_tokens: 2048
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );
      }
      const text = aiResp.data?.choices?.[0]?.message?.content || 'No response generated.';
      return res.status(200).json({ text, source: isOpenAI ? 'openai' : 'github-models', fallbackToCloud: false });
    } catch (aiError: any) {
      console.error('[AI] API error:', aiError.message);
      // Fall through to local
    }
  }

  // Local fallback
  const lower = message.toLowerCase();
  let text = 'Processing via local quantum core. Configure GITHUB_TOKEN or OPENAI_API_KEY env var for full AI.';
  if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('cineesti')) {
    text = 'I am **WHOAMISec GPT**, an advanced AI for cybersecurity, development, and strategic intelligence.';
  } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('salut')) {
    text = 'Greetings, Operative. Systems online.';
  }
  return res.status(200).json({ text, source: 'local', fallbackToCloud: true });
}
