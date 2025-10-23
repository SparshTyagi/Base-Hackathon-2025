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
    bondAmount: z.string().default('0')
});
export const RuleSchema = z.object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    penaltyAmount: z.string(),
    isActive: z.boolean().default(true),
    createdAt: z.string().datetime()
});
export const ViolationSchema = z.object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
    memberAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    ruleId: z.string().uuid(),
    message: z.string().max(1000),
    platform: z.string(),
    detectedAt: z.string().datetime(),
    penaltyApplied: z.boolean().default(false),
    txHash: z.string().optional()
});
export const VoteSchema = z.object({
    id: z.string().uuid(),
    groupId: z.string().uuid(),
    proposalType: z.enum(['pot_distribution', 'rule_change', 'member_removal']),
    proposalData: z.string(),
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
// Simple in-memory database for testing
export class SwearJarDatabase {
    constructor(dbPath = './swearjar.db') {
        this.groups = new Map();
        this.members = new Map();
        this.rules = new Map();
        this.violations = new Map();
        this.votes = new Map();
        this.voteResponses = new Map();
        console.log('Using in-memory database for testing');
    }
    // Group operations
    createGroup(group) {
        this.groups.set(group.id, group);
    }
    getGroup(id) {
        return this.groups.get(id) || null;
    }
    getGroupsByCreator(creatorAddress) {
        return Array.from(this.groups.values()).filter(g => g.creatorAddress === creatorAddress);
    }
    getAllGroups() {
        return Array.from(this.groups.values());
    }
    // Member operations
    addMember(member) {
        const members = this.members.get(member.groupId) || [];
        members.push(member);
        this.members.set(member.groupId, members);
    }
    getGroupMembers(groupId) {
        return this.members.get(groupId) || [];
    }
    // Rule operations
    createRule(rule) {
        const rules = this.rules.get(rule.groupId) || [];
        rules.push(rule);
        this.rules.set(rule.groupId, rules);
    }
    getGroupRules(groupId) {
        return this.rules.get(groupId) || [];
    }
    // Violation operations
    createViolation(violation) {
        const violations = this.violations.get(violation.groupId) || [];
        violations.push(violation);
        this.violations.set(violation.groupId, violations);
    }
    getMemberViolations(memberAddress, groupId) {
        let allViolations = [];
        for (const violations of this.violations.values()) {
            allViolations = allViolations.concat(violations);
        }
        if (groupId) {
            allViolations = allViolations.filter(v => v.groupId === groupId);
        }
        return allViolations.filter(v => v.memberAddress === memberAddress);
    }
    markViolationPenaltyApplied(violationId, txHash) {
        for (const violations of this.violations.values()) {
            const violation = violations.find(v => v.id === violationId);
            if (violation) {
                violation.penaltyApplied = true;
                violation.txHash = txHash;
                break;
            }
        }
    }
    getViolationById(id) {
        for (const violations of this.violations.values()) {
            const violation = violations.find(v => v.id === id);
            if (violation)
                return violation;
        }
        return null;
    }
    getRuleById(id) {
        for (const rules of this.rules.values()) {
            const rule = rules.find(r => r.id === id);
            if (rule)
                return rule;
        }
        return null;
    }
    getRecentViolations(groupId, limit = 10) {
        const violations = this.violations.get(groupId) || [];
        return violations
            .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
            .slice(0, limit);
    }
    // Vote operations
    createVote(vote) {
        const votes = this.votes.get(vote.groupId) || [];
        votes.push(vote);
        this.votes.set(vote.groupId, votes);
    }
    submitVoteResponse(voteResponse) {
        const responses = this.voteResponses.get(voteResponse.voteId) || [];
        responses.push(voteResponse);
        this.voteResponses.set(voteResponse.voteId, responses);
    }
    getVoteById(id) {
        for (const votes of this.votes.values()) {
            const vote = votes.find(v => v.id === id);
            if (vote)
                return vote;
        }
        return null;
    }
    getVoteResponses(voteId) {
        return this.voteResponses.get(voteId) || [];
    }
    updateVoteStatus(voteId, status) {
        for (const votes of this.votes.values()) {
            const vote = votes.find(v => v.id === voteId);
            if (vote) {
                vote.status = status;
                break;
            }
        }
    }
    getActiveVotes(groupId) {
        const votes = this.votes.get(groupId) || [];
        return votes.filter(v => v.status === 'active');
    }
    close() {
        console.log('Database closed');
    }
}
