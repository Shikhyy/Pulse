require("dotenv").config()

const ARC_TESTNET_RPC = process.env.ARC_TESTNET_RPC || "https://rpc.testnet.arc.network"
const ARC_TESTNET_CHAIN_ID = 5042002

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arcTestnet: {
      url: ARC_TESTNET_RPC,
      chainId: ARC_TESTNET_CHAIN_ID,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    hardhat: {
      chainId: ARC_TESTNET_CHAIN_ID,
    },
  },
  paths: {
    sources: ".",
    tests: "test",
    cache: "cache",
    artifacts: "artifacts",
  },
  etherscan: {
    apiKey: {
      arcTestnet: "testnet",
    },
  },
}