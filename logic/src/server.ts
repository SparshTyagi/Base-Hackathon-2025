import Fastify from "fastify";
import dotenv from "dotenv";
import {
  readState,
  depositBond,
  withdrawBond,
  buildWithdrawPotCalldata,
  isAddress,
  type JarConfig
} from "./jar.js";
import { SwearJarDatabase } from "./database-simple.js";
import { 
  GroupService, 
  CreateGroupRequest, 
  AddMemberRequest, 
  CreateRuleRequest, 
  ReportViolationRequest 
} from "./groupService.js";
import { NotificationService } from "./notificationService.js";
import { ConsensusService } from "./consensusService.js";

dotenv.config();

const app = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || "8080", 10);

const cfg: JarConfig = {
  rpcUrl: process.env.RPC_URL || "https://sepolia.base.org",
  contract: (process.env.CONTRACT_ADDRESS || "0x73183E071A52C76921CcAfB037400BeC1f635E4B") as `0x${string}`
};

const DEFAULT_KEY = process.env.DEFAULT_PRIVATE_KEY; // optional: used by /deposit and /withdraw if present

// Initialize database and services
const db = new SwearJarDatabase(process.env.DATABASE_PATH || './swearjar.db');
const groupService = new GroupService(db, cfg);
const notificationService = new NotificationService();
const consensusService = new ConsensusService(db, groupService, notificationService, cfg);

// Register plugins
app.register(import('@fastify/cors'), {
  origin: true
});

app.register(import('@fastify/websocket'));

// WebSocket endpoint for real-time notifications
app.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    notificationService.addClient(clientId, connection.socket);

    connection.socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe' && data.groupId) {
          notificationService.subscribeToGroup(clientId, data.groupId);
          connection.socket.send(JSON.stringify({
            type: 'subscribed',
            groupId: data.groupId,
            clientId
          }));
        } else if (data.type === 'unsubscribe' && data.groupId) {
          notificationService.unsubscribeFromGroup(clientId, data.groupId);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
  });
});

app.get("/health", async () => ({
  ok: true,
  rpcUrl: cfg.rpcUrl,
  contract: cfg.contract,
  connectedClients: notificationService.getConnectedClients()
}));

app.get("/state", async (req, res) => {
  const user = (req.query as any).user as string;
  if (!user || !isAddress(user)) return res.status(400).send({ ok: false, error: "invalid 'user' address" });
  const state = await readState(cfg, user as `0x${string}`);
  return { ok: true, state };
});

app.post("/deposit", async (req, res) => {
  if (!DEFAULT_KEY) return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
  const { amountEth } = req.body as any;
  if (!amountEth) return res.status(400).send({ ok: false, error: "amountEth required" });
  const rcpt = await depositBond(cfg, DEFAULT_KEY, String(amountEth));
  return { ok: true, tx: rcpt };
});

app.post("/withdraw", async (req, res) => {
  if (!DEFAULT_KEY) return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
  const { amountEth } = req.body as any;
  if (!amountEth) return res.status(400).send({ ok: false, error: "amountEth required" });
  const rcpt = await withdrawBond(cfg, DEFAULT_KEY, String(amountEth));
  return { ok: true, tx: rcpt };
});

app.post("/build-withdraw", async (req, res) => {
  const { to, amountEth } = req.body as any;
  if (!to || !isAddress(String(to))) return res.status(400).send({ ok: false, error: "invalid 'to' address" });
  if (!amountEth) return res.status(400).send({ ok: false, error: "amountEth required" });
  const call = buildWithdrawPotCalldata(cfg, to as `0x${string}`, String(amountEth));
  return { ok: true, call };
});

// Group Management Endpoints
app.post("/groups", async (req, res) => {
  try {
    const request = CreateGroupRequest.parse(req.body);
    const group = await groupService.createGroup(request);
    return { ok: true, group };
  } catch (error) {
    return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/groups/:id", async (req, res) => {
  const { id } = req.params as any;
  try {
    const dashboard = await groupService.getGroupDashboard(id);
    return { ok: true, dashboard };
  } catch (error) {
    return res.status(404).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/groups/:id/members", async (req, res) => {
  const { id } = req.params as any;
  try {
    const request = { ...AddMemberRequest.parse(req.body), groupId: id };
    const member = await groupService.addMember(request);
    return { ok: true, member };
  } catch (error) {
    return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/groups/:id/rules", async (req, res) => {
  const { id } = req.params as any;
  try {
    const request = { ...CreateRuleRequest.parse(req.body), groupId: id };
    const rule = await groupService.createRule(request);
    return { ok: true, rule };
  } catch (error) {
    return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// AI Agent Integration Endpoints
app.post("/violations", async (req, res) => {
  try {
    const request = ReportViolationRequest.parse(req.body);
    const violation = await groupService.reportViolation(request);
    
    // Send real-time notification
    notificationService.notifyViolation(violation);
    
    return { ok: true, violation };
  } catch (error) {
    return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/violations/:id/apply-penalty", async (req, res) => {
  const { id } = req.params as any;
  const { privateKey } = req.body as any;
  
  if (!privateKey) return res.status(400).send({ ok: false, error: "privateKey required" });
  
  try {
    const result = await groupService.applyPenalty(id, privateKey);
    
    // Get violation details for notification
    const violation = db.getViolationById(id);
    if (violation) {
      notificationService.notifyPenaltyApplied(violation);
    }
    
    return { ok: true, tx: result };
  } catch (error) {
    return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// User Dashboard
app.get("/users/:address/dashboard", async (req, res) => {
  const { address } = req.params as any;
  if (!isAddress(address)) return res.status(400).send({ ok: false, error: "invalid address" });
  
  try {
    const dashboard = await groupService.getUserDashboard(address);
    return { ok: true, dashboard };
  } catch (error) {
    return res.status(500).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// Voting System
app.post("/groups/:id/votes", async (req, res) => {
  const { id } = req.params as any;
  const { proposalType, proposalData, proposerAddress, expiresInHours } = req.body as any;
  
  if (!proposalType || !proposalData || !proposerAddress) {
    return res.status(400).send({ ok: false, error: "proposalType, proposalData, and proposerAddress required" });
  }
  
  if (!isAddress(proposerAddress)) {
    return res.status(400).send({ ok: false, error: "invalid proposerAddress" });
  }
  
  try {
    const vote = await groupService.createVote(id, proposalType, proposalData, proposerAddress, expiresInHours);
    return { ok: true, vote };
  } catch (error) {
    return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/votes/:id/submit", async (req, res) => {
  const { id } = req.params as any;
  const { voterAddress, response } = req.body as any;
  
  if (!voterAddress || !response || !['yes', 'no'].includes(response)) {
    return res.status(400).send({ ok: false, error: "voterAddress and response (yes/no) required" });
  }
  
  if (!isAddress(voterAddress)) {
    return res.status(400).send({ ok: false, error: "invalid voterAddress" });
  }
  
  try {
    const voteResponse = await groupService.submitVote(id, voterAddress, response);
    
    // Process vote results after submission
    const voteResult = await consensusService.processVoteResults(id);
    notificationService.notifyVoteResult(voteResponse.voteId, voteResult);
    
    return { ok: true, voteResponse, voteResult };
  } catch (error) {
    return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// Enhanced voting endpoints
app.get("/votes/:id/status", async (req, res) => {
  const { id } = req.params as any;
  
  try {
    const voteResult = await consensusService.getVoteStatus(id);
    return { ok: true, voteResult };
  } catch (error) {
    return res.status(404).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.get("/groups/:id/votes", async (req, res) => {
  const { id } = req.params as any;
  
  try {
    const votes = await consensusService.getGroupVotes(id);
    return { ok: true, votes };
  } catch (error) {
    return res.status(404).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/groups/:id/votes/pot-distribution", async (req, res) => {
  const { id } = req.params as any;
  const { recipient, amount, reason, proposerAddress, expiresInHours } = req.body as any;
  
  if (!recipient || !amount || !proposerAddress) {
    return res.status(400).send({ ok: false, error: "recipient, amount, and proposerAddress required" });
  }
  
  if (!isAddress(recipient) || !isAddress(proposerAddress)) {
    return res.status(400).send({ ok: false, error: "invalid addresses" });
  }
  
  try {
    const proposalData = { recipient, amount, reason: reason || 'Pot distribution' };
    const vote = await groupService.createVote(id, 'pot_distribution', proposalData, proposerAddress, expiresInHours);
    notificationService.notifyVoteCreated(vote);
    
    return { ok: true, vote };
  } catch (error) {
    return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/groups/:id/votes/build-execution", async (req, res) => {
  const { id } = req.params as any;
  const { recipient, amount } = req.body as any;
  
  if (!recipient || !amount) {
    return res.status(400).send({ ok: false, error: "recipient and amount required" });
  }
  
  if (!isAddress(recipient)) {
    return res.status(400).send({ ok: false, error: "invalid recipient address" });
  }
  
  try {
    const calldata = consensusService.buildPotDistributionCalldata(id, { recipient, amount, reason: '' });
    return { ok: true, calldata };
  } catch (error) {
    return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});

// Background task for checking expired votes
setInterval(async () => {
  try {
    await consensusService.checkExpiredVotes();
  } catch (error) {
    console.error('Error checking expired votes:', error);
  }
}, 60000); // Check every minute

app.listen({ port: PORT, host: "0.0.0.0" }).catch((e) => {
  console.error(e);
  process.exit(1);
});
