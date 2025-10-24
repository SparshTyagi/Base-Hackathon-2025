-- Supabase Database Schema for Swear Jar Mini App
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    contract_address VARCHAR(42) NOT NULL,
    creator_address VARCHAR(42) NOT NULL,
    target_amount_eth DECIMAL(20, 18),
    goal_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT valid_contract_address CHECK (contract_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT valid_creator_address CHECK (creator_address ~ '^0x[a-fA-F0-9]{40}$')
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    farcaster_fid VARCHAR(20),
    wallet_address VARCHAR(42) NOT NULL,
    bond_amount_eth DECIMAL(20, 18) DEFAULT 0,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT valid_wallet_address CHECK (wallet_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT unique_member_per_group UNIQUE (group_id, wallet_address)
);

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    rule_config JSONB,
    penalty_eth DECIMAL(20, 18) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_rule_type CHECK (rule_type IN ('keyword', 'llm', 'post_quota'))
);

-- Violations table
CREATE TABLE IF NOT EXISTS violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    member_fid VARCHAR(20),
    member_address VARCHAR(42) NOT NULL,
    rule_id UUID NOT NULL REFERENCES rules(id) ON DELETE CASCADE,
    cast_hash VARCHAR(66),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    evidence TEXT NOT NULL,
    penalty_applied BOOLEAN DEFAULT FALSE,
    tx_hash VARCHAR(66),
    
    CONSTRAINT valid_member_address CHECK (member_address ~ '^0x[a-fA-F0-9]{40}$')
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    violation_id UUID REFERENCES violations(id) ON DELETE SET NULL,
    vote_type VARCHAR(20) NOT NULL,
    proposal_data TEXT NOT NULL,
    proposer_address VARCHAR(42) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    
    CONSTRAINT valid_vote_type CHECK (vote_type IN ('penalty', 'payout', 'rule_change', 'member_removal')),
    CONSTRAINT valid_status CHECK (status IN ('active', 'passed', 'rejected', 'expired')),
    CONSTRAINT valid_proposer_address CHECK (proposer_address ~ '^0x[a-fA-F0-9]{40}$')
);

-- Vote responses table
CREATE TABLE IF NOT EXISTS vote_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vote_id UUID NOT NULL REFERENCES votes(id) ON DELETE CASCADE,
    voter_address VARCHAR(42) NOT NULL,
    response VARCHAR(3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_response CHECK (response IN ('yes', 'no')),
    CONSTRAINT valid_voter_address CHECK (voter_address ~ '^0x[a-fA-F0-9]{40}$'),
    CONSTRAINT unique_vote_per_user UNIQUE (vote_id, voter_address)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_groups_creator ON groups(creator_address);
CREATE INDEX IF NOT EXISTS idx_groups_active ON groups(is_active);
CREATE INDEX IF NOT EXISTS idx_members_group ON members(group_id);
CREATE INDEX IF NOT EXISTS idx_members_address ON members(wallet_address);
CREATE INDEX IF NOT EXISTS idx_members_fid ON members(farcaster_fid);
CREATE INDEX IF NOT EXISTS idx_rules_group ON rules(group_id);
CREATE INDEX IF NOT EXISTS idx_violations_group ON violations(group_id);
CREATE INDEX IF NOT EXISTS idx_violations_member ON violations(member_address);
CREATE INDEX IF NOT EXISTS idx_violations_rule ON violations(rule_id);
CREATE INDEX IF NOT EXISTS idx_votes_group ON votes(group_id);
CREATE INDEX IF NOT EXISTS idx_votes_status ON votes(status);
CREATE INDEX IF NOT EXISTS idx_vote_responses_vote ON vote_responses(vote_id);
CREATE INDEX IF NOT EXISTS idx_vote_responses_voter ON vote_responses(voter_address);

-- Enable Row Level Security (RLS)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all operations for now - customize based on your security needs)
-- Groups: Anyone can read, only creator can modify
CREATE POLICY "Groups are viewable by everyone" ON groups FOR SELECT USING (true);
CREATE POLICY "Groups can be created by anyone" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Groups can be updated by creator" ON groups FOR UPDATE USING (true);

-- Members: Group members can view, creator can add
CREATE POLICY "Members are viewable by everyone" ON members FOR SELECT USING (true);
CREATE POLICY "Members can be added by anyone" ON members FOR INSERT WITH CHECK (true);

-- Rules: Group members can view, creator can modify
CREATE POLICY "Rules are viewable by everyone" ON rules FOR SELECT USING (true);
CREATE POLICY "Rules can be created by anyone" ON rules FOR INSERT WITH CHECK (true);

-- Violations: Group members can view and create
CREATE POLICY "Violations are viewable by everyone" ON violations FOR SELECT USING (true);
CREATE POLICY "Violations can be created by anyone" ON violations FOR INSERT WITH CHECK (true);
CREATE POLICY "Violations can be updated by anyone" ON violations FOR UPDATE USING (true);

-- Votes: Group members can view and vote
CREATE POLICY "Votes are viewable by everyone" ON votes FOR SELECT USING (true);
CREATE POLICY "Votes can be created by anyone" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Votes can be updated by anyone" ON votes FOR UPDATE USING (true);

-- Vote responses: Anyone can view and create
CREATE POLICY "Vote responses are viewable by everyone" ON vote_responses FOR SELECT USING (true);
CREATE POLICY "Vote responses can be created by anyone" ON vote_responses FOR INSERT WITH CHECK (true);

-- Triggers for updated_at timestamps (optional but recommended)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at columns if needed
-- ALTER TABLE groups ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
-- CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
