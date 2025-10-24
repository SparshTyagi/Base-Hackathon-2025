import { SwearJarDatabase, Group, Member, Rule, Violation, Vote, VoteResponse } from './database-simple.js';
import { type JarConfig } from './jar.js';
import { z } from 'zod';
export declare const CreateGroupRequest: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    contractAddress: z.ZodString;
    creatorAddress: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    contractAddress: string;
    creatorAddress: string;
    description?: string | undefined;
}, {
    name: string;
    contractAddress: string;
    creatorAddress: string;
    description?: string | undefined;
}>;
export declare const AddMemberRequest: z.ZodObject<{
    groupId: z.ZodString;
    address: z.ZodString;
    bondAmount: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    groupId: string;
    address: string;
    bondAmount: string;
}, {
    groupId: string;
    address: string;
    bondAmount?: string | undefined;
}>;
export declare const CreateRuleRequest: z.ZodObject<{
    groupId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    penaltyAmount: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    groupId: string;
    penaltyAmount: string;
    description?: string | undefined;
}, {
    name: string;
    groupId: string;
    penaltyAmount: string;
    description?: string | undefined;
}>;
export declare const ReportViolationRequest: z.ZodObject<{
    groupId: z.ZodString;
    memberAddress: z.ZodString;
    ruleId: z.ZodString;
    message: z.ZodString;
    platform: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    groupId: string;
    memberAddress: string;
    ruleId: string;
    platform: string;
}, {
    message: string;
    groupId: string;
    memberAddress: string;
    ruleId: string;
    platform: string;
}>;
export type CreateGroupRequest = z.infer<typeof CreateGroupRequest>;
export type AddMemberRequest = z.infer<typeof AddMemberRequest>;
export type CreateRuleRequest = z.infer<typeof CreateRuleRequest>;
export type ReportViolationRequest = z.infer<typeof ReportViolationRequest>;
export declare class GroupService {
    private db;
    private jarConfig;
    constructor(db: SwearJarDatabase, jarConfig: JarConfig);
    createGroup(request: CreateGroupRequest): Promise<Group>;
    addMember(request: AddMemberRequest): Promise<Member>;
    createRule(request: CreateRuleRequest): Promise<Rule>;
    reportViolation(request: ReportViolationRequest): Promise<Violation>;
    applyPenalty(violationId: string, memberPrivateKey: string): Promise<{
        txHash: string;
        block: number;
    }>;
    getGroupDashboard(groupId: string): Promise<{
        group: Group;
        members: Member[];
        rules: Rule[];
        recentViolations: Violation[];
    }>;
    getUserDashboard(userAddress: string): Promise<{
        groups: Group[];
        violations: Violation[];
        totalPenalties: string;
    }>;
    private getViolationById;
    private getRuleById;
    private getRecentViolations;
    createVote(groupId: string, proposalType: string, proposalData: any, proposerAddress: string, expiresInHours?: number): Promise<Vote>;
    submitVote(voteId: string, voterAddress: string, response: 'yes' | 'no'): Promise<VoteResponse>;
    getAllGroups(): Promise<Group[]>;
}
