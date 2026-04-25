/**
 * create-worker-wallet.ts: Create worker wallet
 */

import {
  initiateDeveloperControlledWalletsClient,
} from "@circle-fin/developer-controlled-wallets";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.join(__dirname, "output");

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY!;
  const entitySecret = "44f774ca4b2dd353a4796f85e90cf381";
  const walletSetId = "ff1d377b-d322-5b35-ac3f-9a7fba9275f8";
  
  console.log("🔐 Initializing client...");
  const client = initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  });

  // Use existing wallet set
  console.log("\n📁 Using wallet set:", walletSetId);

  // Create a worker wallet
  console.log("\n💼 Creating Worker Wallet on ARC-TESTNET...");
  const wallet = (
    await client.createWallets({
      walletSetId,
      blockchains: ["ARC-TESTNET"],
      count: 1,
      accountType: "EOA",
    })
  ).data?.wallets?.[0];
  if (!wallet) throw new Error("Wallet creation failed");
  console.log("✅ Worker Wallet ID:", wallet.id);
  console.log("✅ Worker Address:", wallet.address);
  console.log("✅ BlockChain:", wallet.blockchain);

  // Save
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const data = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, "wallet-info.json"), "utf-8"));
  data.workerWallet = wallet;
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "wallet-info.json"),
    JSON.stringify(data, null, 2)
  );

  console.log("\n🎉 Create worker at faucet: https://faucet.circle.com");
  console.log("Address:", wallet.address);
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});