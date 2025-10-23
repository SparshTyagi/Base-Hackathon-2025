import { WebSocket } from 'ws';
import { Violation, Vote } from './database-simple.js';
export interface NotificationMessage {
    type: 'violation' | 'penalty_applied' | 'vote_created' | 'vote_ended' | 'member_joined' | 'vote_result';
    data: any;
    timestamp: string;
}
export declare class NotificationService {
    private clients;
    private groupSubscriptions;
    addClient(clientId: string, ws: WebSocket): void;
    removeClient(clientId: string): void;
    subscribeToGroup(clientId: string, groupId: string): void;
    unsubscribeFromGroup(clientId: string, groupId: string): void;
    notifyViolation(violation: Violation): void;
    notifyPenaltyApplied(violation: Violation): void;
    notifyVoteCreated(vote: Vote): void;
    notifyMemberJoined(groupId: string, memberAddress: string): void;
    notifyVoteEnded(vote: Vote): void;
    notifyVoteResult(groupId: string, voteResult: any): void;
    private broadcastToGroup;
    getConnectedClients(): number;
    getGroupSubscribers(groupId: string): number;
}
