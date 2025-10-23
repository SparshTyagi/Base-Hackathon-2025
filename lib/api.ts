// API integration layer for connecting frontend to backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  [key: string]: any;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  contractAddress: string;
  creatorAddress: string;
  createdAt: string;
  isActive: boolean;
}

export interface Member {
  id: string;
  groupId: string;
  address: string;
  joinedAt: string;
  isActive: boolean;
  bondAmount: string;
}

export interface Rule {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  penaltyAmount: string;
  isActive: boolean;
  createdAt: string;
}

export interface Violation {
  id: string;
  groupId: string;
  memberAddress: string;
  ruleId: string;
  message: string;
  platform: string;
  detectedAt: string;
  penaltyApplied: boolean;
  txHash?: string;
}

export interface Vote {
  id: string;
  groupId: string;
  proposalType: 'pot_distribution' | 'rule_change' | 'member_removal';
  proposalData: string;
  proposerAddress: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'passed' | 'rejected' | 'expired';
}

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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Group Management
  async createGroup(data: {
    name: string;
    description?: string;
    contractAddress: string;
    creatorAddress: string;
  }): Promise<Group> {
    const response = await this.request<{ group: Group }>('/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.group;
  }

  async getGroup(groupId: string): Promise<{
    group: Group;
    members: Member[];
    rules: Rule[];
    recentViolations: Violation[];
  }> {
    const response = await this.request<{ dashboard: any }>(`/groups/${groupId}`);
    return response.dashboard;
  }

  async addMember(groupId: string, data: {
    address: string;
    bondAmount?: string;
  }): Promise<Member> {
    const response = await this.request<{ member: Member }>(`/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.member;
  }

  async createRule(groupId: string, data: {
    name: string;
    description?: string;
    penaltyAmount: string;
  }): Promise<Rule> {
    const response = await this.request<{ rule: Rule }>(`/groups/${groupId}/rules`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.rule;
  }

  // Violation Management
  async reportViolation(data: {
    groupId: string;
    memberAddress: string;
    ruleId: string;
    message: string;
    platform: string;
  }): Promise<Violation> {
    const response = await this.request<{ violation: Violation }>('/violations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.violation;
  }

  async applyPenalty(violationId: string, privateKey: string): Promise<{
    hash: string;
    block: number;
  }> {
    const response = await this.request<{ tx: any }>(`/violations/${violationId}/apply-penalty`, {
      method: 'POST',
      body: JSON.stringify({ privateKey }),
    });
    return response.tx;
  }

  // User Dashboard
  async getUserDashboard(userAddress: string): Promise<{
    groups: Group[];
    violations: Violation[];
    totalPenalties: string;
  }> {
    const response = await this.request<{ dashboard: any }>(`/users/${userAddress}/dashboard`);
    return response.dashboard;
  }

  // Voting System
  async createVote(groupId: string, data: {
    proposalType: string;
    proposalData: any;
    proposerAddress: string;
    expiresInHours?: number;
  }): Promise<Vote> {
    const response = await this.request<{ vote: Vote }>(`/groups/${groupId}/votes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.vote;
  }

  async createPotDistributionVote(groupId: string, data: {
    recipient: string;
    amount: string;
    reason?: string;
    proposerAddress: string;
    expiresInHours?: number;
  }): Promise<Vote> {
    const response = await this.request<{ vote: Vote }>(`/groups/${groupId}/votes/pot-distribution`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.vote;
  }

  async submitVote(voteId: string, data: {
    voterAddress: string;
    response: 'yes' | 'no';
  }): Promise<{
    voteResponse: any;
    voteResult: VoteResult;
  }> {
    const response = await this.request<{ voteResponse: any; voteResult: VoteResult }>(`/votes/${voteId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response;
  }

  async getVoteStatus(voteId: string): Promise<VoteResult> {
    const response = await this.request<{ voteResult: VoteResult }>(`/votes/${voteId}/status`);
    return response.voteResult;
  }

  async getGroupVotes(groupId: string): Promise<{
    activeVotes: Vote[];
    recentResults: VoteResult[];
  }> {
    const response = await this.request<{ votes: any }>(`/groups/${groupId}/votes`);
    return response.votes;
  }

  // Blockchain State
  async getUserState(userAddress: string): Promise<{
    bondWei: bigint;
    bondEth: string;
    potWei: bigint;
    potEth: string;
    nonce: number;
  }> {
    const response = await this.request<{ state: any }>(`/state?user=${userAddress}`);
    return response.state;
  }

  // Bond Management
  async depositBond(amountEth: string): Promise<{
    hash: string;
    block: number;
  }> {
    const response = await this.request<{ tx: any }>('/deposit', {
      method: 'POST',
      body: JSON.stringify({ amountEth }),
    });
    return response.tx;
  }

  async withdrawBond(amountEth: string): Promise<{
    hash: string;
    block: number;
  }> {
    const response = await this.request<{ tx: any }>('/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amountEth }),
    });
    return response.tx;
  }

  async buildPotWithdrawCalldata(data: {
    to: string;
    amountEth: string;
  }): Promise<{
    to: string;
    value: bigint;
    data: string;
    operation: number;
  }> {
    const response = await this.request<{ call: any }>('/build-withdraw', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.call;
  }
}

// WebSocket client for real-time updates
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor(private baseUrl: string = API_BASE_URL.replace('http', 'ws')) {
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(`${this.baseUrl}/ws`);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.notifyListeners(message.type, message.data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting...');
        setTimeout(() => this.connect(), 3000);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  subscribeToGroup(groupId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        groupId
      }));
    }
  }

  unsubscribeFromGroup(groupId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'unsubscribe',
        groupId
      }));
    }
  }

  addListener(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  removeListener(eventType: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private notifyListeners(eventType: string, data: any) {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instances
export const apiClient = new ApiClient();
export const wsClient = new WebSocketClient();

// Helper functions for frontend integration
export const mapFrontendToBackend = {
  // Convert frontend Piggybank to backend Group
  piggybankToGroup: (piggybank: any, creatorAddress: string): {
    name: string;
    description?: string;
    contractAddress: string;
    creatorAddress: string;
  } => ({
    name: piggybank.name,
    description: piggybank.theme,
    contractAddress: '0x0000000000000000000000000000000000000000', // Will be set when contract is deployed
    creatorAddress
  }),

  // Convert frontend Rule to backend Rule
  frontendRuleToBackend: (rule: any, groupId: string): {
    name: string;
    description?: string;
    penaltyAmount: string;
  } => ({
    name: rule.label,
    description: rule.type === 'CUSTOM' ? rule.config.description : undefined,
    penaltyAmount: rule.penaltyEth.toString()
  }),

  // Convert frontend Member to backend Member
  frontendMemberToBackend: (member: any, groupId: string, bondAmount: string = '0'): {
    address: string;
    bondAmount: string;
  } => ({
    address: member.address || '0x0000000000000000000000000000000000000000', // Will be set when wallet is connected
    bondAmount
  })
};
