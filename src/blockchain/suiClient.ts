// src/blockchain/suiClient.ts
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

// ====== ENV CONFIG ======
const privateKeyBase64 = import.meta.env.VITE_PRIVATE_KEY as string | undefined;
const envNetwork = (import.meta.env.VITE_NETWORK as string) || "testnet";
export const packageId = import.meta.env.VITE_PACKAGE_ID || "";

// ====== NETWORK ======
const validNetworks = ["mainnet", "testnet", "devnet", "localnet"];
export const network = validNetworks.includes(envNetwork) ? (envNetwork as any) : "testnet";
export const client = new SuiClient({ url: getFullnodeUrl(network) });

// ====== KEYPAIR LOADING ======
let keypair: Ed25519Keypair | null = null;
export let activeAddress: string | null = null;

if (privateKeyBase64) {
  try {
    const raw = atob(privateKeyBase64);
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    if (!(bytes.length === 32 || bytes.length === 64)) {
      throw new Error(`Decoded key has ${bytes.length} bytes, expected 32 or 64`);
    }
    keypair = Ed25519Keypair.fromSecretKey(bytes);
    activeAddress = keypair.getPublicKey().toSuiAddress();
    console.log("✅ Loaded keypair. Address:", activeAddress);
  } catch (e) {
    console.error("❌ Failed to decode VITE_PRIVATE_KEY:", e);
  }
} else {
  console.warn("⚠️ VITE_PRIVATE_KEY not set. Only wallet signing will work.");
}

// ====== SIGN + EXECUTE ======
export async function signAndExecute(tx: Transaction) {
  if (!keypair) {
    throw new Error("No local keypair. Either set VITE_PRIVATE_KEY or use wallet signing.");
  }
  return client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showObjectChanges: true },
  });
}
