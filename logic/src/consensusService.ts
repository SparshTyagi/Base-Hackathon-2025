import { SwearJarDatabase, Vote, VoteResponse } from './database.js';
import { GroupService } from './groupService.js';
import { NotificationService } from './notificationService.js';
import { buildWithdrawPotCalldata, type JarConfig } from './jar.js';

export interface VoteResult {
  voteId: string;
  status: 'active' | 'passed' | 'rejected' | 'expired';
  totalVotes: number;
  yesVotes: number;
  noVotes: number;
  quorumMet: boolean;
  majorityReached: boolean;
  executionData?: any;
}

export interface PotDistributionProposal {
  recipient: string;
  amount: string;
  reason: string;
}

export interface RuleChangeProposal {
  ruleId?: string;
  action: 'add' | 'update' | 'remove';
  ruleData?: {
    name: string;
    description?: string;
    penaltyAmount: string;
  };
}

export interface MemberRemovalProposal {
  memberAddress: string;
  reason: string;
}

export class ConsensusService {
  constructor(
    private db: SwearJarDatabase,
    private groupService: GroupService,
    private notificationService: NotificationService,
    private jarConfig: JarConfig
  ) {}

  async processVoteResults(voteId: string): Promise<VoteResult> {
    const vote = this.db.getVoteById(voteId);
    if (!vote) {
      throw new Error('Vote not found');
    }

    // Check if vote has expired
    if (new Date(vote.expiresAt) < new Date()) {
      this.db.updateVoteStatus(voteId, 'expired');
      return this.calculateVoteResult(vote, []);
    }

    const responses = this.db.getVoteResponses(voteId);
    const result = this.calculateVoteResult(vote, responses);

    // Update vote status if consensus reached
    if (result.status !== 'active') {
      this.db.updateVoteStatus(voteId, result.status);
      
      // Execute the proposal if passed
      if (result.status === 'passed') {
        await this.executeProposal(vote, result);
      }
    }

    return result;
  }

  private calculateVoteResult(vote: Vote, responses: VoteResponse[]): VoteResult {
    const groupMembers = this.db.getGroupMembers(vote.groupId);
    const totalMembers = groupMembers.length;
    const totalVotes = responses.length;
    const yesVotes = responses.filter(r => r.response === 'yes').length;
    const noVotes = responses.filter(r => r.response === 'no').length;

    // Quorum: At least 50% of members must vote
    const quorumRequired = Math.ceil(totalMembers / 2);
    const quorumMet = totalVotes >= quorumRequired;

    // Majority: More than 50% of votes must be "yes"
    const majorityReached = quorumMet && yesVotes > noVotes;

    let status: VoteResult['status'] = 'active';
    if (new Date(vote.expiresAt) < new Date()) {
      status = 'expired';
    } else if (quorumMet && majorityReached) {
      status = 'passed';
    } else if (quorumMet && !majorityReached) {
      status = 'rejected';
    }

    return {
      voteId: vote.id,
      status,
      totalVotes,
      yesVotes,
      noVotes,
      quorumMet,
      majorityReached,
      executionData: status === 'passed' ? this.parseProposalData(vote) : undefined
    };
  }

  private parseProposalData(vote: Vote): any {
    try {
      return JSON.parse(vote.proposalData);
    } catch {
      return null;
    }
  }

  private async executeProposal(vote: Vote, result: VoteResult): Promise<void> {
    const proposalData = result.executionData;
    if (!proposalData) return;

    try {
      switch (vote.proposalType) {
        case 'pot_distribution':
          await this.executePotDistribution(vote.groupId, proposalData);
          break;
        case 'rule_change':
          await this.executeRuleChange(vote.groupId, proposalData);
          break;
        case 'member_removal':
          await this.executeMemberRemoval(vote.groupId, proposalData);
          break;
      }

      // Notify group members of successful execution
      this.notificationService.notifyVoteEnded(vote);
    } catch (error) {
      console.error('Failed to execute proposal:', error);
      // Could implement retry logic or manual intervention here
    }
  }

  private async executePotDistribution(groupId: string, proposal: PotDistributionProposal): Promise<void> {
    // For pot distribution, we build the calldata for multisig execution
    // The actual execution would be done by the multisig wallet
    const group = this.db.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    // This would typically be handled by the frontend/multisig
    // We just validate the proposal and prepare the execution data
    console.log(`Pot distribution approved: ${proposal.amount} ETH to ${proposal.recipient}`);
  }

  private async executeRuleChange(groupId: string, proposal: RuleChangeProposal): Promise<void> {
    switch (proposal.action) {
      case 'add':
        if (proposal.ruleData) {
          await this.groupService.createRule({
            groupId,
            name: proposal.ruleData.name,
            description: proposal.ruleData.description,
            penaltyAmount: proposal.ruleData.penaltyAmount
          });
        }
        break;
      case 'remove':
        if (proposal.ruleId) {
          // Mark rule as inactive
          const stmt = this.db.prepare('UPDATE rules SET is_active = 0 WHERE id = ?');
          stmt.run(proposal.ruleId);
        }
        break;
      case 'update':
        if (proposal.ruleId && proposal.ruleData) {
          // Update existing rule
          const stmt = this.db.prepare(`
            UPDATE rules 
            SET name = ?, description = ?, penalty_amount = ?
            WHERE id = ?
          `);
          stmt.run(proposal.ruleData.name, proposal.ruleData.description, 
                   proposal.ruleData.penaltyAmount, proposal.ruleId);
        }
        break;
    }
  }

  private async executeMemberRemoval(groupId: string, proposal: MemberRemovalProposal): Promise<void> {
    // Mark member as inactive
    const stmt = this.db.prepare(`
      UPDATE members 
      SET is_active = 0 
      WHERE group_id = ? AND address = ?
    `);
    stmt.run(groupId, proposal.memberAddress);
  }

  async checkExpiredVotes(): Promise<void> {
    const allGroups = this.db.getAllGroups();
    for (const group of allGroups) {
      const activeVotes = this.db.getActiveVotes(group.id);
      for (const vote of activeVotes) {
        if (new Date(vote.expiresAt) < new Date()) {
          await this.processVoteResults(vote.id);
        }
      }
    }
  }

  async getVoteStatus(voteId: string): Promise<VoteResult> {
    const vote = this.db.getVoteById(voteId);
    if (!vote) {
      throw new Error('Vote not found');
    }

    const responses = this.db.getVoteResponses(voteId);
    return this.calculateVoteResult(vote, responses);
  }

  async getGroupVotes(groupId: string): Promise<{
    activeVotes: Vote[];
    recentResults: VoteResult[];
  }> {
    const activeVotes = this.db.getActiveVotes(groupId);
    
    // Get recent completed votes (this would need additional database queries)
    const recentResults: VoteResult[] = [];
    
    return {
      activeVotes,
      recentResults
    };
  }

  buildPotDistributionCalldata(groupId: string, proposal: PotDistributionProposal): any {
    const group = this.db.getGroup(groupId);
    if (!group) throw new Error('Group not found');

    return buildWithdrawPotCalldata(this.jarConfig, proposal.recipient as any, proposal.amount);
  }
}
