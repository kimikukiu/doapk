import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const url = req.query.url as string;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const resp = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WHOAMISec/8.6)' },
      timeout: 10000
    });
    const html = resp.data as string;
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);
    return res.status(200).json({ content: text });
  } catch (error: any) {
    return res.status(500).json({ error: 'Scraping failed: ' + error.message });
  }
}
