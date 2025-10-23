// Simple test script to verify the server is working
const http = require('http');

console.log('Testing backend server...');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    console.log('✅ Backend server is working!');
  });
});

req.on('error', (error) => {
  console.log('❌ Backend server is not running or not accessible');
  console.log('Error:', error.message);
  console.log('');
  console.log('To start the server:');
  console.log('1. cd logic');
  console.log('2. npm run build');
  console.log('3. npm start');
});

req.end();
