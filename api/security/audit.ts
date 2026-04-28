import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Minimal header security audit (no external service dependency)
async function auditHeaders(url: string) {
  try {
    const response = await axios.get(url, { timeout: 10000, headers: {
      'User-Agent': 'WHOAMISec-Audit/8.6'
    }});
    const headers = response.headers;
    return {
      url,
      status: response.status,
      securityHeaders: {
        'x-content-type-options': headers['x-content-type-options'] || 'MISSING',
        'x-frame-options': headers['x-frame-options'] || 'MISSING',
        'x-xss-protection': headers['x-xss-protection'] || 'MISSING',
        'strict-transport-security': headers['strict-transport-security'] || 'MISSING',
        'content-security-policy': headers['content-security-policy'] || 'MISSING',
        'referrer-policy': headers['referrer-policy'] || 'MISSING',
        'permissions-policy': headers['permissions-policy'] || 'MISSING',
      },
      server: headers['server'] || 'unknown',
      poweredBy: headers['x-powered-by'] || null,
      timestamp: new Date().toISOString(),
    };
  } catch (error: any) {
    return { url, error: error.message, status: 'unreachable' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  const report = await auditHeaders(url);
  return res.status(200).json(report);
}
