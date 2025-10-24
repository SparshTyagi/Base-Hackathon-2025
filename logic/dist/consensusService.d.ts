import { SwearJarDatabase, Vote } from './database-simple.js';
import { GroupService } from './groupService.js';
import { NotificationService } from './notificationService.js';
import { type JarConfig } from './jar.js';
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
export declare class ConsensusService {
    private db;
    private groupService;
    private notificationService;
    private jarConfig;
    constructor(db: SwearJarDatabase, groupService: GroupService, notificationService: NotificationService, jarConfig: JarConfig);
    processVoteResults(voteId: string): Promise<VoteResult>;
    private calculateVoteResult;
    private parseProposalData;
    private executeProposal;
    private executePotDistribution;
    private executeRuleChange;
    private executeMemberRemoval;
    checkExpiredVotes(): Promise<void>;
    getVoteStatus(voteId: string): Promise<VoteResult>;
    getGroupVotes(groupId: string): Promise<{
        activeVotes: Vote[];
        recentResults: VoteResult[];
    }>;
    buildPotDistributionCalldata(groupId: string, proposal: PotDistributionProposal): any;
    initiateViolationVote(violationId: string, expiresInHours?: number): Promise<Vote>;
}
