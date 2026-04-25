const { generateEntitySecret } = require('@circle-fin/developer-controlled-wallets');

const entitySecret = generateEntitySecret();
console.log('Generated Entity Secret:');
console.log(entitySecret);
console.log('\nLength:', entitySecret.length);
console.log('\nIMPORTANT: Save this entity secret and register it with Circle API!');

const apiKey = process.env.CIRCLE_API_KEY || process.argv[2];
if (!apiKey) {
  console.log('\nUsage: node scripts/generate-entity-secret.js <API_KEY>');
  process.exit(1);
}

const { CircleProgrammableWalletApi } = require('@circle-fin/developer-controlled-wallets');

async function registerSecret() {
  const circle = new CircleProgrammableWalletApi();
  await circle.setAuthDetails({ 
    apiKey: apiKey,
    baseUrl: 'https://api-beta.circle.com'
  });

  const result = await circle.registerEntitySecretCiphertext({
    entitySecret,
    blockchain: 'ARBC-SEPOLIA',
    accountType: 'EOA'
  });

  console.log('\nRegistration Result:');
  console.log(JSON.stringify(result.data, null, 2));
}

registerSecret().catch(console.error);