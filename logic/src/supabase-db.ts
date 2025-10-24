import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Validation schemas
export const GroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  contract_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  creator_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  target_amount_eth: z.string().optional().nullable(),
  goal_description: z.string().optional().nullable(),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime().optional().nullable(),
  is_active: z.boolean().default(true)
});

export const MemberSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  farcaster_fid: z.string().optional().nullable(),
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  bond_amount_eth: z.string().default('0'),
  joined_at: z.string().datetime(),
  is_active: z.boolean().default(true)
});

export const RuleSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  rule_type: z.enum(['keyword', 'llm', 'post_quota']),
  rule_config: z.record(z.any()).optional().nullable(), // JSONB field
  penalty_eth: z.string(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime()
});

export const ViolationSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  member_fid: z.string().optional().nullable(),
  member_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  rule_id: z.string().uuid(),
  cast_hash: z.string().optional().nullable(),
  detected_at: z.string().datetime(),
  evidence: z.string(),
  penalty_applied: z.boolean().default(false),
  tx_hash: z.string().optional().nullable()
});

export const VoteSchema = z.object({
  id: z.string().uuid(),
  group_id: z.string().uuid(),
  violation_id: z.string().uuid().optional().nullable(),
  vote_type: z.enum(['penalty', 'payout', 'rule_change', 'member_removal']),
  proposal_data: z.string(), // JSON string
  proposer_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  created_at: z.string().datetime(),
  expires_at: z.string().datetime(),
  status: z.enum(['active', 'passed', 'rejected', 'expired'])
});

export const VoteResponseSchema = z.object({
  id: z.string().uuid(),
  vote_id: z.string().uuid(),
  voter_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  response: z.enum(['yes', 'no']),
  created_at: z.string().datetime()
});

export type Group = z.infer<typeof GroupSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Violation = z.infer<typeof ViolationSchema>;
export type Vote = z.infer<typeof VoteSchema>;
export type VoteResponse = z.infer<typeof VoteResponseSchema>;

export class SupabaseDatabase {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.SUPABASE_URL || 'https://tbpktrxyamdekglphmaj.supabase.co';
    const key = supabaseKey || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicGt0cnh5YW1kZWtnbHBobWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODE4OTQsImV4cCI6MjA3Njg1Nzg5NH0.bHabkk6dc5WVzQzXKRJ_yDTOzLSTCiansqiBXJGsmU4';
    
    this.supabase = createClient(url, key);
    console.log('Supabase database initialized');
  }

  // Group operations
  async createGroup(group: Omit<Group, 'created_at'>): Promise<Group> {
    const { data, error } = await this.supabase
      .from('groups')
      .insert({
        id: group.id,
        name: group.name,
        description: group.description || null,
        contract_address: group.contract_address,
        creator_address: group.creator_address,
        target_amount_eth: group.target_amount_eth || null,
        goal_description: group.goal_description || null,
        expires_at: group.expires_at || null,
        is_active: group.is_active
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create group: ${error.message}`);
    return GroupSchema.parse(data);
  }

  async getGroup(id: string): Promise<Group | null> {
    const { data, error } = await this.supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data ? GroupSchema.parse(data) : null;
  }

  async getGroupsByCreator(creatorAddress: string): Promise<Group[]> {
    const { data, error } = await this.supabase
      .from('groups')
      .select('*')
      .eq('creator_address', creatorAddress)
      .eq('is_active', true);

    if (error) throw new Error(`Failed to get groups: ${error.message}`);
    return data.map(g => GroupSchema.parse(g));
  }

  async getAllGroups(): Promise<Group[]> {
    const { data, error } = await this.supabase
      .from('groups')
      .select('*')
      .eq('is_active', true);

    if (error) throw new Error(`Failed to get all groups: ${error.message}`);
    return data.map(g => GroupSchema.parse(g));
  }

  // Member operations
  async addMember(member: Omit<Member, 'joined_at'>): Promise<Member> {
    const { data, error } = await this.supabase
      .from('members')
      .insert({
        id: member.id,
        group_id: member.group_id,
        farcaster_fid: member.farcaster_fid || null,
        wallet_address: member.wallet_address,
        bond_amount_eth: member.bond_amount_eth,
        is_active: member.is_active
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add member: ${error.message}`);
    return MemberSchema.parse(data);
  }

  async getGroupMembers(groupId: string): Promise<Member[]> {
    const { data, error } = await this.supabase
      .from('members')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true);

    if (error) throw new Error(`Failed to get members: ${error.message}`);
    return data.map(m => MemberSchema.parse(m));
  }

  async getMemberByAddress(groupId: string, address: string): Promise<Member | null> {
    const { data, error } = await this.supabase
      .from('members')
      .select('*')
      .eq('group_id', groupId)
      .eq('wallet_address', address)
      .single();

    if (error) return null;
    return data ? MemberSchema.parse(data) : null;
  }

  // Rule operations
  async createRule(rule: Omit<Rule, 'created_at'>): Promise<Rule> {
    const { data, error } = await this.supabase
      .from('rules')
      .insert({
        id: rule.id,
        group_id: rule.group_id,
        name: rule.name,
        description: rule.description || null,
        rule_type: rule.rule_type,
        rule_config: rule.rule_config || null,
        penalty_eth: rule.penalty_eth,
        is_active: rule.is_active
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create rule: ${error.message}`);
    return RuleSchema.parse(data);
  }

  async getGroupRules(groupId: string): Promise<Rule[]> {
    const { data, error } = await this.supabase
      .from('rules')
      .select('*')
      .eq('group_id', groupId)
      .eq('is_active', true);

    if (error) throw new Error(`Failed to get rules: ${error.message}`);
    return data.map(r => RuleSchema.parse(r));
  }

  async getRuleById(id: string): Promise<Rule | null> {
    const { data, error } = await this.supabase
      .from('rules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data ? RuleSchema.parse(data) : null;
  }

  // Violation operations
  async createViolation(violation: Omit<Violation, 'detected_at'>): Promise<Violation> {
    const { data, error } = await this.supabase
      .from('violations')
      .insert({
        id: violation.id,
        group_id: violation.group_id,
        member_fid: violation.member_fid || null,
        member_address: violation.member_address,
        rule_id: violation.rule_id,
        cast_hash: violation.cast_hash || null,
        evidence: violation.evidence,
        penalty_applied: violation.penalty_applied,
        tx_hash: violation.tx_hash || null
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create violation: ${error.message}`);
    return ViolationSchema.parse(data);
  }

  async getViolationById(id: string): Promise<Violation | null> {
    const { data, error } = await this.supabase
      .from('violations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data ? ViolationSchema.parse(data) : null;
  }

  async getMemberViolations(memberAddress: string, groupId?: string): Promise<Violation[]> {
    let query = this.supabase
      .from('violations')
      .select('*')
      .eq('member_address', memberAddress);

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Failed to get violations: ${error.message}`);
    return data.map(v => ViolationSchema.parse(v));
  }

  async getRecentViolations(groupId: string, limit: number): Promise<Violation[]> {
    const { data, error } = await this.supabase
      .from('violations')
      .select('*')
      .eq('group_id', groupId)
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`Failed to get violations: ${error.message}`);
    return data.map(v => ViolationSchema.parse(v));
  }

  async markViolationPenaltyApplied(violationId: string, txHash: string): Promise<void> {
    const { error } = await this.supabase
      .from('violations')
      .update({ penalty_applied: true, tx_hash: txHash })
      .eq('id', violationId);

    if (error) throw new Error(`Failed to update violation: ${error.message}`);
  }

  // Vote operations
  async createVote(vote: Omit<Vote, 'created_at'>): Promise<Vote> {
    const { data, error } = await this.supabase
      .from('votes')
      .insert({
        id: vote.id,
        group_id: vote.group_id,
        violation_id: vote.violation_id || null,
        vote_type: vote.vote_type,
        proposal_data: vote.proposal_data,
        proposer_address: vote.proposer_address,
        expires_at: vote.expires_at,
        status: vote.status
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create vote: ${error.message}`);
    return VoteSchema.parse(data);
  }

  async getVoteById(id: string): Promise<Vote | null> {
    const { data, error } = await this.supabase
      .from('votes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data ? VoteSchema.parse(data) : null;
  }

  async getActiveVotes(groupId: string): Promise<Vote[]> {
    const { data, error } = await this.supabase
      .from('votes')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'active');

    if (error) throw new Error(`Failed to get active votes: ${error.message}`);
    return data.map(v => VoteSchema.parse(v));
  }

  async updateVoteStatus(voteId: string, status: Vote['status']): Promise<void> {
    const { error } = await this.supabase
      .from('votes')
      .update({ status })
      .eq('id', voteId);

    if (error) throw new Error(`Failed to update vote status: ${error.message}`);
  }

  // Vote response operations
  async addVoteResponse(response: Omit<VoteResponse, 'created_at'>): Promise<VoteResponse> {
    const { data, error } = await this.supabase
      .from('vote_responses')
      .insert({
        id: response.id,
        vote_id: response.vote_id,
        voter_address: response.voter_address,
        response: response.response
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to add vote response: ${error.message}`);
    return VoteResponseSchema.parse(data);
  }

  async getVoteResponses(voteId: string): Promise<VoteResponse[]> {
    const { data, error } = await this.supabase
      .from('vote_responses')
      .select('*')
      .eq('vote_id', voteId);

    if (error) throw new Error(`Failed to get vote responses: ${error.message}`);
    return data.map(r => VoteResponseSchema.parse(r));
  }

  async hasUserVoted(voteId: string, voterAddress: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('vote_responses')
      .select('id')
      .eq('vote_id', voteId)
      .eq('voter_address', voterAddress)
      .single();

    return !!data;
  }
}
