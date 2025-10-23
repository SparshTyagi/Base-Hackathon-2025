import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SwearJarDatabase } from '../database-simple.js';
import { GroupService } from '../groupService.js';
describe('GroupService', () => {
    let db;
    let groupService;
    const testDbPath = './test-group-service.db';
    const jarConfig = {
        rpcUrl: 'https://sepolia.base.org',
        contract: '0x1234567890123456789012345678901234567890'
    };
    beforeEach(() => {
        db = new SwearJarDatabase(testDbPath);
        groupService = new GroupService(db, jarConfig);
    });
    afterEach(() => {
        db.close();
    });
    describe('Group Management', () => {
        it('should create a group with creator as first member', async () => {
            const request = {
                name: 'Test Group',
                description: 'A test group',
                contractAddress: '0x1234567890123456789012345678901234567890',
                creatorAddress: '0x0987654321098765432109876543210987654321'
            };
            const group = await groupService.createGroup(request);
            expect(group.name).toBe(request.name);
            expect(group.creatorAddress).toBe(request.creatorAddress);
            // Check that creator was added as member
            const members = db.getGroupMembers(group.id);
            expect(members).toHaveLength(1);
            expect(members[0].address).toBe(request.creatorAddress);
        });
        it('should add members to a group', async () => {
            // First create a group
            const groupRequest = {
                name: 'Test Group',
                contractAddress: '0x1234567890123456789012345678901234567890',
                creatorAddress: '0x0987654321098765432109876543210987654321'
            };
            const group = await groupService.createGroup(groupRequest);
            // Add a member
            const memberRequest = {
                groupId: group.id,
                address: '0x1111111111111111111111111111111111111111',
                bondAmount: '0.01'
            };
            const member = await groupService.addMember(memberRequest);
            expect(member.address).toBe(memberRequest.address);
            expect(member.groupId).toBe(group.id);
            expect(member.bondAmount).toBe('0.01');
            // Check database
            const members = db.getGroupMembers(group.id);
            expect(members).toHaveLength(2); // Creator + new member
        });
        it('should create rules for a group', async () => {
            // First create a group
            const groupRequest = {
                name: 'Test Group',
                contractAddress: '0x1234567890123456789012345678901234567890',
                creatorAddress: '0x0987654321098765432109876543210987654321'
            };
            const group = await groupService.createGroup(groupRequest);
            // Create a rule
            const ruleRequest = {
                groupId: group.id,
                name: 'No Swearing',
                description: 'Penalty for using swear words',
                penaltyAmount: '0.005'
            };
            const rule = await groupService.createRule(ruleRequest);
            expect(rule.name).toBe(ruleRequest.name);
            expect(rule.groupId).toBe(group.id);
            expect(rule.penaltyAmount).toBe('0.005');
            expect(rule.isActive).toBe(true);
            // Check database
            const rules = db.getGroupRules(group.id);
            expect(rules).toHaveLength(1);
        });
    });
    describe('Violation Management', () => {
        let groupId;
        let ruleId;
        beforeEach(async () => {
            // Create group and rule for testing
            const groupRequest = {
                name: 'Test Group',
                contractAddress: '0x1234567890123456789012345678901234567890',
                creatorAddress: '0x0987654321098765432109876543210987654321'
            };
            const group = await groupService.createGroup(groupRequest);
            groupId = group.id;
            const ruleRequest = {
                groupId: group.id,
                name: 'No Swearing',
                description: 'Penalty for using swear words',
                penaltyAmount: '0.005'
            };
            const rule = await groupService.createRule(ruleRequest);
            ruleId = rule.id;
        });
        it('should report violations', async () => {
            const violationRequest = {
                groupId,
                memberAddress: '0x1111111111111111111111111111111111111111',
                ruleId,
                message: 'This is a test message with bad words',
                platform: 'discord'
            };
            const violation = await groupService.reportViolation(violationRequest);
            expect(violation.groupId).toBe(groupId);
            expect(violation.memberAddress).toBe(violationRequest.memberAddress);
            expect(violation.ruleId).toBe(ruleId);
            expect(violation.message).toBe(violationRequest.message);
            expect(violation.platform).toBe('discord');
            expect(violation.penaltyApplied).toBe(false);
            // Check database
            const violations = db.getMemberViolations(violationRequest.memberAddress);
            expect(violations).toHaveLength(1);
        });
    });
    describe('Dashboard Functions', () => {
        it('should get group dashboard', async () => {
            // Create group with members and rules
            const groupRequest = {
                name: 'Test Group',
                contractAddress: '0x1234567890123456789012345678901234567890',
                creatorAddress: '0x0987654321098765432109876543210987654321'
            };
            const group = await groupService.createGroup(groupRequest);
            const memberRequest = {
                groupId: group.id,
                address: '0x1111111111111111111111111111111111111111',
                bondAmount: '0.01'
            };
            await groupService.addMember(memberRequest);
            const ruleRequest = {
                groupId: group.id,
                name: 'No Swearing',
                penaltyAmount: '0.005'
            };
            await groupService.createRule(ruleRequest);
            const dashboard = await groupService.getGroupDashboard(group.id);
            expect(dashboard.group.id).toBe(group.id);
            expect(dashboard.members).toHaveLength(2); // Creator + added member
            expect(dashboard.rules).toHaveLength(1);
            expect(dashboard.recentViolations).toHaveLength(0); // No violations yet
        });
        it('should get user dashboard', async () => {
            const userAddress = '0x0987654321098765432109876543210987654321';
            // Create group as user
            const groupRequest = {
                name: 'Test Group',
                contractAddress: '0x1234567890123456789012345678901234567890',
                creatorAddress: userAddress
            };
            await groupService.createGroup(groupRequest);
            const dashboard = await groupService.getUserDashboard(userAddress);
            expect(dashboard.groups).toHaveLength(1);
            expect(dashboard.violations).toHaveLength(0);
            expect(dashboard.totalPenalties).toBe('0');
        });
    });
});
