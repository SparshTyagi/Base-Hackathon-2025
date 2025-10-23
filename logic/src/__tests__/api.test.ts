import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';

// Mock the database and services for API testing
const mockDb = {
  createGroup: vi.fn(),
  getGroup: vi.fn(),
  getGroupsByCreator: vi.fn(),
  addMember: vi.fn(),
  getGroupMembers: vi.fn(),
  createRule: vi.fn(),
  getGroupRules: vi.fn(),
  createViolation: vi.fn(),
  getMemberViolations: vi.fn(),
  markViolationPenaltyApplied: vi.fn(),
  getViolationById: vi.fn(),
  getRuleById: vi.fn(),
  getRecentViolations: vi.fn(),
  createVote: vi.fn(),
  submitVoteResponse: vi.fn(),
  getVoteById: vi.fn(),
  getVoteResponses: vi.fn(),
  updateVoteStatus: vi.fn(),
  getActiveVotes: vi.fn(),
  getAllGroups: vi.fn(),
  close: vi.fn()
};

const mockGroupService = {
  createGroup: vi.fn(),
  addMember: vi.fn(),
  createRule: vi.fn(),
  reportViolation: vi.fn(),
  applyPenalty: vi.fn(),
  getGroupDashboard: vi.fn(),
  getUserDashboard: vi.fn(),
  createVote: vi.fn(),
  submitVote: vi.fn()
};

const mockNotificationService = {
  notifyViolation: vi.fn(),
  notifyPenaltyApplied: vi.fn(),
  notifyVoteCreated: vi.fn(),
  notifyMemberJoined: vi.fn(),
  notifyVoteEnded: vi.fn(),
  notifyVoteResult: vi.fn()
};

const mockConsensusService = {
  processVoteResults: vi.fn(),
  getVoteStatus: vi.fn(),
  getGroupVotes: vi.fn(),
  checkExpiredVotes: vi.fn(),
  buildPotDistributionCalldata: vi.fn()
};

describe('API Endpoints', () => {
  let app: any;

  beforeAll(async () => {
    // Mock the imports
    vi.mock('../database.js', () => ({ SwearJarDatabase: vi.fn(() => mockDb) }));
    vi.mock('../groupService.js', () => ({ GroupService: vi.fn(() => mockGroupService) }));
    vi.mock('../notificationService.js', () => ({ NotificationService: vi.fn(() => mockNotificationService) }));
    vi.mock('../consensusService.js', () => ({ ConsensusService: vi.fn(() => mockConsensusService) }));

    // Import after mocking
    const { default: server } = await import('../server.js');
    app = server;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.ok).toBe(true);
      expect(data.rpcUrl).toBeDefined();
      expect(data.contract).toBeDefined();
    });
  });

  describe('Group Management', () => {
    it('should create a group', async () => {
      const groupData = {
        name: 'Test Group',
        description: 'A test group',
        contractAddress: '0x1234567890123456789012345678901234567890',
        creatorAddress: '0x0987654321098765432109876543210987654321'
      };

      const mockGroup = { id: 'test-id', ...groupData };
      mockGroupService.createGroup.mockResolvedValue(mockGroup);

      const response = await app.inject({
        method: 'POST',
        url: '/groups',
        payload: groupData
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.ok).toBe(true);
      expect(data.group).toEqual(mockGroup);
    });

    it('should get group dashboard', async () => {
      const groupId = 'test-group-id';
      const mockDashboard = {
        group: { id: groupId, name: 'Test Group' },
        members: [],
        rules: [],
        recentViolations: []
      };

      mockGroupService.getGroupDashboard.mockResolvedValue(mockDashboard);

      const response = await app.inject({
        method: 'GET',
        url: `/groups/${groupId}`
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.ok).toBe(true);
      expect(data.dashboard).toEqual(mockDashboard);
    });
  });

  describe('Violation Management', () => {
    it('should report a violation', async () => {
      const violationData = {
        groupId: 'test-group-id',
        memberAddress: '0x1111111111111111111111111111111111111111',
        ruleId: 'test-rule-id',
        message: 'Test message with bad words',
        platform: 'discord'
      };

      const mockViolation = { id: 'violation-id', ...violationData };
      mockGroupService.reportViolation.mockResolvedValue(mockViolation);

      const response = await app.inject({
        method: 'POST',
        url: '/violations',
        payload: violationData
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.ok).toBe(true);
      expect(data.violation).toEqual(mockViolation);
      expect(mockNotificationService.notifyViolation).toHaveBeenCalledWith(mockViolation);
    });
  });

  describe('Voting System', () => {
    it('should create a pot distribution vote', async () => {
      const groupId = 'test-group-id';
      const voteData = {
        recipient: '0x3333333333333333333333333333333333333333',
        amount: '0.1',
        reason: 'Winner gets the pot',
        proposerAddress: '0x0987654321098765432109876543210987654321',
        expiresInHours: 24
      };

      const mockVote = { id: 'vote-id', groupId, proposalType: 'pot_distribution' };
      mockGroupService.createVote.mockResolvedValue(mockVote);

      const response = await app.inject({
        method: 'POST',
        url: `/groups/${groupId}/votes/pot-distribution`,
        payload: voteData
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.ok).toBe(true);
      expect(data.vote).toEqual(mockVote);
      expect(mockNotificationService.notifyVoteCreated).toHaveBeenCalledWith(mockVote);
    });

    it('should submit a vote', async () => {
      const voteId = 'test-vote-id';
      const voteData = {
        voterAddress: '0x1111111111111111111111111111111111111111',
        response: 'yes'
      };

      const mockVoteResponse = { id: 'response-id', voteId, ...voteData };
      const mockVoteResult = { voteId, status: 'passed', totalVotes: 1, yesVotes: 1 };

      mockGroupService.submitVote.mockResolvedValue(mockVoteResponse);
      mockConsensusService.processVoteResults.mockResolvedValue(mockVoteResult);

      const response = await app.inject({
        method: 'POST',
        url: `/votes/${voteId}/submit`,
        payload: voteData
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.ok).toBe(true);
      expect(data.voteResponse).toEqual(mockVoteResponse);
      expect(data.voteResult).toEqual(mockVoteResult);
      expect(mockNotificationService.notifyVoteResult).toHaveBeenCalledWith(voteId, mockVoteResult);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid addresses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/state?user=invalid-address'
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.ok).toBe(false);
      expect(data.error).toContain('invalid');
    });

    it('should handle missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/groups',
        payload: { name: 'Test Group' } // Missing required fields
      });

      expect(response.statusCode).toBe(400);
      const data = JSON.parse(response.body);
      expect(data.ok).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
});
