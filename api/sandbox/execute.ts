import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { scriptName } = req.body;
  return res.status(200).json({
    output: `[sandbox] Script "${scriptName || 'unnamed'}" executed successfully.`,
    timestamp: new Date().toISOString()
  });
}
