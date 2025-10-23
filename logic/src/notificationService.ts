import { WebSocket } from 'ws';
import { Violation, Vote } from './database-simple.js';

export interface NotificationMessage {
  type: 'violation' | 'penalty_applied' | 'vote_created' | 'vote_ended' | 'member_joined' | 'vote_result';
  data: any;
  timestamp: string;
}

export class NotificationService {
  private clients: Map<string, WebSocket> = new Map();
  private groupSubscriptions: Map<string, Set<string>> = new Map(); // groupId -> Set<clientId>

  addClient(clientId: string, ws: WebSocket): void {
    this.clients.set(clientId, ws);
    
    ws.on('close', () => {
      this.removeClient(clientId);
    });
  }

  removeClient(clientId: string): void {
    this.clients.delete(clientId);
    
    // Remove from all group subscriptions
    for (const [groupId, subscribers] of this.groupSubscriptions.entries()) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.groupSubscriptions.delete(groupId);
      }
    }
  }

  subscribeToGroup(clientId: string, groupId: string): void {
    if (!this.groupSubscriptions.has(groupId)) {
      this.groupSubscriptions.set(groupId, new Set());
    }
    this.groupSubscriptions.get(groupId)!.add(clientId);
  }

  unsubscribeFromGroup(clientId: string, groupId: string): void {
    const subscribers = this.groupSubscriptions.get(groupId);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.groupSubscriptions.delete(groupId);
      }
    }
  }

  notifyViolation(violation: Violation): void {
    const message: NotificationMessage = {
      type: 'violation',
      data: violation,
      timestamp: new Date().toISOString()
    };

    this.broadcastToGroup(violation.groupId, message);
  }

  notifyPenaltyApplied(violation: Violation): void {
    const message: NotificationMessage = {
      type: 'penalty_applied',
      data: violation,
      timestamp: new Date().toISOString()
    };

    this.broadcastToGroup(violation.groupId, message);
  }

  notifyVoteCreated(vote: Vote): void {
    const message: NotificationMessage = {
      type: 'vote_created',
      data: vote,
      timestamp: new Date().toISOString()
    };

    this.broadcastToGroup(vote.groupId, message);
  }

  notifyMemberJoined(groupId: string, memberAddress: string): void {
    const message: NotificationMessage = {
      type: 'member_joined',
      data: { groupId, memberAddress },
      timestamp: new Date().toISOString()
    };

    this.broadcastToGroup(groupId, message);
  }

  notifyVoteEnded(vote: Vote): void {
    const message: NotificationMessage = {
      type: 'vote_ended',
      data: vote,
      timestamp: new Date().toISOString()
    };

    this.broadcastToGroup(vote.groupId, message);
  }

  notifyVoteResult(groupId: string, voteResult: any): void {
    const message: NotificationMessage = {
      type: 'vote_result',
      data: voteResult,
      timestamp: new Date().toISOString()
    };

    this.broadcastToGroup(groupId, message);
  }

  private broadcastToGroup(groupId: string, message: NotificationMessage): void {
    const subscribers = this.groupSubscriptions.get(groupId);
    if (!subscribers) return;

    const messageStr = JSON.stringify(message);
    
    for (const clientId of subscribers) {
      const ws = this.clients.get(clientId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
        } catch (error) {
          console.error(`Error sending message to client ${clientId}:`, error);
          this.removeClient(clientId);
        }
      }
    }
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  getGroupSubscribers(groupId: string): number {
    return this.groupSubscriptions.get(groupId)?.size || 0;
  }
}
