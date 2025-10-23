import { useState, useEffect, useCallback } from 'react';
import { apiClient, wsClient, mapFrontendToBackend } from '../api';
import { Piggybank, Member, Rule, Infraction } from '../types';

interface UseBackendIntegrationProps {
  userAddress?: string;
  groupId?: string;
}

export const useBackendIntegration = ({ userAddress, groupId }: UseBackendIntegrationProps = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  // Initialize WebSocket connection
  useEffect(() => {
    if (groupId) {
      wsClient.subscribeToGroup(groupId);
    }

    return () => {
      if (groupId) {
        wsClient.unsubscribeFromGroup(groupId);
      }
    };
  }, [groupId]);

  // Create group from frontend piggybank
  const createGroup = useCallback(async (piggybank: Piggybank, creatorAddress: string) => {
    if (!userAddress) throw new Error('User address required');
    
    setLoading(true);
    setError(null);
    
    try {
      const groupData = mapFrontendToBackend.piggybankToGroup(piggybank, creatorAddress);
      const group = await apiClient.createGroup(groupData);

      // Add members
      for (const member of piggybank.members) {
        if (member.address) {
          await apiClient.addMember(group.id, mapFrontendToBackend.frontendMemberToBackend(member, group.id, piggybank.entryStakeEth.toString()));
        }
      }

      // Add rules
      for (const rule of piggybank.rules) {
        await apiClient.createRule(group.id, mapFrontendToBackend.frontendRuleToBackend(rule, group.id));
      }

      return group;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  // Report violation (for AI agent integration)
  const reportViolation = useCallback(async (violation: {
    groupId: string;
    memberAddress: string;
    ruleId: string;
    message: string;
    platform: string;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiClient.reportViolation(violation);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to report violation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Apply penalty
  const applyPenalty = useCallback(async (violationId: string, privateKey: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiClient.applyPenalty(violationId, privateKey);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply penalty';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get group dashboard
  const getGroupDashboard = useCallback(async (groupId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiClient.getGroup(groupId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get group dashboard';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user dashboard
  const getUserDashboard = useCallback(async (userAddress: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiClient.getUserDashboard(userAddress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user dashboard';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create pot distribution vote
  const createPotDistributionVote = useCallback(async (groupId: string, data: {
    recipient: string;
    amount: string;
    reason?: string;
    proposerAddress: string;
    expiresInHours?: number;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiClient.createPotDistributionVote(groupId, data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create vote';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit vote
  const submitVote = useCallback(async (voteId: string, voterAddress: string, response: 'yes' | 'no') => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiClient.submitVote(voteId, { voterAddress, response });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get vote status
  const getVoteStatus = useCallback(async (voteId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiClient.getVoteStatus(voteId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get vote status';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get user blockchain state
  const getUserState = useCallback(async (userAddress: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiClient.getUserState(userAddress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get user state';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Bond management
  const depositBond = useCallback(async (amountEth: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiClient.depositBond(amountEth);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deposit bond';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const withdrawBond = useCallback(async (amountEth: string) => {
    setLoading(true);
    setError(null);
    
    try {
      return await apiClient.withdrawBond(amountEth);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw bond';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket event listeners
  const addWebSocketListener = useCallback((eventType: string, callback: (data: any) => void) => {
    wsClient.addListener(eventType, callback);
  }, []);

  const removeWebSocketListener = useCallback((eventType: string, callback: (data: any) => void) => {
    wsClient.removeListener(eventType, callback);
  }, []);

  return {
    loading,
    error,
    connected,
    setConnected,
    createGroup,
    reportViolation,
    applyPenalty,
    getGroupDashboard,
    getUserDashboard,
    createPotDistributionVote,
    submitVote,
    getVoteStatus,
    getUserState,
    depositBond,
    withdrawBond,
    addWebSocketListener,
    removeWebSocketListener,
    clearError: () => setError(null)
  };
};
