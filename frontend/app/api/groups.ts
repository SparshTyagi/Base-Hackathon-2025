import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const { name, targetAmountEth, durationDays } = req.body;
      
      if (!name || !targetAmountEth || !durationDays) {
        return res.status(400).json({ ok: false, error: "name, targetAmountEth, and durationDays required" });
      }

      // For now, return a mock response
      // In production, you would call the smart contract here
      const mockGroupId = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      return res.json({ 
        ok: true, 
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        block: Math.floor(Math.random() * 1000000),
        groupId: mockGroupId,
        message: "Group created successfully (mock response)"
      });
    }

    if (req.method === 'GET') {
      return res.json({ 
        ok: true, 
        groups: [],
        message: "Groups endpoint ready (mock response)"
      });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Groups endpoint error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}