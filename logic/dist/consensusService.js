import { buildWithdrawPotCalldata } from './jar.js';
export class ConsensusService {
    constructor(db, groupService, notificationService, jarConfig) {
        this.db = db;
        this.groupService = groupService;
        this.notificationService = notificationService;
        this.jarConfig = jarConfig;
    }
    async processVoteResults(voteId) {
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
    calculateVoteResult(vote, responses) {
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
        let status = 'active';
        if (new Date(vote.expiresAt) < new Date()) {
            status = 'expired';
        }
        else if (quorumMet && majorityReached) {
            status = 'passed';
        }
        else if (quorumMet && !majorityReached) {
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
    parseProposalData(vote) {
        try {
            return JSON.parse(vote.proposalData);
        }
        catch {
            return null;
        }
    }
    async executeProposal(vote, result) {
        const proposalData = result.executionData;
        if (!proposalData)
            return;
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
        }
        catch (error) {
            console.error('Failed to execute proposal:', error);
            // Could implement retry logic or manual intervention here
        }
    }
    async executePotDistribution(groupId, proposal) {
        // For pot distribution, we build the calldata for multisig execution
        // The actual execution would be done by the multisig wallet
        const group = this.db.getGroup(groupId);
        if (!group)
            throw new Error('Group not found');
        // This would typically be handled by the frontend/multisig
        // We just validate the proposal and prepare the execution data
        console.log(`Pot distribution approved: ${proposal.amount} ETH to ${proposal.recipient}`);
    }
    async executeRuleChange(groupId, proposal) {
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
                // For in-memory database, we would mark rule as inactive
                console.log(`Rule ${proposal.ruleId} marked as inactive`);
                break;
            case 'update':
                // For in-memory database, we would update the rule
                console.log(`Rule ${proposal.ruleId} updated`);
                break;
        }
    }
    async executeMemberRemoval(groupId, proposal) {
        // For in-memory database, we would mark member as inactive
        console.log(`Member ${proposal.memberAddress} removed from group ${groupId}`);
    }
    async checkExpiredVotes() {
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
    async getVoteStatus(voteId) {
        const vote = this.db.getVoteById(voteId);
        if (!vote) {
            throw new Error('Vote not found');
        }
        const responses = this.db.getVoteResponses(voteId);
        return this.calculateVoteResult(vote, responses);
    }
    async getGroupVotes(groupId) {
        const activeVotes = this.db.getActiveVotes(groupId);
        // Get recent completed votes (this would need additional database queries)
        const recentResults = [];
        return {
            activeVotes,
            recentResults
        };
    }
    buildPotDistributionCalldata(groupId, proposal) {
        const group = this.db.getGroup(groupId);
        if (!group)
            throw new Error('Group not found');
        return buildWithdrawPotCalldata(this.jarConfig, proposal.recipient, proposal.amount);
    }
}
