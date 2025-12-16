/**
 * Script to completely disable automatic entitlement creation
 * and clear all existing entitlements from the database
 * 
 * Run this script with: npx ts-node src/scripts/disable-auto-entitlements.ts
 */

import { MongoClient } from 'mongodb';
import * as readline from 'readline';

const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://omarhossam:0FWFxI68ZFlXHXoy@cluster0.ibw0sw5.mongodb.net/leaves_subsystem?appName=Cluster0';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function main() {
  console.log('='.repeat(70));
  console.log('DISABLE AUTOMATIC ENTITLEMENT CREATION');
  console.log('='.repeat(70));
  console.log();
  
  console.log('⚠️  WARNING: This script will:');
  console.log('  1. Delete ALL existing leave entitlements from the database');
  console.log('  2. You will need to manually recreate entitlements using the');
  console.log('     "Add Entitlement (with Eligibility)" button');
  console.log();
  
  const confirm = await question('Are you sure you want to continue? (yes/no): ');
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log('Operation cancelled.');
    rl.close();
    return;
  }
  
  console.log();
  console.log('Connecting to MongoDB...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Count existing entitlements
    const count = await db.collection('leaveentitlements').countDocuments();
    console.log(`📊 Found ${count} existing entitlements`);
    
    if (count > 0) {
      const deleteConfirm = await question(`Delete all ${count} entitlements? (yes/no): `);
      
      if (deleteConfirm.toLowerCase() === 'yes') {
        console.log('Deleting entitlements...');
        const result = await db.collection('leaveentitlements').deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} entitlements`);
      } else {
        console.log('Skipped deletion.');
      }
    }
    
    console.log();
    console.log('='.repeat(70));
    console.log('✅ DONE!');
    console.log('='.repeat(70));
    console.log();
    console.log('IMPORTANT NEXT STEPS:');
    console.log('1. Make sure AUTOMATIC_ENTITLEMENT_ENABLED=false in backend/.env');
    console.log('2. RESTART the backend server: npm run start');
    console.log('3. Use "Add Entitlement (with Eligibility)" button to create entitlements');
    console.log();
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    rl.close();
  }
}

main().catch(console.error);
