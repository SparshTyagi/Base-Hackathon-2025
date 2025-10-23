#!/usr/bin/env node

/**
 * Simple backend testing script
 * Run with: node test-backend.js
 */

const API_BASE = 'http://localhost:8080';

async function testEndpoint(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`✅ ${method} ${endpoint} - Status: ${response.status}`);
    return { success: true, data: result };
  } catch (error) {
    console.log(`❌ ${method} ${endpoint} - Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🧪 Testing Backend API...\n');
  
  // Test 1: Health Check
  console.log('1. Testing Health Check');
  const health = await testEndpoint('/health');
  if (health.success) {
    console.log('   Backend is running!');
    console.log(`   RPC URL: ${health.data.rpcUrl}`);
    console.log(`   Contract: ${health.data.contract}`);
    console.log(`   Connected Clients: ${health.data.connectedClients}`);
  }
  
  // Test 2: Create Test Group
  console.log('\n2. Testing Group Creation');
  const testGroup = {
    name: 'Test Group',
    description: 'Created by test script',
    contractAddress: '0x1234567890123456789012345678901234567890',
    creatorAddress: '0x0987654321098765432109876543210987654321'
  };
  
  const groupResult = await testEndpoint('/groups', 'POST', testGroup);
  if (groupResult.success) {
    console.log(`   Group created with ID: ${groupResult.data.group.id}`);
    
    const groupId = groupResult.data.group.id;
    
    // Test 3: Get Group
    console.log('\n3. Testing Group Retrieval');
    await testEndpoint(`/groups/${groupId}`);
    
    // Test 4: Add Member
    console.log('\n4. Testing Member Addition');
    const memberData = {
      address: '0x1111111111111111111111111111111111111111',
      bondAmount: '0.01'
    };
    await testEndpoint(`/groups/${groupId}/members`, 'POST', memberData);
    
    // Test 5: Create Rule
    console.log('\n5. Testing Rule Creation');
    const ruleData = {
      name: 'No Swearing',
      description: 'Penalty for using swear words',
      penaltyAmount: '0.005'
    };
    const ruleResult = await testEndpoint(`/groups/${groupId}/rules`, 'POST', ruleData);
    
    if (ruleResult.success) {
      const ruleId = ruleResult.data.rule.id;
      
      // Test 6: Report Violation
      console.log('\n6. Testing Violation Reporting');
      const violationData = {
        groupId,
        memberAddress: '0x1111111111111111111111111111111111111111',
        ruleId,
        message: 'Test violation message',
        platform: 'discord'
      };
      await testEndpoint('/violations', 'POST', violationData);
    }
    
    // Test 7: Create Vote
    console.log('\n7. Testing Vote Creation');
    const voteData = {
      recipient: '0x2222222222222222222222222222222222222222',
      amount: '0.1',
      reason: 'Test pot distribution',
      proposerAddress: '0x0987654321098765432109876543210987654321',
      expiresInHours: 24
    };
    const voteResult = await testEndpoint(`/groups/${groupId}/votes/pot-distribution`, 'POST', voteData);
    
    if (voteResult.success) {
      const voteId = voteResult.data.vote.id;
      
      // Test 8: Submit Vote
      console.log('\n8. Testing Vote Submission');
      const voteSubmission = {
        voterAddress: '0x1111111111111111111111111111111111111111',
        response: 'yes'
      };
      await testEndpoint(`/votes/${voteId}/submit`, 'POST', voteSubmission);
    }
  }
  
  // Test 9: User Dashboard
  console.log('\n9. Testing User Dashboard');
  await testEndpoint('/users/0x0987654321098765432109876543210987654321/dashboard');
  
  // Test 10: Blockchain State
  console.log('\n10. Testing Blockchain State');
  await testEndpoint('/state?user=0x0987654321098765432109876543210987654321');
  
  console.log('\n🎉 Backend testing complete!');
  console.log('\nNext steps:');
  console.log('1. Update your Vercel environment variables');
  console.log('2. Test the frontend integration');
  console.log('3. Check real-time WebSocket functionality');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or a fetch polyfill');
  console.log('   Install node-fetch: npm install node-fetch');
  console.log('   Or use Node.js 18+');
  process.exit(1);
}

// Run the tests
runTests().catch(console.error);
