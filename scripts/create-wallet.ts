/**
 * create-wallet.ts: Register entity secret first
 */

import crypto from "node:crypto";
import {
  registerEntitySecretCiphertext,
  initiateDeveloperControlledWalletsClient,
} from "@circle-fin/developer-controlled-wallets";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.join(__dirname, "output");

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY!;
  
  // Generate entity secret
  const entitySecret = crypto.randomBytes(32).toString("hex");
  
  console.log("🔐 Registering entity secret...");
  const result = await registerEntitySecretCiphertext({
    apiKey,
    entitySecret,
    recoveryFileDownloadPath: OUTPUT_DIR,
  });
  console.log("✅ Entity secret registered!");
  console.log("📝 Entity secret:", entitySecret);

  // Now create wallet
  console.log("\n💼 Initializing client...");
  const client = initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  });

  console.log("\n📁 Creating wallet set...");
  const walletSet = (await client.createWalletSet({ name: "Pulse Network" })).data?.walletSet;
  if (!walletSet?.id) throw new Error("Wallet set creation failed");
  console.log("✅ Wallet set ID:", walletSet.id);

  console.log("\n💼 Creating Wallet on ARC-TESTNET...");
  const wallet = (
    await client.createWallets({
      walletSetId: walletSet.id,
      blockchains: ["ARC-TESTNET"],
      count: 1,
      accountType: "EOA",
    })
  ).data?.wallets?.[0];
  if (!wallet) throw new Error("Wallet creation failed");
  console.log("✅ Wallet ID:", wallet.id);
  console.log("✅ Address:", wallet.address);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "wallet-info.json"),
    JSON.stringify({
      ...wallet,
      walletSetId: walletSet.id,
    }, null, 2)
  );
  
  // Save entity secret for later use
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "entity-secret.txt"),
    entitySecret
  );

  console.log("✅ Saved to output/");
  console.log("\n🎉 Wallet created!");
  console.log("Address:", wallet.address);
  console.log("Chain: ARC-TESTNET (5042002)");
  console.log("\n💰 Fund wallet at https://faucet.circle.com");
  console.log("\n📝 Save this entity secret:", entitySecret);
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});