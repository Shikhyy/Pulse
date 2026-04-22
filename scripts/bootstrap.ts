import 'dotenv/config'

/**
 * Bootstrap Script
 * Provisions employer + 5 worker Circle wallets on Arc Testnet.
 * Run once before demo: node --env-file=.env --import=tsx scripts/bootstrap.ts
 */
async function bootstrap() {
  console.log('\n🔧 Pulse Bootstrap — Provisioning Circle Wallets\n')

  const isStubMode =
    !process.env.CIRCLE_API_KEY ||
    process.env.CIRCLE_API_KEY === 'your_api_key' ||
    process.env.STUB_MODE === 'true'

  if (isStubMode) {
    console.log('⚠️  Running in STUB MODE — no real Circle API calls\n')
    console.log(
      'To use real Circle wallets, set CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET in .env\n'
    )
    printStubResult()
    return
  }

  const { initiateDeveloperControlledWalletsClient } = await import(
    '@circle-fin/developer-controlled-wallets'
  )

  const client = initiateDeveloperControlledWalletsClient({
    apiKey: process.env.CIRCLE_API_KEY!,
    entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
  })

  // 1. Create employer wallet set
  console.log('1. Creating employer wallet set...')
  const wsRes = await client.createWalletSet({ name: 'pulse-employer' })
  const walletSetId = wsRes.data?.walletSet?.id
  console.log(`   ✓ Wallet Set ID: ${walletSetId}`)

  // 2. Create employer wallet on Arc Testnet
  console.log('2. Creating employer wallet on ARC-TESTNET...')
  const empRes = await client.createWallets({
    blockchains: ['ARC-TESTNET'],
    count: 1,
    walletSetId: walletSetId!,
  })
  const empWallet = empRes.data?.wallets?.[0]
  console.log(`   ✓ Employer Wallet ID:      ${empWallet?.id}`)
  console.log(`   ✓ Employer Wallet Address: ${empWallet?.address}`)

  // 3. Create worker wallet set
  console.log('3. Creating worker wallet set...')
  const wkWsRes = await client.createWalletSet({ name: 'pulse-workers' })
  const workerWalletSetId = wkWsRes.data?.walletSet?.id
  console.log(`   ✓ Worker Wallet Set ID: ${workerWalletSetId}`)

  // 4. Create 5 worker wallets
  console.log('4. Creating 5 worker wallets on ARC-TESTNET...')
  const workerRes = await client.createWallets({
    blockchains: ['ARC-TESTNET'],
    count: 5,
    walletSetId: workerWalletSetId!,
  })
  const workerWallets = workerRes.data?.wallets ?? []
  workerWallets.forEach((w, i) => {
    console.log(`   ✓ Worker ${i + 1}: ID=${w.id} | Address=${w.address}`)
  })

  // 5. Fund employer wallet via faucet
  console.log('\n5. Requesting USDC from Circle Testnet Faucet...')
  try {
    const faucetRes = await fetch('https://api.circle.com/v1/faucet/drip', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: empWallet?.address,
        blockchain: 'ARC-TESTNET',
        usdc: true,
      }),
    })
    const faucetData = await faucetRes.json()
    console.log(`   ✓ Faucet response:`, faucetData)
  } catch (err) {
    console.warn(`   ⚠️ Faucet failed — fund manually at https://faucet.circle.com`)
    console.warn(`   Address: ${empWallet?.address}`)
  }

  // 6. Print env vars to add to .env
  console.log('\n📋 Add these to your .env file:\n')
  const envLines = [
    `CIRCLE_EMPLOYER_WALLET_ID=${empWallet?.id}`,
    `CIRCLE_EMPLOYER_WALLET_ADDRESS=${empWallet?.address}`,
    `WORKER_WALLET_SET_ID=${workerWalletSetId}`,
    ...workerWallets.map((w, i) => [
      `WORKER_${i + 1}_WALLET_ID=${w.id}`,
      `WORKER_${i + 1}_WALLET_ADDRESS=${w.address}`,
    ]).flat(),
  ]
  console.log(envLines.join('\n'))
  console.log(
    '\n✅ Bootstrap complete! Fund the employer wallet, then run: npm run dev\n'
  )
}

function printStubResult() {
  console.log('📋 Stub .env values (pre-filled for demo):\n')
  console.log([
    'STUB_MODE=true',
    'CIRCLE_EMPLOYER_WALLET_ADDRESS=0xDEMO123456789abcdef',
    'WORKER_1_WALLET_ADDRESS=0xWorker1demo',
    'WORKER_2_WALLET_ADDRESS=0xWorker2demo',
    'WORKER_3_WALLET_ADDRESS=0xWorker3demo',
    'WORKER_4_WALLET_ADDRESS=0xWorker4demo',
    'WORKER_5_WALLET_ADDRESS=0xWorker5demo',
  ].join('\n'))
  console.log('\n✅ Stub bootstrap complete! Run: npm run dev\n')
}

bootstrap().catch(console.error)
