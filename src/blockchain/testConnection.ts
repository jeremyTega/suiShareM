import { client, activeAddress } from './suiClient';

async function testConnection() {
  try {
    const objects = await client.getOwnedObjects({ owner: activeAddress });
    console.log('✅ Wallet connection works!');
    console.log('Objects owned by this address:', objects);
  } catch (err) {
    console.error('❌ Error connecting to blockchain:', err);
  }
}

testConnection();
