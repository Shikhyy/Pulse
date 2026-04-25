/**
 * create-worker-wallet.ts: Assign Circle wallets to workers
 */

import {
  initiateDeveloperControlledWalletsClient,
} from "@circle-fin/developer-controlled-wallets";
import db from './server/db'
import { users } from './server/db/schema'
import { eq } from 'drizzle-orm'

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY!
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET || '44f774ca4b2dd353a4796f85e90cf381'
  const walletSetId = process.env.WORKER_WALLET_SET_ID || 'ff1d377b-d322-5b35-ac3f-9a7fba9275f8'
  
  console.log('🔐 Initializing Circle client...')
  const client = initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  })

  // Get all workers without wallets
  const workers = db.select().from(users).where(eq(users.role, 'worker')).all()
  
  console.log(`\n📋 Found ${workers.length} workers`)
  
  for (const worker of workers) {
    if (worker.walletAddress && worker.walletAddress.startsWith('0x') && worker.walletAddress.length > 40) {
      console.log(`✅ ${worker.name} already has wallet: ${worker.walletAddress}`)
      continue
    }
    
    console.log(`\n🎁 Creating wallet for ${worker.name}...`)
    
    try {
      const wallet = (await client.createWallets({
        walletSetId,
        blockchains: ['ARC-TESTNET'],
        count: 1,
        accountType: 'EOA',
      })).data?.wallets?.[0]
      
      if (!wallet) {
        console.log('❌ Failed to create wallet')
        continue
      }
      
      console.log(`✅ Wallet created: ${wallet.address}`)
      
      // Update database
      db.update(users)
        .set({ walletAddress: wallet.address })
        .where(eq(users.id, worker.id))
        .run()
      
      console.log(`✅ Updated ${worker.name} in database`)
    } catch (err: any) {
      console.log(`❌ Error: ${err.message}`)
    }
  }
  
  console.log('\n✅ Done!')
}

main().catch(console.error)