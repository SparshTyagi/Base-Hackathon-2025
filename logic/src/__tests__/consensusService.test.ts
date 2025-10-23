import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SwearJarDatabase } from '../database.js';
import { GroupService } from '../groupService.js';
import { NotificationService } from '../notificationService.js';
import { ConsensusService } from '../consensusService.js';
import { type JarConfig } from '../jar.js';

describe('ConsensusService', () => {
  let db: SwearJarDatabase;
  let groupService: GroupService;
  let notificationService: NotificationService;
  let consensusService: ConsensusService;
  const testDbPath = './test-consensus.db';
  const jarConfig: JarConfig = {
    rpcUrl: 'https://sepolia.base.org',
    contract: '0x1234567890123456789012345678901234567890'
  };

  beforeEach(() => {
    db = new SwearJarDatabase(testDbPath);
    groupService = new GroupService(db, jarConfig);
    notificationService = new NotificationService();
    consensusService = new ConsensusService(db, groupService, notificationService, jarConfig);
  });

  afterEach(() => {
    db.close();
  });

  describe('Vote Processing', () => {
    it('should calculate vote results correctly', async () => {
      // Create group with members
      const groupRequest = {
        name: 'Test Group',
        contractAddress: '0x1234567890123456789012345678901234567890',
        creatorAddress: '0x0987654321098765432109876543210987654321'
      };
      const group = await groupService.createGroup(groupRequest);

      // Add more members to test quorum
      const member1 = await groupService.addMember({
        groupId: group.id,
        address: '0x1111111111111111111111111111111111111111',
        bondAmount: '0.01'
      });

      const member2 = await groupService.addMember({
        groupId: group.id,
        address: '0x2222222222222222222222222222222222222222',
        bondAmount: '0.01'
      });

      // Create a vote
      const vote = await groupService.createVote(
        group.id,
        'pot_distribution',
        { recipient: '0x3333333333333333333333333333333333333333', amount: '0.1' },
        groupRequest.creatorAddress,
        24
      );

      // Submit votes (2 out of 3 members voting - should meet quorum)
      await groupService.submitVote(vote.id, groupRequest.creatorAddress, 'yes');
      await groupService.submitVote(vote.id, member1.address, 'yes');

      const result = await consensusService.processVoteResults(vote.id);

      expect(result.voteId).toBe(vote.id);
      expect(result.totalVotes).toBe(2);
      expect(result.yesVotes).toBe(2);
      expect(result.noVotes).toBe(0);
      expect(result.quorumMet).toBe(true); // 2 out of 3 members voted
      expect(result.majorityReached).toBe(true);
      expect(result.status).toBe('passed');
    });

    it('should handle insufficient quorum', async () => {
      // Create group with members
      const groupRequest = {
        name: 'Test Group',
        contractAddress: '0x1234567890123456789012345678901234567890',
        creatorAddress: '0x0987654321098765432109876543210987654321'
      };
      const group = await groupService.createGroup(groupRequest);

      // Add more members
      await groupService.addMember({
        groupId: group.id,
        address: '0x1111111111111111111111111111111111111111',
        bondAmount: '0.01'
      });

      await groupService.addMember({
        groupId: group.id,
        address: '0x2222222222222222222222222222222222222222',
        bondAmount: '0.01'
      });

      // Create a vote
      const vote = await groupService.createVote(
        group.id,
        'pot_distribution',
        { recipient: '0x3333333333333333333333333333333333333333', amount: '0.1' },
        groupRequest.creatorAddress,
        24
      );

      // Only 1 vote out of 4 members - insufficient quorum
      await groupService.submitVote(vote.id, groupRequest.creatorAddress, 'yes');

      const result = await consensusService.processVoteResults(vote.id);

      expect(result.quorumMet).toBe(false);
      expect(result.status).toBe('active'); // Still active, waiting for more votes
    });

    it('should handle rejected votes', async () => {
      // Create group with members
      const groupRequest = {
        name: 'Test Group',
        contractAddress: '0x1234567890123456789012345678901234567890',
        creatorAddress: '0x0987654321098765432109876543210987654321'
      };
      const group = await groupService.createGroup(groupRequest);

      // Add one member (total 2 members)
      await groupService.addMember({
        groupId: group.id,
        address: '0x1111111111111111111111111111111111111111',
        bondAmount: '0.01'
      });

      // Create a vote
      const vote = await groupService.createVote(
        group.id,
        'pot_distribution',
        { recipient: '0x3333333333333333333333333333333333333333', amount: '0.1' },
        groupRequest.creatorAddress,
        24
      );

      // Vote no (1 yes, 1 no out of 2 members - quorum met but majority not reached)
      await groupService.submitVote(vote.id, groupRequest.creatorAddress, 'yes');
      await groupService.submitVote(vote.id, '0x1111111111111111111111111111111111111111', 'no');

      const result = await consensusService.processVoteResults(vote.id);

      expect(result.quorumMet).toBe(true);
      expect(result.majorityReached).toBe(false);
      expect(result.status).toBe('rejected');
    });
  });

  describe('Vote Status', () => {
    it('should get vote status', async () => {
      const groupRequest = {
        name: 'Test Group',
        contractAddress: '0x1234567890123456789012345678901234567890',
        creatorAddress: '0x0987654321098765432109876543210987654321'
      };
      const group = await groupService.createGroup(groupRequest);

      const vote = await groupService.createVote(
        group.id,
        'pot_distribution',
        { recipient: '0x3333333333333333333333333333333333333333', amount: '0.1' },
        groupRequest.creatorAddress,
        24
      );

      const status = await consensusService.getVoteStatus(vote.id);

      expect(status.voteId).toBe(vote.id);
      expect(status.totalVotes).toBe(0);
      expect(status.status).toBe('active');
    });
  });

  describe('Group Votes', () => {
    it('should get group votes', async () => {
      const groupRequest = {
        name: 'Test Group',
        contractAddress: '0x1234567890123456789012345678901234567890',
        creatorAddress: '0x0987654321098765432109876543210987654321'
      };
      const group = await groupService.createGroup(groupRequest);

      // Create multiple votes
      await groupService.createVote(
        group.id,
        'pot_distribution',
        { recipient: '0x3333333333333333333333333333333333333333', amount: '0.1' },
        groupRequest.creatorAddress,
        24
      );

      await groupService.createVote(
        group.id,
        'rule_change',
        { action: 'add', ruleData: { name: 'New Rule', penaltyAmount: '0.01' } },
        groupRequest.creatorAddress,
        48
      );

      const votes = await consensusService.getGroupVotes(group.id);

      expect(votes.activeVotes).toHaveLength(2);
      expect(votes.recentResults).toHaveLength(0);
    });
  });
});
