import React, { useState, useEffect } from "react";
import {
  useWallets,
  useCurrentWallet,
  useConnectWallet,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { getWeaponsForUser, mintWeapon } from "../blockchain/suiClient";
import WeaponList from "./WeaponList";
import "./Dashboard.css";

export default function Dashboard() {
  const wallets = useWallets();
  const { currentWallet, isConnected } = useCurrentWallet();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  const [manualAddress, setManualAddress] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [weapons, setWeapons] = useState<any[]>([]);
  const [loadingWeapons, setLoadingWeapons] = useState(false);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeAddress =
    currentWallet?.accounts[0]?.address || manualAddress || null;

  // Load weapons for activeAddress
  useEffect(() => {
    async function loadWeapons() {
      if (!activeAddress) {
        setWeapons([]);
        return;
      }
      setLoadingWeapons(true);
      setError(null);
      try {
        const fetched = await getWeaponsForUser(activeAddress);
        setWeapons(fetched);
      } catch (e: any) {
        setError("Failed to load weapons.");
      } finally {
        setLoadingWeapons(false);
      }
    }
    loadWeapons();
  }, [activeAddress]);

  const handleManualSubmit = () => {
    if (inputValue.trim()) {
      setManualAddress(inputValue.trim());
      setInputValue("");
    }
  };

  const handleMint = async () => {
    if (!activeAddress) return;
    setMinting(true);
    setError(null);
    try {
      await mintWeapon(activeAddress);
      // Refresh weapons list after mint
      const updated = await getWeaponsForUser(activeAddress);
      setWeapons(updated);
    } catch (e: any) {
      setError("Minting failed.");
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="dashboard">
      <h2>Sui Dashboard</h2>

      {wallets.length === 0 && !isConnected && !manualAddress && (
        <div>
          <p>No wallet extension detected. You can connect manually:</p>
          <input
            type="text"
            placeholder="Paste your Sui address"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button onClick={handleManualSubmit}>Connect Manually</button>
        </div>
      )}

      {!isConnected && !manualAddress && wallets.length > 0 && (
        <div>
          <h3>Available Wallets:</h3>
          <ul>
            {wallets.map((wallet) => (
              <li key={wallet.name}>
                {wallet.name}{" "}
                <button onClick={() => connect({ wallet })}>Connect</button>
              </li>
            ))}
          </ul>

          <h4>Or connect manually:</h4>
          <input
            type="text"
            placeholder="Paste your Sui address"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button onClick={handleManualSubmit}>Connect Manually</button>
        </div>
      )}

      {(isConnected || manualAddress) && (
        <div>
          <h3>Connected Address</h3>
          <p>Address: {activeAddress}</p>
          {isConnected && (
            <button onClick={() => disconnect()}>Disconnect Wallet</button>
          )}
          {manualAddress && !isConnected && (
            <button onClick={() => setManualAddress(null)}>Disconnect</button>
          )}

          <hr />

          {error && <p className="error">{error}</p>}

          <button
            className="shoot-btn"
            onClick={handleMint}
            disabled={minting || loadingWeapons}
          >
            {minting ? "Minting..." : "Mint Weapon"}
          </button>

          {loadingWeapons ? (
            <p>Loading weapons...</p>
          ) : (
            <WeaponList weapons={weapons} />
          )}
        </div>
      )}
    </div>
  );
}
