// src/utils/walletAdapter.ts
export interface WalletAdapter {
  name: string;
  connect: () => Promise<string | null>;
  signAndExecute?: (tx: any) => Promise<any>;
}

// Detect installed wallets
export const getAvailableWallets = (): WalletAdapter[] => {
  const wallets: WalletAdapter[] = [];

  // Mysten Labs Official Sui Wallet
  if ((window as any).suiWallet) {
    wallets.push({
      name: "Sui Wallet",
      connect: async () => {
        const accounts = await (window as any).suiWallet.requestPermissions();
        return accounts[0]?.address || null;
      },
      signAndExecute: (tx: any) =>
        (window as any).suiWallet.signAndExecuteTransactionBlock(tx),
    });
  }

  // Suiet Wallet
  if ((window as any).suiet) {
    wallets.push({
      name: "Suiet",
      connect: async () => {
        const res = await (window as any).suiet.requestAccounts();
        return res?.[0]?.address || null;
      },
      signAndExecute: (tx: any) =>
        (window as any).suiet.signAndExecuteTransactionBlock(tx),
    });
  }

  // Slush Wallet
  if ((window as any).slush) {
    wallets.push({
      name: "Slush",
      connect: async () => {
        const res = await (window as any).slush.connect();
        return res?.account?.address || null;
      },
      signAndExecute: (tx: any) =>
        (window as any).slush.signAndExecuteTransactionBlock(tx),
    });
  }

  return wallets;
};
