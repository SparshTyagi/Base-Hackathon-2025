import { WebSocket } from 'ws';
export class NotificationService {
    constructor() {
        this.clients = new Map();
        this.groupSubscriptions = new Map(); // groupId -> Set<clientId>
    }
    addClient(clientId, ws) {
        this.clients.set(clientId, ws);
        ws.on('close', () => {
            this.removeClient(clientId);
        });
    }
    removeClient(clientId) {
        this.clients.delete(clientId);
        // Remove from all group subscriptions
        for (const [groupId, subscribers] of this.groupSubscriptions.entries()) {
            subscribers.delete(clientId);
            if (subscribers.size === 0) {
                this.groupSubscriptions.delete(groupId);
            }
        }
    }
    subscribeToGroup(clientId, groupId) {
        if (!this.groupSubscriptions.has(groupId)) {
            this.groupSubscriptions.set(groupId, new Set());
        }
        this.groupSubscriptions.get(groupId).add(clientId);
    }
    unsubscribeFromGroup(clientId, groupId) {
        const subscribers = this.groupSubscriptions.get(groupId);
        if (subscribers) {
            subscribers.delete(clientId);
            if (subscribers.size === 0) {
                this.groupSubscriptions.delete(groupId);
            }
        }
    }
    notifyViolation(violation) {
        const message = {
            type: 'violation',
            data: violation,
            timestamp: new Date().toISOString()
        };
        this.broadcastToGroup(violation.groupId, message);
    }
    notifyPenaltyApplied(violation) {
        const message = {
            type: 'penalty_applied',
            data: violation,
            timestamp: new Date().toISOString()
        };
        this.broadcastToGroup(violation.groupId, message);
    }
    notifyVoteCreated(vote) {
        const message = {
            type: 'vote_created',
            data: vote,
            timestamp: new Date().toISOString()
        };
        this.broadcastToGroup(vote.groupId, message);
    }
    notifyMemberJoined(groupId, memberAddress) {
        const message = {
            type: 'member_joined',
            data: { groupId, memberAddress },
            timestamp: new Date().toISOString()
        };
        this.broadcastToGroup(groupId, message);
    }
    notifyVoteEnded(vote) {
        const message = {
            type: 'vote_ended',
            data: vote,
            timestamp: new Date().toISOString()
        };
        this.broadcastToGroup(vote.groupId, message);
    }
    notifyVoteResult(groupId, voteResult) {
        const message = {
            type: 'vote_result',
            data: voteResult,
            timestamp: new Date().toISOString()
        };
        this.broadcastToGroup(groupId, message);
    }
    broadcastToGroup(groupId, message) {
        const subscribers = this.groupSubscriptions.get(groupId);
        if (!subscribers)
            return;
        const messageStr = JSON.stringify(message);
        for (const clientId of subscribers) {
            const ws = this.clients.get(clientId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(messageStr);
                }
                catch (error) {
                    console.error(`Error sending message to client ${clientId}:`, error);
                    this.removeClient(clientId);
                }
            }
        }
    }
    getConnectedClients() {
        return this.clients.size;
    }
    getGroupSubscribers(groupId) {
        return this.groupSubscriptions.get(groupId)?.size || 0;
    }
}
