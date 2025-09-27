// complete-testnet-setup.js
// Save this file and run: node complete-testnet-setup.js

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient } from "@mysten/sui/client";
import { Buffer } from "buffer";

// Your existing funded wallet recovery phrase
const existingMnemonic = "item resource oil weapon split suspect notable heart chimney domain domain state";

// Testnet client
const suiClient = new SuiClient({
  url: 'https://fullnode.testnet.sui.io:443'
});

async function getExistingWalletKey() {
  console.log("=" .repeat(60));
  console.log("CONVERTING YOUR FUNDED TESTNET WALLET");
  console.log("=" .repeat(60));
  
  try {
    // Convert your existing mnemonic to private key
    const keypair = Ed25519Keypair.deriveKeypair(existingMnemonic);
    const rawSecretKey = keypair.keypair.secretKey.slice(0, 32);
    const privateKeyBase64 = Buffer.from(rawSecretKey).toString("base64");
    const address = keypair.getPublicKey().toSuiAddress();
    
    console.log("Address:", address);
    console.log("Expected:", "0x56321cdb0c352da78dbe1e9725f9afc8622ef0c38c2be55ebde4edfb5bf60a0e");
    console.log("Match:", address === "0x56321cdb0c352da78dbe1e9725f9afc8622ef0c38c2be55ebde4edfb5bf60a0e" ? "✅ YES" : "❌ NO");
    
    // Check balance
    try {
      const balance = await suiClient.getBalance({ owner: address });
      const suiAmount = (parseInt(balance.totalBalance) / 1000000000).toFixed(4);
      console.log("Balance:", suiAmount, "SUI");
      
      if (parseInt(balance.totalBalance) > 0) {
        console.log("=" .repeat(60));
        console.log("SUCCESS! WALLET HAS TESTNET SUI");
        console.log("=" .repeat(60));
        console.log("COPY THIS TO YOUR .env FILE:");
        console.log(`VITE_PRIVATE_KEY="${privateKeyBase64}"`);
        console.log("=" .repeat(60));
        console.log("NEXT STEPS:");
        console.log("1. Copy the VITE_PRIVATE_KEY line above to your .env file");
        console.log("2. Make sure your .env also has your VITE_PACKAGE_ID");
        console.log("3. Restart your development server");
        console.log("4. Click 'Environment Wallet' in your app");
        console.log("5. Click 'Check Network & Balance' - should show", suiAmount, "SUI");
        console.log("6. Mint buttons should be green and ready!");
        console.log("=" .repeat(60));
        
        return { address, privateKey: privateKeyBase64, balance: suiAmount };
      } else {
        console.log("❌ No balance found. Need to fund this wallet.");
        return await createAndFundNewWallet();
      }
      
    } catch (balanceError) {
      console.log("Could not check balance:", balanceError.message);
      console.log("Proceeding with the private key anyway...");
      
      console.log("=" .repeat(60));
      console.log("COPY THIS TO YOUR .env FILE:");
      console.log(`VITE_PRIVATE_KEY="${privateKeyBase64}"`);
      console.log("=" .repeat(60));
      
      return { address, privateKey: privateKeyBase64, balance: "unknown" };
    }
    
  } catch (error) {
    console.error("Error processing existing wallet:", error);
    return await createAndFundNewWallet();
  }
}

async function createAndFundNewWallet() {
  console.log("=" .repeat(60));
  console.log("CREATING NEW TESTNET WALLET");
  console.log("=" .repeat(60));
  
  // Generate new wallet
  const keypair = Ed25519Keypair.generate();
  const rawSecretKey = keypair.keypair.secretKey.slice(0, 32);
  const privateKeyBase64 = Buffer.from(rawSecretKey).toString("base64");
  const address = keypair.getPublicKey().toSuiAddress();
  
  console.log("New Address:", address);
  console.log("Private Key:", privateKeyBase64);
  
  console.log("=" .repeat(60));
  console.log("FUND THIS NEW WALLET:");
  console.log("=" .repeat(60));
  console.log("Option 1 - Use Sui CLI:");
  console.log(`  sui client faucet --address ${address}`);
  console.log("");
  console.log("Option 2 - Alternative faucets:");
  console.log("  • https://stakely.io/faucet/sui-testnet-sui");
  console.log("  • https://faucet.n1stake.com/");
  console.log("  • Discord: https://discord.gg/sui (#testnet-faucet)");
  console.log("");
  console.log("Option 3 - Import to CLI and fund:");
  console.log(`  sui client import ${privateKeyBase64} ed25519`);
  console.log("  sui client faucet");
  console.log("=" .repeat(60));
  console.log("THEN ADD TO YOUR .env FILE:");
  console.log(`VITE_PRIVATE_KEY="${privateKeyBase64}"`);
  console.log("=" .repeat(60));
  
  return { address, privateKey: privateKeyBase64, balance: "0" };
}

async function verifyTestnetConnection() {
  try {
    const chainId = await suiClient.getChainIdentifier();
    console.log("✅ Connected to Sui Testnet");
    console.log("Chain ID:", chainId);
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to testnet:", error);
    return false;
  }
}

// Main execution
async function main() {
  console.log("TESTNET WALLET SETUP STARTING...");
  
  // First verify testnet connection
  const connected = await verifyTestnetConnection();
  if (!connected) {
    console.log("Cannot connect to testnet. Check your internet connection.");
    return;
  }
  
  // Try to use your existing funded wallet first
  const result = await getExistingWalletKey();
  
  console.log("Setup complete!");
  return result;
}

// Run it
main().catch(console.error);