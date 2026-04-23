const hre = require("hardhat")

async function main() {
  console.log("Deploying PulseComputeNetwork to Arc Testnet...")

  // USDC token address on Arc Testnet - https://docs.arc.network/arc/references/contract-addresses#usdc
  const USDC_ADDRESS = "0x3600000000000000000000000000000000000000"
  
  // Verify USDC is the native gas token on Arc
  console.log("USDC Address (Arc Testnet):", USDC_ADDRESS)
  console.log("Chain ID: 5042002 (Arc Testnet)")
  console.log("RPC: https://rpc.testnet.arc.network")
  
  const PulseNetwork = await hre.ethers.getContractFactory("PulseComputeNetwork")
  const contract = await PulseNetwork.deploy(USDC_ADDRESS)
  
  await contract.waitForDeployment()
  const address = await contract.getAddress()
  
  console.log("\n✅ PulseComputeNetwork deployed to:", address)
  console.log("\n📋 Verification command:")
  console.log(`npx hardhat verify --network arcTestnet ${address} ${USDC_ADDRESS}`)
  
  // Save deployment address to file for reference
  const fs = require("fs")
  const deploymentInfo = {
    network: "arc-testnet",
    contractAddress: address,
    usdcAddress: USDC_ADDRESS,
    deployer: (await hre.ethers.getSigners())[0]?.address,
    timestamp: new Date().toISOString(),
  }
  
  fs.writeFileSync(
    "./deployment.json",
    JSON.stringify(deploymentInfo, null, 2)
  )
  console.log("\n📄 Deployment info saved to deployment.json")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })