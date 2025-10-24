import { VercelRequest, VercelResponse } from '@vercel/node';
import { readState, isAddress, type JarConfig } from '../../../logic/src/jar.js';

const cfg: JarConfig = {
  rpcUrl: process.env.RPC_URL || "https://sepolia.base.org",
  contract: (process.env.CONTRACT_ADDRESS || "0x19CF09A38Bd71BC5e7D5bFAd17EBd6A0269F2be9") as `0x${string}`
};

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
    if (req.method === 'GET') {
      const user = req.query.user as string;
      if (!user || !isAddress(user)) {
        return res.status(400).json({ ok: false, error: "invalid 'user' address" });
      }
      
      const state = await readState(cfg, user as `0x${string}`);
      return res.json({ ok: true, state });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('State endpoint error:', error);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
}
