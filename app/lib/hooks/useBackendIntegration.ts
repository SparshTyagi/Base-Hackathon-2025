import { useState, useEffect } from 'react';

interface BackendIntegrationProps {
  userAddress?: string;
  groupId?: string;
}

export function useBackendIntegration({ userAddress, groupId }: BackendIntegrationProps) {
  const [connected, setConnected] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (userAddress && groupId) {
      const ws = new WebSocket(`ws://localhost:8080/ws`);
      
      ws.onopen = () => {
        setConnected(true);
        setWsConnection(ws);
      };
      
      ws.onclose = () => {
        setConnected(false);
        setWsConnection(null);
      };
      
      return () => {
        ws.close();
      };
    }
  }, [userAddress, groupId]);

  const createGroup = async (groupData: any) => {
    try {
      const response = await fetch('http://localhost:8080/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  };

  const getGroupDashboard = async (groupId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/groups/${groupId}/dashboard`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get group dashboard:', error);
      throw error;
    }
  };

  const reportViolation = async (violationData: any) => {
    try {
      const response = await fetch('http://localhost:8080/violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violationData),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to report violation:', error);
      throw error;
    }
  };

  return {
    connected,
    wsConnection,
    createGroup,
    getGroupDashboard,
    reportViolation,
  };
}
