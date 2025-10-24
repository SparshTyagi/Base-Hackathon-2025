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
    const { groupId } = req.query;
    
    if (!groupId || typeof groupId !== 'string') {
      return res.status(400).json({ ok: false, error: 'Group ID required' });
    }

    if (req.method === 'GET') {
      // Mock group data
      const mockGroup = {
        id: groupId,
        name: "Test Group",
        creator: "0x1234567890123456789012345678901234567890",
        targetAmount: "1000000000000000000", // 1 ETH in wei
        potBalance: "500000000000000000", // 0.5 ETH in wei
        memberCount: "3",
        isActive: true,
        createdAt: "1703000000",
        expiresAt: "1705592000"
      };
      
      return res.json({ ok: true, group: mockGroup });
    }

    if (req.method === 'POST') {
      const { action, ...params } = req.body;

      // Mock responses for different actions
      const mockResponse = {
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        block: Math.floor(Math.random() * 1000000),
        message: `Action '${action}' completed successfully (mock response)`
      };

      return res.json({ ok: true, ...mockResponse });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Group endpoint error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}