import { z } from 'zod';
export declare const GroupSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    contractAddress: z.ZodString;
    creatorAddress: z.ZodString;
    createdAt: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    contractAddress: string;
    creatorAddress: string;
    createdAt: string;
    isActive: boolean;
    description?: string | undefined;
}, {
    id: string;
    name: string;
    contractAddress: string;
    creatorAddress: string;
    createdAt: string;
    description?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const MemberSchema: z.ZodObject<{
    id: z.ZodString;
    groupId: z.ZodString;
    address: z.ZodString;
    joinedAt: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    bondAmount: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    isActive: boolean;
    groupId: string;
    address: string;
    joinedAt: string;
    bondAmount: string;
}, {
    id: string;
    groupId: string;
    address: string;
    joinedAt: string;
    isActive?: boolean | undefined;
    bondAmount?: string | undefined;
}>;
export declare const RuleSchema: z.ZodObject<{
    id: z.ZodString;
    groupId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    penaltyAmount: z.ZodString;
    isActive: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: string;
    isActive: boolean;
    groupId: string;
    penaltyAmount: string;
    description?: string | undefined;
}, {
    id: string;
    name: string;
    createdAt: string;
    groupId: string;
    penaltyAmount: string;
    description?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const ViolationSchema: z.ZodObject<{
    id: z.ZodString;
    groupId: z.ZodString;
    memberAddress: z.ZodString;
    ruleId: z.ZodString;
    message: z.ZodString;
    platform: z.ZodString;
    detectedAt: z.ZodString;
    penaltyApplied: z.ZodDefault<z.ZodBoolean>;
    txHash: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    message: string;
    groupId: string;
    memberAddress: string;
    ruleId: string;
    platform: string;
    detectedAt: string;
    penaltyApplied: boolean;
    txHash?: string | undefined;
}, {
    id: string;
    message: string;
    groupId: string;
    memberAddress: string;
    ruleId: string;
    platform: string;
    detectedAt: string;
    penaltyApplied?: boolean | undefined;
    txHash?: string | undefined;
}>;
export declare const VoteSchema: z.ZodObject<{
    id: z.ZodString;
    groupId: z.ZodString;
    proposalType: z.ZodEnum<["pot_distribution", "rule_change", "member_removal"]>;
    proposalData: z.ZodString;
    proposerAddress: z.ZodString;
    createdAt: z.ZodString;
    expiresAt: z.ZodString;
    status: z.ZodEnum<["active", "passed", "rejected", "expired"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    status: "active" | "passed" | "rejected" | "expired";
    groupId: string;
    proposalType: "pot_distribution" | "rule_change" | "member_removal";
    proposalData: string;
    proposerAddress: string;
    expiresAt: string;
}, {
    id: string;
    createdAt: string;
    status: "active" | "passed" | "rejected" | "expired";
    groupId: string;
    proposalType: "pot_distribution" | "rule_change" | "member_removal";
    proposalData: string;
    proposerAddress: string;
    expiresAt: string;
}>;
export declare const VoteResponseSchema: z.ZodObject<{
    id: z.ZodString;
    voteId: z.ZodString;
    voterAddress: z.ZodString;
    response: z.ZodEnum<["yes", "no"]>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    voteId: string;
    voterAddress: string;
    response: "yes" | "no";
}, {
    id: string;
    createdAt: string;
    voteId: string;
    voterAddress: string;
    response: "yes" | "no";
}>;
export type Group = z.infer<typeof GroupSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Violation = z.infer<typeof ViolationSchema>;
export type Vote = z.infer<typeof VoteSchema>;
export type VoteResponse = z.infer<typeof VoteResponseSchema>;
export declare class SwearJarDatabase {
    private groups;
    private members;
    private rules;
    private violations;
    private votes;
    private voteResponses;
    constructor(dbPath?: string);
    createGroup(group: Group): void;
    getGroup(id: string): Group | null;
    getGroupsByCreator(creatorAddress: string): Group[];
    getAllGroups(): Group[];
    addMember(member: Member): void;
    getGroupMembers(groupId: string): Member[];
    createRule(rule: Rule): void;
    getGroupRules(groupId: string): Rule[];
    createViolation(violation: Violation): void;
    getMemberViolations(memberAddress: string, groupId?: string): Violation[];
    markViolationPenaltyApplied(violationId: string, txHash: string): void;
    getViolationById(id: string): Violation | null;
    getRuleById(id: string): Rule | null;
    getRecentViolations(groupId: string, limit?: number): Violation[];
    createVote(vote: Vote): void;
    submitVoteResponse(voteResponse: VoteResponse): void;
    getVoteById(id: string): Vote | null;
    getVoteResponses(voteId: string): VoteResponse[];
    updateVoteStatus(voteId: string, status: 'active' | 'passed' | 'rejected' | 'expired'): void;
    getActiveVotes(groupId: string): Vote[];
    close(): void;
}
