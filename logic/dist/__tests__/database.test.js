import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SwearJarDatabase } from '../database-simple.js';
import { v4 as uuidv4 } from 'uuid';
describe('SwearJarDatabase', () => {
    let db;
    const testDbPath = './test-swearjar.db';
    beforeEach(() => {
        db = new SwearJarDatabase(testDbPath);
    });
    afterEach(() => {
        db.close();
    });
    describe('Group Operations', () => {
        it('should create and retrieve a group', () => {
            const group = {
                id: uuidv4(),
                name: 'Test Group',
                description: 'A test group',
                contractAddress: '0x1234567890123456789012345678901234567890',
                creatorAddress: '0x0987654321098765432109876543210987654321',
                createdAt: new Date().toISOString(),
                isActive: true
            };
            db.createGroup(group);
            const retrieved = db.getGroup(group.id);
            expect(retrieved).toEqual(group);
        });
        it('should return null for non-existent group', () => {
            const retrieved = db.getGroup('non-existent-id');
            expect(retrieved).toBeNull();
        });
        it('should get groups by creator', () => {
            const creatorAddress = '0x0987654321098765432109876543210987654321';
            const group = {
                id: uuidv4(),
                name: 'Test Group',
                contractAddress: '0x1234567890123456789012345678901234567890',
                creatorAddress,
                createdAt: new Date().toISOString(),
                isActive: true
            };
            db.createGroup(group);
            const groups = db.getGroupsByCreator(creatorAddress);
            expect(groups).toHaveLength(1);
            expect(groups[0]).toEqual(group);
        });
    });
    describe('Member Operations', () => {
        let groupId;
        beforeEach(() => {
            const group = {
                id: uuidv4(),
                name: 'Test Group',
                contractAddress: '0x1234567890123456789012345678901234567890',
                creatorAddress: '0x0987654321098765432109876543210987654321',
                createdAt: new Date().toISOString(),
                isActive: true
            };
            db.createGroup(group);
            groupId = group.id;
        });
        it('should add and retrieve members', () => {
            const member = {
                id: uuidv4(),
                groupId,
                address: '0x1111111111111111111111111111111111111111',
                joinedAt: new Date().toISOString(),
                isActive: true,
                bondAmount: '0.01'
            };
            db.addMember(member);
            const members = db.getGroupMembers(groupId);
            expect(members).toHaveLength(1);
            expect(members[0]).toEqual(member);
        });
    });
    describe('Rule Operations', () => {
        let groupId;
        beforeEach(() => {
            const group = {
                id: uuidv4(),
                name: 'Test Group',
                contractAddress: '0x1234567890123456789012345678901234567890',
                creatorAddress: '0x0987654321098765432109876543210987654321',
                createdAt: new Date().toISOString(),
                isActive: true
            };
            db.createGroup(group);
            groupId = group.id;
        });
        it('should create and retrieve rules', () => {
            const rule = {
                id: uuidv4(),
                groupId,
                name: 'No Swearing',
                description: 'Penalty for swearing',
                penaltyAmount: '0.005',
                isActive: true,
                createdAt: new Date().toISOString()
            };
            db.createRule(rule);
            const rules = db.getGroupRules(groupId);
            expect(rules).toHaveLength(1);
            expect(rules[0]).toEqual(rule);
        });
    });
    describe('Violation Operations', () => {
        let groupId;
        let ruleId;
        beforeEach(() => {
            const group = {
                id: uuidv4(),
                name: 'Test Group',
                contractAddress: '0x1234567890123456789012345678901234567890',
                creatorAddress: '0x0987654321098765432109876543210987654321',
                createdAt: new Date().toISOString(),
                isActive: true
            };
            db.createGroup(group);
            groupId = group.id;
            const rule = {
                id: uuidv4(),
                groupId,
                name: 'No Swearing',
                description: 'Penalty for swearing',
                penaltyAmount: '0.005',
                isActive: true,
                createdAt: new Date().toISOString()
            };
            db.createRule(rule);
            ruleId = rule.id;
        });
        it('should create and retrieve violations', () => {
            const violation = {
                id: uuidv4(),
                groupId,
                memberAddress: '0x1111111111111111111111111111111111111111',
                ruleId,
                message: 'This is a test message with swear words',
                platform: 'discord',
                detectedAt: new Date().toISOString(),
                penaltyApplied: false
            };
            db.createViolation(violation);
            const violations = db.getMemberViolations(violation.memberAddress);
            expect(violations).toHaveLength(1);
            expect(violations[0]).toEqual(violation);
        });
        it('should mark penalty as applied', () => {
            const violation = {
                id: uuidv4(),
                groupId,
                memberAddress: '0x1111111111111111111111111111111111111111',
                ruleId,
                message: 'This is a test message with swear words',
                platform: 'discord',
                detectedAt: new Date().toISOString(),
                penaltyApplied: false
            };
            db.createViolation(violation);
            const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
            db.markViolationPenaltyApplied(violation.id, txHash);
            const retrieved = db.getViolationById(violation.id);
            expect(retrieved?.penaltyApplied).toBe(true);
            expect(retrieved?.txHash).toBe(txHash);
        });
    });
});
