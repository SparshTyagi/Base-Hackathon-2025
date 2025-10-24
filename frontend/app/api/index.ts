import { VercelRequest, VercelResponse } from '@vercel/node';
import { 
  readState, 
  createGroup, 
  joinGroup, 
  leaveGroup,
  depositBondToGroup,
  withdrawBondFromGroup,
  applyPenaltyToGroup,
  withdrawGroupPot,
  distributeGroupPot,
  deactivateGroup,
  getGroup,
  getGroupMember,
  getGroupPotBalance,
  getGroupBond,
  getGroupMembers,
  getUserGroups,
  isGroupMember,
  getGroupMemberCount,
  hasGroupReachedTarget,
  getGroupProgress,
  getAllGroupIds,
  isAddress,
  type JarConfig
} from '../logic/src/jar.js';

// Configuration
const cfg: JarConfig = {
  rpcUrl: process.env.RPC_URL || "https://sepolia.base.org",
  contract: (process.env.CONTRACT_ADDRESS || "0x19CF09A38Bd71BC5e7D5bFAd17EBd6A0269F2be9") as `0x${string}`
};

const DEFAULT_KEY = process.env.DEFAULT_PRIVATE_KEY;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper function to handle CORS
function handleCors(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.status(200).set(corsHeaders).end();
    return true;
  }
  return false;
}

// Health check endpoint
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  
  res.set(corsHeaders);
  
  try {
    const { method, url } = req;
    
    // Route handling
    if (method === 'GET' && url === '/api/health') {
      return res.json({
        ok: true,
        rpcUrl: cfg.rpcUrl,
        contract: cfg.contract,
        timestamp: new Date().toISOString()
      });
    }
    
    // Group endpoints
    if (method === 'POST' && url === '/api/groups') {
      if (!DEFAULT_KEY) {
        return res.status(400).json({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
      }
      
      const { name, targetAmountEth, durationDays } = req.body;
      if (!name || !targetAmountEth || !durationDays) {
        return res.status(400).json({ ok: false, error: "name, targetAmountEth, and durationDays required" });
      }
      
      const result = await createGroup(cfg, DEFAULT_KEY, name, targetAmountEth, durationDays);
      return res.json({ ok: true, ...result });
    }
    
    if (method === 'GET' && url?.startsWith('/api/groups/') && !url.includes('/')) {
      const groupId = url.split('/')[3];
      const group = await getGroup(cfg, groupId);
      return res.json({ ok: true, group });
    }
    
    if (method === 'GET' && url === '/api/groups') {
      const groupIds = await getAllGroupIds(cfg);
      return res.json({ ok: true, groupIds });
    }
    
    // User state endpoint
    if (method === 'GET' && url?.startsWith('/api/state')) {
      const user = req.query.user as string;
      if (!user || !isAddress(user)) {
        return res.status(400).json({ ok: false, error: "invalid 'user' address" });
      }
      const state = await readState(cfg, user as `0x${string}`);
      return res.json({ ok: true, state });
    }
    
    // Default response
    return res.status(404).json({ ok: false, error: "Endpoint not found" });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
