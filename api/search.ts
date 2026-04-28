import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: 'Query required' });

  try {
    const resp = await axios.get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WHOAMISec/8.6)' },
      timeout: 8000
    });
    const html = resp.data as string;
    const results: { title: string; link: string }[] = [];
    const re = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
    let match;
    while ((match = re.exec(html)) !== null && results.length < 10) {
      results.push({ title: match[2].trim(), link: match[1].replace(/^\/\/duckduckgo\.com\/l\?uddg=/, '').replace(/&rut=[^&]*/, '') });
    }
    return res.status(200).json({ results });
  } catch (error: any) {
    return res.status(200).json({ results: [], error: error.message });
  }
}
