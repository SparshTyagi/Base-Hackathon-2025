import sqlite3 from 'sqlite3';
import { z } from 'zod';
// Validation schemas
export const GroupSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    creatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    createdAt: z.string().datetime(),
    isActive: z.boolean().default(true)
});
export const MemberSchema = z.object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    joinedAt: z.string().datetime(),
    isActive: z.boolean().default(true),
    bondAmount: z.string().default('0') // ETH amount as string
});
export const RuleSchema = z.object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().max(500),
    penaltyAmount: z.string(), // ETH amount as string
    isActive: z.boolean().default(true),
    createdAt: z.string().datetime()
});
export const ViolationSchema = z.object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
    memberAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    ruleId: z.string().uuid(),
    message: z.string().max(1000),
    platform: z.string(), // 'discord', 'twitter', etc.
    detectedAt: z.string().datetime(),
    penaltyApplied: z.boolean().default(false),
    txHash: z.string().optional() // Transaction hash when penalty is applied
});
export const VoteSchema = z.object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
    proposalType: z.enum(['pot_distribution', 'rule_change', 'member_removal']),
    proposalData: z.string(), // JSON string of proposal details
    proposerAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    status: z.enum(['active', 'passed', 'rejected', 'expired'])
});
export const VoteResponseSchema = z.object({
    id: z.string().uuid(),
    voteId: z.string().uuid(),
    voterAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    response: z.enum(['yes', 'no']),
    createdAt: z.string().datetime()
});
export class SwearJarDatabase {
    constructor(dbPath = './swearjar.db') {
        this.db = new sqlite3.Database(dbPath);
        this.initializeTables();
    }
    initializeTables() {
        // Groups table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        contract_address TEXT NOT NULL,
        creator_address TEXT NOT NULL,
        created_at TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1
      )
    `);
        // Members table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        address TEXT NOT NULL,
        joined_at TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        bond_amount TEXT DEFAULT '0',
        FOREIGN KEY (group_id) REFERENCES groups (id),
        UNIQUE(group_id, address)
      )
    `);
        // Rules table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS rules (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        penalty_amount TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (group_id) REFERENCES groups (id)
      )
    `);
        // Violations table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS violations (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        member_address TEXT NOT NULL,
        rule_id TEXT NOT NULL,
        message TEXT NOT NULL,
        platform TEXT NOT NULL,
        detected_at TEXT NOT NULL,
        penalty_applied BOOLEAN DEFAULT 0,
        tx_hash TEXT,
        FOREIGN KEY (group_id) REFERENCES groups (id),
        FOREIGN KEY (rule_id) REFERENCES rules (id)
      )
    `);
        // Votes table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS votes (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        proposal_type TEXT NOT NULL,
        proposal_data TEXT NOT NULL,
        proposer_address TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (group_id) REFERENCES groups (id)
      )
    `);
        // Vote responses table
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS vote_responses (
        id TEXT PRIMARY KEY,
        vote_id TEXT NOT NULL,
        voter_address TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (vote_id) REFERENCES votes (id),
        UNIQUE(vote_id, voter_address)
      )
    `);
        // Indexes for better performance
        this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_members_group ON members(group_id);
      CREATE INDEX IF NOT EXISTS idx_rules_group ON rules(group_id);
      CREATE INDEX IF NOT EXISTS idx_violations_group ON violations(group_id);
      CREATE INDEX IF NOT EXISTS idx_violations_member ON violations(member_address);
      CREATE INDEX IF NOT EXISTS idx_votes_group ON votes(group_id);
      CREATE INDEX IF NOT EXISTS idx_vote_responses_vote ON vote_responses(vote_id);
    `);
    }
    // Group operations
    createGroup(group) {
        const stmt = this.db.prepare(`
      INSERT INTO groups (id, name, description, contract_address, creator_address, created_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(group.id, group.name, group.description, group.contractAddress, group.creatorAddress, group.createdAt, group.isActive ? 1 : 0);
    }
    getGroup(id) {
        const stmt = this.db.prepare('SELECT * FROM groups WHERE id = ?');
        const row = stmt.get(id);
        if (!row)
            return null;
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            contractAddress: row.contract_address,
            creatorAddress: row.creator_address,
            createdAt: row.created_at,
            isActive: Boolean(row.is_active)
        };
    }
    getGroupsByCreator(creatorAddress) {
        const stmt = this.db.prepare('SELECT * FROM groups WHERE creator_address = ? AND is_active = 1');
        const rows = stmt.all(creatorAddress);
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            contractAddress: row.contract_address,
            creatorAddress: row.creator_address,
            createdAt: row.created_at,
            isActive: Boolean(row.is_active)
        }));
    }
    getAllGroups() {
        const stmt = this.db.prepare('SELECT * FROM groups WHERE is_active = 1');
        const rows = stmt.all();
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            contractAddress: row.contract_address,
            creatorAddress: row.creator_address,
            createdAt: row.created_at,
            isActive: Boolean(row.is_active)
        }));
    }
    // Member operations
    addMember(member) {
        const stmt = this.db.prepare(`
      INSERT INTO members (id, group_id, address, joined_at, is_active, bond_amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
        stmt.run(member.id, member.groupId, member.address, member.joinedAt, member.isActive ? 1 : 0, member.bondAmount);
    }
    getGroupMembers(groupId) {
        const stmt = this.db.prepare('SELECT * FROM members WHERE group_id = ? AND is_active = 1');
        const rows = stmt.all(groupId);
        return rows.map(row => ({
            id: row.id,
            groupId: row.group_id,
            address: row.address,
            joinedAt: row.joined_at,
            isActive: Boolean(row.is_active),
            bondAmount: row.bond_amount
        }));
    }
    // Rule operations
    createRule(rule) {
        const stmt = this.db.prepare(`
      INSERT INTO rules (id, group_id, name, description, penalty_amount, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(rule.id, rule.groupId, rule.name, rule.description, rule.penaltyAmount, rule.isActive ? 1 : 0, rule.createdAt);
    }
    getGroupRules(groupId) {
        const stmt = this.db.prepare('SELECT * FROM rules WHERE group_id = ? AND is_active = 1');
        const rows = stmt.all(groupId);
        return rows.map(row => ({
            id: row.id,
            groupId: row.group_id,
            name: row.name,
            description: row.description,
            penaltyAmount: row.penalty_amount,
            isActive: Boolean(row.is_active),
            createdAt: row.created_at
        }));
    }
    // Violation operations
    createViolation(violation) {
        const stmt = this.db.prepare(`
      INSERT INTO violations (id, group_id, member_address, rule_id, message, platform, detected_at, penalty_applied, tx_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(violation.id, violation.groupId, violation.memberAddress, violation.ruleId, violation.message, violation.platform, violation.detectedAt, violation.penaltyApplied ? 1 : 0, violation.txHash);
    }
    getMemberViolations(memberAddress, groupId) {
        let query = 'SELECT * FROM violations WHERE member_address = ?';
        let params = [memberAddress];
        if (groupId) {
            query += ' AND group_id = ?';
            params.push(groupId);
        }
        query += ' ORDER BY detected_at DESC';
        const stmt = this.db.prepare(query);
        const rows = stmt.all(...params);
        return rows.map(row => ({
            id: row.id,
            groupId: row.group_id,
            memberAddress: row.member_address,
            ruleId: row.rule_id,
            message: row.message,
            platform: row.platform,
            detectedAt: row.detected_at,
            penaltyApplied: Boolean(row.penalty_applied),
            txHash: row.tx_hash
        }));
    }
    markViolationPenaltyApplied(violationId, txHash) {
        const stmt = this.db.prepare('UPDATE violations SET penalty_applied = 1, tx_hash = ? WHERE id = ?');
        stmt.run(txHash, violationId);
    }
    getViolationById(id) {
        const stmt = this.db.prepare('SELECT * FROM violations WHERE id = ?');
        const row = stmt.get(id);
        if (!row)
            return null;
        return {
            id: row.id,
            groupId: row.group_id,
            memberAddress: row.member_address,
            ruleId: row.rule_id,
            message: row.message,
            platform: row.platform,
            detectedAt: row.detected_at,
            penaltyApplied: Boolean(row.penalty_applied),
            txHash: row.tx_hash
        };
    }
    getRuleById(id) {
        const stmt = this.db.prepare('SELECT * FROM rules WHERE id = ?');
        const row = stmt.get(id);
        if (!row)
            return null;
        return {
            id: row.id,
            groupId: row.group_id,
            name: row.name,
            description: row.description,
            penaltyAmount: row.penalty_amount,
            isActive: Boolean(row.is_active),
            createdAt: row.created_at
        };
    }
    getRecentViolations(groupId, limit = 10) {
        const stmt = this.db.prepare('SELECT * FROM violations WHERE group_id = ? ORDER BY detected_at DESC LIMIT ?');
        const rows = stmt.all(groupId, limit);
        return rows.map(row => ({
            id: row.id,
            groupId: row.group_id,
            memberAddress: row.member_address,
            ruleId: row.rule_id,
            message: row.message,
            platform: row.platform,
            detectedAt: row.detected_at,
            penaltyApplied: Boolean(row.penalty_applied),
            txHash: row.tx_hash
        }));
    }
    createVote(vote) {
        const stmt = this.db.prepare(`
      INSERT INTO votes (id, group_id, proposal_type, proposal_data, proposer_address, created_at, expires_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(vote.id, vote.groupId, vote.proposalType, vote.proposalData, vote.proposerAddress, vote.createdAt, vote.expiresAt, vote.status);
    }
    submitVoteResponse(voteResponse) {
        const stmt = this.db.prepare(`
      INSERT INTO vote_responses (id, vote_id, voter_address, response, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
        stmt.run(voteResponse.id, voteResponse.voteId, voteResponse.voterAddress, voteResponse.response, voteResponse.createdAt);
    }
    getVoteById(id) {
        const stmt = this.db.prepare('SELECT * FROM votes WHERE id = ?');
        const row = stmt.get(id);
        if (!row)
            return null;
        return {
            id: row.id,
            groupId: row.group_id,
            proposalType: row.proposal_type,
            proposalData: row.proposal_data,
            proposerAddress: row.proposer_address,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
            status: row.status
        };
    }
    getVoteResponses(voteId) {
        const stmt = this.db.prepare('SELECT * FROM vote_responses WHERE vote_id = ?');
        const rows = stmt.all(voteId);
        return rows.map(row => ({
            id: row.id,
            voteId: row.vote_id,
            voterAddress: row.voter_address,
            response: row.response,
            createdAt: row.created_at
        }));
    }
    updateVoteStatus(voteId, status) {
        const stmt = this.db.prepare('UPDATE votes SET status = ? WHERE id = ?');
        stmt.run(status, voteId);
    }
    getActiveVotes(groupId) {
        const stmt = this.db.prepare('SELECT * FROM votes WHERE group_id = ? AND status = ?');
        const rows = stmt.all(groupId, 'active');
        return rows.map(row => ({
            id: row.id,
            groupId: row.group_id,
            proposalType: row.proposal_type,
            proposalData: row.proposal_data,
            proposerAddress: row.proposer_address,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
            status: row.status
        }));
    }
    close() {
        this.db.close();
    }
}
