import { ethers } from "hardhat";

async function main() {
  console.log("Deploying ArcQRPayments to Arc Testnet...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "USDC");

  const ArcQRPaymentsFactory = await ethers.getContractFactory("ArcQRPayments");
  const arcQRPayments = await ArcQRPaymentsFactory.deploy();
  await arcQRPayments.waitForDeployment();

  const address = await arcQRPayments.getAddress();
  console.log("ArcQRPayments deployed to:", address);
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("\nUpdate your .env with:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
