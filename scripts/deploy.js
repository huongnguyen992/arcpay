const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 Deploying với địa chỉ:", deployer.address);

  const bal = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 USDC balance (gas):", hre.ethers.formatUnits(bal, 18));

  const Factory = await hre.ethers.getContractFactory("P2PPayment");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ P2PPayment deployed:", address);
  console.log("🔍 Explorer:", `https://testnet.arcscan.app/address/${address}`);

  // Tự động lưu địa chỉ vào frontend và backend
  const deployInfo = { address, network: "arc_testnet", chainId: 5042002 };

  const frontendPath = path.join(__dirname, "../frontend/src/contract.json");
  fs.writeFileSync(frontendPath, JSON.stringify(deployInfo, null, 2));
  console.log("📝 Đã lưu địa chỉ vào frontend/src/contract.json");

  const backendPath = path.join(__dirname, "../backend/src/contract.json");
  fs.writeFileSync(backendPath, JSON.stringify(deployInfo, null, 2));
  console.log("📝 Đã lưu địa chỉ vào backend/src/contract.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
