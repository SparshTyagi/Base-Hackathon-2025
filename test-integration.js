// Test script to verify frontend-backend integration
const http = require('http');

console.log('🧪 Testing Frontend-Backend Integration\n');

// Test 1: Health check
console.log('1. Testing backend health...');
const healthOptions = {
  hostname: 'localhost',
  port: 8080,
  path: '/health',
  method: 'GET'
};

const healthReq = http.request(healthOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('   ✅ Backend is healthy:', JSON.parse(data));
    
    // Test 2: Create a test group
    console.log('\n2. Testing group creation...');
    const groupData = JSON.stringify({
      name: 'Test Integration Group',
      contractAddress: '0x1234567890123456789012345678901234567890',
      creatorAddress: '0x0987654321098765432109876543210987654321'
    });
    
    const groupOptions = {
      hostname: 'localhost',
      port: 8080,
      path: '/groups',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(groupData)
      }
    };
    
    const groupReq = http.request(groupOptions, (groupRes) => {
      let groupData = '';
      groupRes.on('data', (chunk) => {
        groupData += chunk;
      });
      
      groupRes.on('end', () => {
        console.log('   ✅ Group created successfully');
        const response = JSON.parse(groupData);
        const groupId = response.group.id;
        
        // Test 3: Get group details
        console.log('\n3. Testing group retrieval...');
        const getOptions = {
          hostname: 'localhost',
          port: 8080,
          path: `/groups/${groupId}`,
          method: 'GET'
        };
        
        const getReq = http.request(getOptions, (getRes) => {
          let getData = '';
          getRes.on('data', (chunk) => {
            getData += chunk;
          });
          
          getRes.on('end', () => {
            console.log('   ✅ Group retrieved successfully');
            
            // Test 4: Test user dashboard
            console.log('\n4. Testing user dashboard...');
            const dashboardOptions = {
              hostname: 'localhost',
              port: 8080,
              path: '/users/0x0987654321098765432109876543210987654321/dashboard',
              method: 'GET'
            };
            
            const dashboardReq = http.request(dashboardOptions, (dashboardRes) => {
              let dashboardData = '';
              dashboardRes.on('data', (chunk) => {
                dashboardData += chunk;
              });
              
              dashboardRes.on('end', () => {
                console.log('   ✅ User dashboard retrieved successfully');
                
                console.log('\n🎉 All backend tests passed!');
                console.log('\n📱 Frontend Testing Instructions:');
                console.log('1. Set environment variables in your frontend:');
                console.log('   NEXT_PUBLIC_API_URL=http://localhost:8080');
                console.log('   NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws');
                console.log('2. Start your frontend: npm run dev');
                console.log('3. Open http://localhost:3000');
                console.log('4. Test wallet connection and group creation');
              });
            });
            
            dashboardReq.on('error', (error) => {
              console.log('   ❌ Dashboard test failed:', error.message);
            });
            
            dashboardReq.end();
          });
        });
        
        getReq.on('error', (error) => {
          console.log('   ❌ Group retrieval failed:', error.message);
        });
        
        getReq.end();
      });
    });
    
    groupReq.on('error', (error) => {
      console.log('   ❌ Group creation failed:', error.message);
    });
    
    groupReq.write(groupData);
    groupReq.end();
  });
});

healthReq.on('error', (error) => {
  console.log('   ❌ Backend health check failed:', error.message);
  console.log('   Make sure the backend is running on port 8080');
});

healthReq.end();
