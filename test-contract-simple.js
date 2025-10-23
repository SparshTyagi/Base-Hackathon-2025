const { ethers } = require("ethers");

async function testContract() {
  console.log("🧪 Testing deployed contract...");
  
  // Contract details
  const contractAddress = "0x73183E071A52C76921CcAfB037400BeC1f635E4B";
  const rpcUrl = "https://sepolia.base.org";
  const userAddress = "0x4BC146E7e24554e5Cea5c4d15Cb0aEA26D5F43A3";
  
  // Contract ABI (simplified)
  const abi = [
    "function getBond(address user) external view returns (uint256)",
    "function getPotBalance() external view returns (uint256)",
    "function getNonce(address user) external view returns (uint256)"
  ];
  
  try {
    // Create provider and contract
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, abi, provider);
    
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`User Address: ${userAddress}`);
    
    // Test contract functions
    console.log("\n🔍 Testing contract functions...");
    
    // Test 1: Get pot balance
    const potBalance = await contract.getPotBalance();
    console.log(`✅ Pot Balance: ${ethers.formatEther(potBalance)} ETH`);
    
    // Test 2: Get user bond
    const userBond = await contract.getBond(userAddress);
    console.log(`✅ User Bond: ${ethers.formatEther(userBond)} ETH`);
    
    // Test 3: Get user nonce
    const userNonce = await contract.getNonce(userAddress);
    console.log(`✅ User Nonce: ${userNonce}`);
    
    console.log("\n🎉 Contract is working correctly!");
    console.log("✅ All functions are accessible");
    console.log("✅ Contract is deployed and responding");
    
  } catch (error) {
    console.log("❌ Contract test failed:", error.message);
  }
}

testContract();
