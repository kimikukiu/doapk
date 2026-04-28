import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory virtual storage (per-instance, resets on cold start)
const storage = new Map<string, string>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const { name, content } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    storage.set(name, content || '');
    return res.status(200).json({ status: 'success' });
  }
  if (req.method === 'GET') {
    return res.status(200).json({ files: Array.from(storage.keys()) });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
