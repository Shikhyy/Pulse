/**
 * Test Circle transfer using raw API
 */

import axios from "axios";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

async function main() {
  const API_KEY = process.env.CIRCLE_API_KEY!;
  const ENTITY_SECRET = process.env.CIRCLE_ENTITY_SECRET!;

  console.log("Getting public key...");
  const pkResp = await axios.get("https://api.circle.com/v1/w3s/config/entity/publicKey", {
    headers: { "Authorization": "Bearer " + API_KEY },
  });

  const publicKey = pkResp.data.data.publicKey;
  console.log("Got public key");

  // Encrypt entity secret
  const entitySecretBytes = Buffer.from(ENTITY_SECRET, "hex");
  const publicKeyObj = crypto.createPublicKey(publicKey);
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyObj,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    entitySecretBytes
  );
  const entitySecretCiphertext = encrypted.toString("base64");

  console.log("Attempting transfer...");

  try {
    const txResp = await axios.post(
      "https://api.circle.com/v1/w3s/developer/transactions/transfer",
      {
        entitySecretCiphertext,
        walletId: process.env.CIRCLE_EMPLOYER_WALLET_ID,
        destinationAddress: process.env.CIRCLE_EMPLOYER_WALLET_ADDRESS,
        amounts: ["10000"], // 0.01 USDC
        tokenAddress: "0x3600000000000000000000000000000000000000",
        blockchain: "ARC-TESTNET",
        accountType: "EOA",
        idempotencyKey: uuidv4(), // Proper UUID format
        feeLevel: "LOW",
        gasLimit: "21000",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + API_KEY,
        },
      }
    );

    console.log("Success!");
    console.log(JSON.stringify(txResp.data, null, 2));
  } catch (err: any) {
    console.log("Error:", err.response?.data || err.message);
  }
}

main().catch(console.error);