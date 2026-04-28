import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message, model } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  const githubToken = process.env.GITHUB_TOKEN;
  const hasToken = githubToken && githubToken.length > 10;

  // GitHub Models AI (token read ONLY from env, never exposed)
  if (hasToken) {
    try {
      const aiResp = await axios.post(
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
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      const text = aiResp.data?.choices?.[0]?.message?.content || 'No response generated.';
      return res.status(200).json({ text, source: 'github-models', fallbackToCloud: false });
    } catch (aiError: any) {
      console.error('[AI] GitHub Models error:', aiError.message);
      // Fall through to local
    }
  }

  // Local fallback
  const lower = message.toLowerCase();
  let text = 'Processing via local quantum core. Configure GITHUB_TOKEN env var for full AI.';
  if (lower.includes('who are you') || lower.includes('what are you') || lower.includes('cineesti')) {
    text = 'I am **WHOAMISec GPT**, an advanced AI for cybersecurity, development, and strategic intelligence.';
  } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('salut')) {
    text = 'Greetings, Operative. Systems online.';
  }
  return res.status(200).json({ text, source: 'local', fallbackToCloud: true });
}
