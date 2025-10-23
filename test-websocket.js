#!/usr/bin/env node

/**
 * WebSocket testing script
 * Run with: node test-websocket.js
 */

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:8080/ws';

function testWebSocket() {
  console.log('🔌 Testing WebSocket Connection...\n');
  
  const ws = new WebSocket(WS_URL);
  
  ws.on('open', () => {
    console.log('✅ WebSocket connected successfully');
    
    // Test subscribing to a group
    const subscribeMessage = {
      type: 'subscribe',
      groupId: 'test-group-id'
    };
    
    console.log('📤 Sending subscribe message:', subscribeMessage);
    ws.send(JSON.stringify(subscribeMessage));
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📥 Received message:', message);
    } catch (error) {
      console.log('📥 Received raw message:', data.toString());
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 WebSocket closed - Code: ${code}, Reason: ${reason}`);
  });
  
  ws.on('error', (error) => {
    console.log('❌ WebSocket error:', error.message);
  });
  
  // Keep connection alive for testing
  setTimeout(() => {
    console.log('\n⏰ Test completed, closing connection...');
    ws.close();
  }, 5000);
}

// Check if WebSocket is available
try {
  require('ws');
  testWebSocket();
} catch (error) {
  console.log('❌ WebSocket library not found');
  console.log('   Install ws: npm install ws');
  console.log('   Or run: cd logic && npm install');
}
