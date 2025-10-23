const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying SwearJar contract...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Account balance: ${ethers.formatEther(balance)} ETH`);
  
  if (balance < ethers.parseEther("0.001")) {
    console.log("❌ Insufficient balance. Please add ETH to your account.");
    console.log("Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    return;
  }
  
  // Deploy the contract
  const SwearJar = await ethers.getContractFactory("SwearJar");
  const swearJar = await SwearJar.deploy();
  
  console.log("⏳ Waiting for deployment confirmation...");
  await swearJar.waitForDeployment();
  
  const address = await swearJar.getAddress();
  console.log("✅ SwearJar deployed to:", address);
  
  // Get deployment info
  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress: address,
    deployer: deployer.address,
    network: network.name,
    chainId: network.chainId,
    deploymentTime: new Date().toISOString(),
    transactionHash: swearJar.deploymentTransaction()?.hash,
  };
  
  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  // Save deployment info
  const deploymentFile = path.join(deploymentsDir, `${network.name}-${network.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("📄 Deployment info saved to:", deploymentFile);
  
  // Display important information
  console.log("\n🎉 Deployment completed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Contract Address: ${address}`);
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Transaction Hash: ${swearJar.deploymentTransaction()?.hash}`);
  
  if (network.chainId === 84532n) {
    console.log(`Explorer: https://sepolia.basescan.org/address/${address}`);
  } else if (network.chainId === 8453n) {
    console.log(`Explorer: https://basescan.org/address/${address}`);
  }
  
  console.log("\n📝 Next steps:");
  console.log("1. Update your backend config with the contract address");
  console.log("2. Update your frontend environment variables");
  console.log("3. Test the contract functionality");
  console.log("4. Verify the contract on BaseScan (optional)");
  
  // Update backend config automatically
  updateBackendConfig(address);
}

function updateBackendConfig(contractAddress) {
  console.log("\n🔧 Updating backend configuration...");
  
  try {
    const configPath = path.join(__dirname, "../logic/src/server.ts");
    if (fs.existsSync(configPath)) {
      let config = fs.readFileSync(configPath, "utf8");
      
      // Update contract address in config
      const configPattern = /contract:\s*"[^"]*"/;
      const newConfig = config.replace(configPattern, `contract: "${contractAddress}"`);
      
      fs.writeFileSync(configPath, newConfig);
      console.log("✅ Backend configuration updated");
    }
  } catch (error) {
    console.log("⚠️ Could not automatically update backend config");
    console.log(`Please manually update the contract address to: ${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
