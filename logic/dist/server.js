import Fastify from "fastify";
import dotenv from "dotenv";
import { readState, depositBond, withdrawBond, buildWithdrawPotCalldata, isAddress, 
// Group-specific functions
createGroup, joinGroup, leaveGroup, depositBondToGroup, withdrawBondFromGroup, applyPenaltyToGroup, withdrawGroupPot, distributeGroupPot, deactivateGroup, getGroup, getGroupMember, getGroupPotBalance, getGroupBond, getGroupMembers, getUserGroups, isGroupMember, getGroupMemberCount, hasGroupReachedTarget, getGroupProgress, getAllGroupIds } from "./jar.js";
import { SwearJarDatabase } from "./database-simple.js";
import { GroupService, CreateGroupRequest, AddMemberRequest, CreateRuleRequest, ReportViolationRequest } from "./groupService.js";
import { NotificationService } from "./notificationService.js";
import { ConsensusService } from "./consensusService.js";
dotenv.config();
const app = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || "8080", 10);
const cfg = {
    rpcUrl: process.env.RPC_URL || "https://sepolia.base.org",
    contract: (process.env.CONTRACT_ADDRESS || "0x19CF09A38Bd71BC5e7D5bFAd17EBd6A0269F2be9")
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
                }
                else if (data.type === 'unsubscribe' && data.groupId) {
                    notificationService.unsubscribeFromGroup(clientId, data.groupId);
                }
            }
            catch (error) {
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
// ============ GROUP-SPECIFIC API ENDPOINTS ============
// Create a new group
app.post("/api/groups", async (req, res) => {
    if (!DEFAULT_KEY)
        return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
    const { name, targetAmountEth, durationDays } = req.body;
    if (!name || !targetAmountEth || !durationDays) {
        return res.status(400).send({ ok: false, error: "name, targetAmountEth, and durationDays required" });
    }
    try {
        const result = await createGroup(cfg, DEFAULT_KEY, name, targetAmountEth, durationDays);
        return { ok: true, ...result };
    }
    catch (error) {
        console.error("Error creating group:", error);
        return res.status(500).send({ ok: false, error: "Failed to create group" });
    }
});
// Join a group
app.post("/api/groups/:groupId/join", async (req, res) => {
    if (!DEFAULT_KEY)
        return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
    const { groupId } = req.params;
    const { bondAmountEth } = req.body;
    if (!bondAmountEth) {
        return res.status(400).send({ ok: false, error: "bondAmountEth required" });
    }
    try {
        const result = await joinGroup(cfg, DEFAULT_KEY, groupId, bondAmountEth);
        return { ok: true, ...result };
    }
    catch (error) {
        console.error("Error joining group:", error);
        return res.status(500).send({ ok: false, error: "Failed to join group" });
    }
});
// Leave a group
app.post("/api/groups/:groupId/leave", async (req, res) => {
    if (!DEFAULT_KEY)
        return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
    const { groupId } = req.params;
    try {
        const result = await leaveGroup(cfg, DEFAULT_KEY, groupId);
        return { ok: true, ...result };
    }
    catch (error) {
        console.error("Error leaving group:", error);
        return res.status(500).send({ ok: false, error: "Failed to leave group" });
    }
});
// Deposit additional bond to group
app.post("/api/groups/:groupId/deposit", async (req, res) => {
    if (!DEFAULT_KEY)
        return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
    const { groupId } = req.params;
    const { amountEth } = req.body;
    if (!amountEth) {
        return res.status(400).send({ ok: false, error: "amountEth required" });
    }
    try {
        const result = await depositBondToGroup(cfg, DEFAULT_KEY, groupId, amountEth);
        return { ok: true, ...result };
    }
    catch (error) {
        console.error("Error depositing to group:", error);
        return res.status(500).send({ ok: false, error: "Failed to deposit to group" });
    }
});
// Withdraw bond from group
app.post("/api/groups/:groupId/withdraw", async (req, res) => {
    if (!DEFAULT_KEY)
        return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
    const { groupId } = req.params;
    const { amountEth } = req.body;
    if (!amountEth) {
        return res.status(400).send({ ok: false, error: "amountEth required" });
    }
    try {
        const result = await withdrawBondFromGroup(cfg, DEFAULT_KEY, groupId, amountEth);
        return { ok: true, ...result };
    }
    catch (error) {
        console.error("Error withdrawing from group:", error);
        return res.status(500).send({ ok: false, error: "Failed to withdraw from group" });
    }
});
// Apply penalty to group member (owner only)
app.post("/api/groups/:groupId/penalty", async (req, res) => {
    if (!DEFAULT_KEY)
        return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
    const { groupId } = req.params;
    const { user, amountEth } = req.body;
    if (!user || !amountEth) {
        return res.status(400).send({ ok: false, error: "user and amountEth required" });
    }
    if (!isAddress(user)) {
        return res.status(400).send({ ok: false, error: "Invalid user address" });
    }
    try {
        const result = await applyPenaltyToGroup(cfg, DEFAULT_KEY, groupId, user, amountEth);
        return { ok: true, ...result };
    }
    catch (error) {
        console.error("Error applying penalty:", error);
        return res.status(500).send({ ok: false, error: "Failed to apply penalty" });
    }
});
// Withdraw from group pot (owner only)
app.post("/api/groups/:groupId/pot/withdraw", async (req, res) => {
    if (!DEFAULT_KEY)
        return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
    const { groupId } = req.params;
    const { to, amountEth } = req.body;
    if (!to || !amountEth) {
        return res.status(400).send({ ok: false, error: "to and amountEth required" });
    }
    if (!isAddress(to)) {
        return res.status(400).send({ ok: false, error: "Invalid recipient address" });
    }
    try {
        const result = await withdrawGroupPot(cfg, DEFAULT_KEY, groupId, to, amountEth);
        return { ok: true, ...result };
    }
    catch (error) {
        console.error("Error withdrawing from pot:", error);
        return res.status(500).send({ ok: false, error: "Failed to withdraw from pot" });
    }
});
// Distribute group pot equally among members (owner only)
app.post("/api/groups/:groupId/pot/distribute", async (req, res) => {
    if (!DEFAULT_KEY)
        return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
    const { groupId } = req.params;
    try {
        const result = await distributeGroupPot(cfg, DEFAULT_KEY, groupId);
        return { ok: true, ...result };
    }
    catch (error) {
        console.error("Error distributing pot:", error);
        return res.status(500).send({ ok: false, error: "Failed to distribute pot" });
    }
});
// Deactivate group (creator or owner only)
app.post("/api/groups/:groupId/deactivate", async (req, res) => {
    if (!DEFAULT_KEY)
        return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
    const { groupId } = req.params;
    try {
        const result = await deactivateGroup(cfg, DEFAULT_KEY, groupId);
        return { ok: true, ...result };
    }
    catch (error) {
        console.error("Error deactivating group:", error);
        return res.status(500).send({ ok: false, error: "Failed to deactivate group" });
    }
});
// ============ GROUP VIEW ENDPOINTS ============
// Get group information
app.get("/api/groups/:groupId", async (req, res) => {
    const { groupId } = req.params;
    try {
        const group = await getGroup(cfg, groupId);
        return { ok: true, group };
    }
    catch (error) {
        console.error("Error getting group:", error);
        return res.status(500).send({ ok: false, error: "Failed to get group" });
    }
});
// Get group member information
app.get("/api/groups/:groupId/members/:member", async (req, res) => {
    const { groupId, member } = req.params;
    if (!isAddress(member)) {
        return res.status(400).send({ ok: false, error: "Invalid member address" });
    }
    try {
        const memberInfo = await getGroupMember(cfg, groupId, member);
        return { ok: true, member: memberInfo };
    }
    catch (error) {
        console.error("Error getting group member:", error);
        return res.status(500).send({ ok: false, error: "Failed to get group member" });
    }
});
// Get group pot balance
app.get("/api/groups/:groupId/pot", async (req, res) => {
    const { groupId } = req.params;
    try {
        const potBalance = await getGroupPotBalance(cfg, groupId);
        return { ok: true, potBalance: potBalance.toString() };
    }
    catch (error) {
        console.error("Error getting group pot:", error);
        return res.status(500).send({ ok: false, error: "Failed to get group pot" });
    }
});
// Get member's bond in group
app.get("/api/groups/:groupId/bonds/:member", async (req, res) => {
    const { groupId, member } = req.params;
    if (!isAddress(member)) {
        return res.status(400).send({ ok: false, error: "Invalid member address" });
    }
    try {
        const bondAmount = await getGroupBond(cfg, groupId, member);
        return { ok: true, bondAmount: bondAmount.toString() };
    }
    catch (error) {
        console.error("Error getting group bond:", error);
        return res.status(500).send({ ok: false, error: "Failed to get group bond" });
    }
});
// Get group member list
app.get("/api/groups/:groupId/members", async (req, res) => {
    const { groupId } = req.params;
    try {
        const members = await getGroupMembers(cfg, groupId);
        return { ok: true, members };
    }
    catch (error) {
        console.error("Error getting group members:", error);
        return res.status(500).send({ ok: false, error: "Failed to get group members" });
    }
});
// Get user's groups
app.get("/api/users/:user/groups", async (req, res) => {
    const { user } = req.params;
    if (!isAddress(user)) {
        return res.status(400).send({ ok: false, error: "Invalid user address" });
    }
    try {
        const groups = await getUserGroups(cfg, user);
        return { ok: true, groups };
    }
    catch (error) {
        console.error("Error getting user groups:", error);
        return res.status(500).send({ ok: false, error: "Failed to get user groups" });
    }
});
// Check if user is member of group
app.get("/api/groups/:groupId/members/:member/check", async (req, res) => {
    const { groupId, member } = req.params;
    if (!isAddress(member)) {
        return res.status(400).send({ ok: false, error: "Invalid member address" });
    }
    try {
        const isMember = await isGroupMember(cfg, groupId, member);
        return { ok: true, isMember };
    }
    catch (error) {
        console.error("Error checking membership:", error);
        return res.status(500).send({ ok: false, error: "Failed to check membership" });
    }
});
// Get group member count
app.get("/api/groups/:groupId/member-count", async (req, res) => {
    const { groupId } = req.params;
    try {
        const memberCount = await getGroupMemberCount(cfg, groupId);
        return { ok: true, memberCount };
    }
    catch (error) {
        console.error("Error getting member count:", error);
        return res.status(500).send({ ok: false, error: "Failed to get member count" });
    }
});
// Check if group has reached target
app.get("/api/groups/:groupId/target-reached", async (req, res) => {
    const { groupId } = req.params;
    try {
        const hasReachedTarget = await hasGroupReachedTarget(cfg, groupId);
        return { ok: true, hasReachedTarget };
    }
    catch (error) {
        console.error("Error checking target:", error);
        return res.status(500).send({ ok: false, error: "Failed to check target" });
    }
});
// Get group progress percentage
app.get("/api/groups/:groupId/progress", async (req, res) => {
    const { groupId } = req.params;
    try {
        const progress = await getGroupProgress(cfg, groupId);
        return { ok: true, progress };
    }
    catch (error) {
        console.error("Error getting progress:", error);
        return res.status(500).send({ ok: false, error: "Failed to get progress" });
    }
});
// Get all group IDs
app.get("/api/groups", async (req, res) => {
    try {
        const groupIds = await getAllGroupIds(cfg);
        return { ok: true, groupIds };
    }
    catch (error) {
        console.error("Error getting all groups:", error);
        return res.status(500).send({ ok: false, error: "Failed to get all groups" });
    }
});
// ============ WEBHOOK ENDPOINT FOR PYTHON AGENTS ============
// Webhook for Python agents to report violations
app.post("/api/violations/webhook", async (req, res) => {
    const { groupId, memberFid, ruleId, violationType, evidence } = req.body;
    if (!groupId || !memberFid || !ruleId || !violationType || !evidence) {
        return res.status(400).send({
            ok: false,
            error: "groupId, memberFid, ruleId, violationType, and evidence required"
        });
    }
    try {
        // TODO: Implement Farcaster FID to wallet address resolution
        // For now, we'll use a placeholder
        const memberAddress = "0x0000000000000000000000000000000000000000"; // Placeholder
        // Create violation record in database
        const violation = await groupService.reportViolation({
            groupId,
            memberAddress: memberAddress,
            ruleId,
            message: evidence,
            platform: 'farcaster'
        });
        // Notify group via WebSocket
        notificationService.notifyViolation(violation);
        return { ok: true, violation };
    }
    catch (error) {
        console.error("Error processing violation webhook:", error);
        return res.status(500).send({ ok: false, error: "Failed to process violation" });
    }
});
app.get("/state", async (req, res) => {
    const user = req.query.user;
    if (!user || !isAddress(user))
        return res.status(400).send({ ok: false, error: "invalid 'user' address" });
    const state = await readState(cfg, user);
    return { ok: true, state };
});
app.post("/deposit", async (req, res) => {
    if (!DEFAULT_KEY)
        return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
    const { amountEth } = req.body;
    if (!amountEth)
        return res.status(400).send({ ok: false, error: "amountEth required" });
    const rcpt = await depositBond(cfg, DEFAULT_KEY, String(amountEth));
    return { ok: true, tx: rcpt };
});
app.post("/withdraw", async (req, res) => {
    if (!DEFAULT_KEY)
        return res.status(400).send({ ok: false, error: "DEFAULT_PRIVATE_KEY not set" });
    const { amountEth } = req.body;
    if (!amountEth)
        return res.status(400).send({ ok: false, error: "amountEth required" });
    const rcpt = await withdrawBond(cfg, DEFAULT_KEY, String(amountEth));
    return { ok: true, tx: rcpt };
});
app.post("/build-withdraw", async (req, res) => {
    const { to, amountEth } = req.body;
    if (!to || !isAddress(String(to)))
        return res.status(400).send({ ok: false, error: "invalid 'to' address" });
    if (!amountEth)
        return res.status(400).send({ ok: false, error: "amountEth required" });
    const call = buildWithdrawPotCalldata(cfg, to, String(amountEth));
    return { ok: true, call };
});
// Group Management Endpoints
app.get("/groups", async (req, res) => {
    try {
        const groups = await groupService.getAllGroups();
        return { ok: true, groups };
    }
    catch (error) {
        return res.status(500).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
app.post("/groups", async (req, res) => {
    try {
        const request = CreateGroupRequest.parse(req.body);
        const group = await groupService.createGroup(request);
        return { ok: true, group };
    }
    catch (error) {
        return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
app.get("/groups/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const dashboard = await groupService.getGroupDashboard(id);
        return { ok: true, dashboard };
    }
    catch (error) {
        return res.status(404).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
app.post("/groups/:id/members", async (req, res) => {
    const { id } = req.params;
    try {
        const request = { ...AddMemberRequest.parse(req.body), groupId: id };
        const member = await groupService.addMember(request);
        return { ok: true, member };
    }
    catch (error) {
        return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
app.post("/groups/:id/rules", async (req, res) => {
    const { id } = req.params;
    try {
        const request = { ...CreateRuleRequest.parse(req.body), groupId: id };
        const rule = await groupService.createRule(request);
        return { ok: true, rule };
    }
    catch (error) {
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
    }
    catch (error) {
        return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
app.post("/violations/:id/apply-penalty", async (req, res) => {
    const { id } = req.params;
    const { privateKey } = req.body;
    if (!privateKey)
        return res.status(400).send({ ok: false, error: "privateKey required" });
    try {
        const result = await groupService.applyPenalty(id, privateKey);
        // Get violation details for notification
        const violation = db.getViolationById(id);
        if (violation) {
            notificationService.notifyPenaltyApplied(violation);
        }
        return { ok: true, tx: result };
    }
    catch (error) {
        return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
// User Dashboard
app.get("/users/:address/dashboard", async (req, res) => {
    const { address } = req.params;
    if (!isAddress(address))
        return res.status(400).send({ ok: false, error: "invalid address" });
    try {
        const dashboard = await groupService.getUserDashboard(address);
        return { ok: true, dashboard };
    }
    catch (error) {
        return res.status(500).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
// Voting System
app.post("/groups/:id/votes", async (req, res) => {
    const { id } = req.params;
    const { proposalType, proposalData, proposerAddress, expiresInHours } = req.body;
    if (!proposalType || !proposalData || !proposerAddress) {
        return res.status(400).send({ ok: false, error: "proposalType, proposalData, and proposerAddress required" });
    }
    if (!isAddress(proposerAddress)) {
        return res.status(400).send({ ok: false, error: "invalid proposerAddress" });
    }
    try {
        const vote = await groupService.createVote(id, proposalType, proposalData, proposerAddress, expiresInHours);
        return { ok: true, vote };
    }
    catch (error) {
        return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
app.post("/votes/:id/submit", async (req, res) => {
    const { id } = req.params;
    const { voterAddress, response } = req.body;
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
    }
    catch (error) {
        return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
// Enhanced voting endpoints
app.get("/votes/:id/status", async (req, res) => {
    const { id } = req.params;
    try {
        const voteResult = await consensusService.getVoteStatus(id);
        return { ok: true, voteResult };
    }
    catch (error) {
        return res.status(404).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
app.get("/groups/:id/votes", async (req, res) => {
    const { id } = req.params;
    try {
        const votes = await consensusService.getGroupVotes(id);
        return { ok: true, votes };
    }
    catch (error) {
        return res.status(404).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
app.post("/groups/:id/votes/pot-distribution", async (req, res) => {
    const { id } = req.params;
    const { recipient, amount, reason, proposerAddress, expiresInHours } = req.body;
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
    }
    catch (error) {
        return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
app.post("/groups/:id/votes/build-execution", async (req, res) => {
    const { id } = req.params;
    const { recipient, amount } = req.body;
    if (!recipient || !amount) {
        return res.status(400).send({ ok: false, error: "recipient and amount required" });
    }
    if (!isAddress(recipient)) {
        return res.status(400).send({ ok: false, error: "invalid recipient address" });
    }
    try {
        const calldata = consensusService.buildPotDistributionCalldata(id, { recipient, amount, reason: '' });
        return { ok: true, calldata };
    }
    catch (error) {
        return res.status(400).send({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
});
// Background task for checking expired votes
setInterval(async () => {
    try {
        await consensusService.checkExpiredVotes();
    }
    catch (error) {
        console.error('Error checking expired votes:', error);
    }
}, 60000); // Check every minute
app.listen({ port: PORT, host: "0.0.0.0" }).catch((e) => {
    console.error(e);
    process.exit(1);
});
