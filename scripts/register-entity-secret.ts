/**
 * Register entity secret with Circle API
 */

import crypto from "node:crypto";
import {
  registerEntitySecretCiphertext,
  initiateDeveloperControlledWalletsClient,
} from "@circle-fin/developer-controlled-wallets";
import fs from "node:fs";
import path from "node:path";

const OUTPUT_DIR = path.join(__dirname, "output");

const entitySecret = '3bfb10d7e7d2fbffc9f6ac437ebb40b5046845d238cf0357190db310cc0a2743';

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY;
  
  if (!apiKey) {
    console.error('CIRCLE_API_KEY not set');
    process.exit(1);
  }

  console.log('Registering entity secret...');
  const result = await registerEntitySecretCiphertext({
    apiKey,
    entitySecret,
    recoveryFileDownloadPath: OUTPUT_DIR,
  });
  
  console.log('\n✓ Entity secret registered successfully!');
  console.log(JSON.stringify(result.data, null, 2));
}

main().catch(err => {
  console.error('Registration failed:', err.message);
  process.exit(1);
});