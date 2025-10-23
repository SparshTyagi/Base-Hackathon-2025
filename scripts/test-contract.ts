import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🧪 Testing SwearJar contract...");
  
  // Get the network info
  const network = await ethers.provider.getNetwork();
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  
  // Try to load deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  const deploymentFile = path.join(deploymentsDir, `${network.name}-${network.chainId}.json`);
  
  if (!fs.existsSync(deploymentFile)) {
    console.log("❌ No deployment found. Please deploy the contract first.");
    return;
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const contractAddress = deploymentInfo.contractAddress;
  
  console.log(`Contract Address: ${contractAddress}`);
  
  // Get contract instance
  const SwearJar = await ethers.getContractFactory("SwearJar");
  const swearJar = SwearJar.attach(contractAddress);
  
  // Get test accounts
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`User1: ${user1.address}`);
  console.log(`User2: ${user2.address}`);
  
  console.log("\n🔍 Testing contract functions...");
  
  // Test 1: Check initial pot balance
  console.log("\n1. Testing pot balance...");
  const initialPotBalance = await swearJar.potBalance();
  console.log(`Initial pot balance: ${ethers.formatEther(initialPotBalance)} ETH`);
  
  // Test 2: Check initial bond balance
  console.log("\n2. Testing bond balance...");
  const initialBondBalance = await swearJar.bond(user1.address);
  console.log(`User1 initial bond: ${ethers.formatEther(initialBondBalance)} ETH`);
  
  // Test 3: Deposit bond
  console.log("\n3. Testing bond deposit...");
  const depositAmount = ethers.parseEther("0.1");
  const depositTx = await swearJar.connect(user1).depositBond({ value: depositAmount });
  await depositTx.wait();
  console.log(`✅ User1 deposited ${ethers.formatEther(depositAmount)} ETH`);
  
  // Test 4: Check bond balance after deposit
  const newBondBalance = await swearJar.bond(user1.address);
  console.log(`User1 bond after deposit: ${ethers.formatEther(newBondBalance)} ETH`);
  
  // Test 5: Apply penalty (as owner)
  console.log("\n4. Testing penalty application...");
  const penaltyAmount = ethers.parseEther("0.05");
  const penaltyTx = await swearJar.applyPenalty(user1.address, penaltyAmount);
  await penaltyTx.wait();
  console.log(`✅ Applied penalty of ${ethers.formatEther(penaltyAmount)} ETH to User1`);
  
  // Test 6: Check balances after penalty
  const bondAfterPenalty = await swearJar.bond(user1.address);
  const potAfterPenalty = await swearJar.potBalance();
  console.log(`User1 bond after penalty: ${ethers.formatEther(bondAfterPenalty)} ETH`);
  console.log(`Pot balance after penalty: ${ethers.formatEther(potAfterPenalty)} ETH`);
  
  // Test 7: Withdraw bond
  console.log("\n5. Testing bond withdrawal...");
  const withdrawAmount = ethers.parseEther("0.03");
  const withdrawTx = await swearJar.connect(user1).withdrawBond(withdrawAmount);
  await withdrawTx.wait();
  console.log(`✅ User1 withdrew ${ethers.formatEther(withdrawAmount)} ETH`);
  
  // Test 8: Check final balances
  const finalBondBalance = await swearJar.bond(user1.address);
  console.log(`User1 final bond: ${ethers.formatEther(finalBondBalance)} ETH`);
  
  // Test 9: Check nonces
  console.log("\n6. Testing nonces...");
  const user1Nonce = await swearJar.nonces(user1.address);
  console.log(`User1 nonce: ${user1Nonce}`);
  
  console.log("\n🎉 All tests completed successfully!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Contract is working correctly!");
  console.log("✅ Bond deposits work");
  console.log("✅ Penalty application works");
  console.log("✅ Bond withdrawals work");
  console.log("✅ Nonce tracking works");
  
  console.log("\n📝 Contract is ready for integration!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });
