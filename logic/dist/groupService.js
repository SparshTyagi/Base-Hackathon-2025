import { v4 as uuidv4 } from 'uuid';
import { depositBond } from './jar.js';
import { z } from 'zod';
export const CreateGroupRequest = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    creatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/)
});
export const AddMemberRequest = z.object({
    groupId: z.string().uuid(),
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    bondAmount: z.string().default('0')
});
export const CreateRuleRequest = z.object({
    groupId: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    penaltyAmount: z.string()
});
export const ReportViolationRequest = z.object({
    groupId: z.string().uuid(),
    memberAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    ruleId: z.string().uuid(),
    message: z.string().max(1000),
    platform: z.string()
});
export class GroupService {
    constructor(db, jarConfig) {
        this.db = db;
        this.jarConfig = jarConfig;
    }
    async createGroup(request) {
        const group = {
            id: uuidv4(),
            name: request.name,
            description: request.description,
            contractAddress: request.contractAddress,
            creatorAddress: request.creatorAddress,
            createdAt: new Date().toISOString(),
            isActive: true
        };
        this.db.createGroup(group);
        // Add creator as first member
        const creatorMember = {
            id: uuidv4(),
            groupId: group.id,
            address: request.creatorAddress,
            joinedAt: new Date().toISOString(),
            isActive: true,
            bondAmount: '0'
        };
        this.db.addMember(creatorMember);
        return group;
    }
    async addMember(request) {
        const member = {
            id: uuidv4(),
            groupId: request.groupId,
            address: request.address,
            joinedAt: new Date().toISOString(),
            isActive: true,
            bondAmount: request.bondAmount
        };
        this.db.addMember(member);
        return member;
    }
    async createRule(request) {
        const rule = {
            id: uuidv4(),
            groupId: request.groupId,
            name: request.name,
            description: request.description,
            penaltyAmount: request.penaltyAmount,
            isActive: true,
            createdAt: new Date().toISOString()
        };
        this.db.createRule(rule);
        return rule;
    }
    async reportViolation(request) {
        const violation = {
            id: uuidv4(),
            groupId: request.groupId,
            memberAddress: request.memberAddress,
            ruleId: request.ruleId,
            message: request.message,
            platform: request.platform,
            detectedAt: new Date().toISOString(),
            penaltyApplied: false
        };
        this.db.createViolation(violation);
        return violation;
    }
    async applyPenalty(violationId, memberPrivateKey) {
        const violation = this.getViolationById(violationId);
        if (!violation) {
            throw new Error('Violation not found');
        }
        if (violation.penaltyApplied) {
            throw new Error('Penalty already applied');
        }
        const rule = this.getRuleById(violation.ruleId);
        if (!rule) {
            throw new Error('Rule not found');
        }
        // Apply penalty by depositing bond
        const result = await depositBond(this.jarConfig, memberPrivateKey, rule.penaltyAmount);
        // Mark violation as penalty applied
        this.db.markViolationPenaltyApplied(violationId, result.hash);
        return { txHash: result.hash, block: result.block };
    }
    async getGroupDashboard(groupId) {
        const group = this.db.getGroup(groupId);
        if (!group) {
            throw new Error('Group not found');
        }
        const members = this.db.getGroupMembers(groupId);
        const rules = this.db.getGroupRules(groupId);
        const recentViolations = this.getRecentViolations(groupId, 10);
        return {
            group,
            members,
            rules,
            recentViolations
        };
    }
    async getUserDashboard(userAddress) {
        const groups = this.db.getGroupsByCreator(userAddress);
        const violations = this.db.getMemberViolations(userAddress);
        // Calculate total penalties (sum of all penalty amounts for applied violations)
        const totalPenalties = violations
            .filter(v => v.penaltyApplied)
            .reduce((sum, v) => {
            const rule = this.getRuleById(v.ruleId);
            return rule ? (parseFloat(sum) + parseFloat(rule.penaltyAmount)).toString() : sum;
        }, '0');
        return {
            groups,
            violations,
            totalPenalties
        };
    }
    getViolationById(id) {
        return this.db.getViolationById(id);
    }
    getRuleById(id) {
        return this.db.getRuleById(id);
    }
    getRecentViolations(groupId, limit) {
        return this.db.getRecentViolations(groupId, limit);
    }
    async createVote(groupId, proposalType, proposalData, proposerAddress, expiresInHours = 24) {
        const vote = {
            id: uuidv4(),
            groupId,
            proposalType: proposalType,
            proposalData: JSON.stringify(proposalData),
            proposerAddress: proposerAddress,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(),
            status: 'active'
        };
        this.db.createVote(vote);
        return vote;
    }
    async submitVote(voteId, voterAddress, response) {
        const voteResponse = {
            id: uuidv4(),
            voteId,
            voterAddress: voterAddress,
            response,
            createdAt: new Date().toISOString()
        };
        this.db.submitVoteResponse(voteResponse);
        return voteResponse;
    }
    async getAllGroups() {
        return this.db.getAllGroups();
    }
}
