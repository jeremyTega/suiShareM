// src/components/Header.tsx
import React, { useState } from "react";
import "./Header.css";

interface HeaderProps {
  onRequestWeapon: () => void;
  onSeeRequests: () => void;
  manualAddress: string | null;
  setManualAddress: (address: string | null) => void;
  currentAddress: string | null;
  activeAddress: string | null;
  balance: string;
  requestsCount?: number;
}

const Header: React.FC<HeaderProps> = ({
  onRequestWeapon,
  onSeeRequests,
  manualAddress,
  setManualAddress,
  currentAddress,
  activeAddress,
  balance,
  requestsCount = 0,
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [tempAddress, setTempAddress] = useState("");

  const handleSetAddress = () => {
    if (!tempAddress.trim()) {
      alert("Please enter a valid wallet address");
      return;
    }

    if (!tempAddress.startsWith("0x") || tempAddress.length < 42) {
      alert("Please enter a valid Sui wallet address (starts with 0x)");
      return;
    }

    setManualAddress(tempAddress.trim());
    setTempAddress("");
    setShowProfile(false);
  };

  const useEnvironmentWallet = () => {
    setManualAddress(null);
    setShowProfile(false);
  };

  const getWalletDisplay = () => {
    if (!currentAddress) return { type: "No Wallet", address: "Not Connected", color: "#666" };
    
    if (currentAddress === activeAddress) {
      return { type: "Environment", address: currentAddress, color: "#4caf50" };
    } else {
      return { type: "Manual", address: currentAddress, color: "#ff9800" };
    }
  };

  const walletInfo = getWalletDisplay();

  return (
    <header className="app-header">
      <div className="logo">SuiShare Weapons</div>
      
      <div className="header-actions">
        {/* Request Weapon Button */}
        <button 
          className="nav-btn" 
          onClick={onRequestWeapon}
          style={{
            backgroundColor: currentAddress ? "#4caf50" : "#666",
            cursor: currentAddress ? "pointer" : "not-allowed",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            color: "white"
          }}
          disabled={!currentAddress}
        >
          Request Weapon
        </button>

        {/* See Requests Button with Notification Badge */}
        <button 
          className="nav-btn" 
          onClick={onSeeRequests}
          style={{
            backgroundColor: currentAddress ? "#2196f3" : "#666",
            cursor: currentAddress ? "pointer" : "not-allowed",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            color: "white",
            position: "relative"
          }}
          disabled={!currentAddress}
        >
          See Requests
          {requestsCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-8px",
              right: "-8px",
              backgroundColor: "#ff4444",
              color: "white",
              borderRadius: "50%",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: "bold",
              border: "2px solid white"
            }}>
              {requestsCount > 9 ? '9+' : requestsCount}
            </span>
          )}
        </button>

        {/* Wallet Info Display */}
        <div 
          className="wallet-address" 
          style={{ 
            backgroundColor: walletInfo.color,
            padding: "8px 12px",
            borderRadius: "4px",
            color: "white",
            fontSize: "14px"
          }}
        >
          <div style={{ fontSize: "11px", opacity: 0.9 }}>
            {walletInfo.type} {currentAddress && `(${balance} SUI)`}
          </div>
          <div style={{ fontWeight: "bold", fontSize: "12px" }}>
            {currentAddress ? `${currentAddress.slice(0, 6)}...${currentAddress.slice(-4)}` : "Not Connected"}
          </div>
        </div>

        {/* Profile Dropdown */}
        <div style={{ position: "relative" }}>
          <button 
            onClick={() => setShowProfile(!showProfile)}
            style={{
              padding: "8px 12px",
              backgroundColor: "#333",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Wallet ▼
          </button>
          
          {showProfile && (
            <div style={{
              position: "absolute",
              right: 0,
              top: "100%",
              backgroundColor: "#2c2c2c",
              border: "1px solid #444",
              borderRadius: "6px",
              padding: "16px",
              minWidth: "300px",
              zIndex: 1000,
              color: "white"
            }}>
              <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px" }}>
                Wallet Management
              </div>
              
              {/* Current wallet info */}
              {currentAddress && (
                <div style={{ marginBottom: "12px", fontSize: "12px", color: "#aaa" }}>
                  Current: {walletInfo.type} Wallet
                  <br />
                  {currentAddress.slice(0, 20)}...{currentAddress.slice(-10)}
                  <br />
                  Balance: {balance} SUI
                  {requestsCount > 0 && (
                    <>
                      <br />
                      <span style={{ color: "#ff4444", fontWeight: "bold" }}>
                        {requestsCount} pending request{requestsCount !== 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              )}
              
              {/* Environment wallet button */}
              {activeAddress && (
                <button
                  onClick={useEnvironmentWallet}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    backgroundColor: currentAddress === activeAddress ? "#4caf50" : "#555",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginBottom: "8px",
                    fontSize: "12px"
                  }}
                >
                  Use Environment Wallet (Can Mint)
                </button>
              )}
              
              {/* Manual address input */}
              <div style={{ marginBottom: "8px" }}>
                <input
                  type="text"
                  placeholder="Enter wallet address (0x...)"
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSetAddress()}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    backgroundColor: "#444",
                    color: "white",
                    border: "1px solid #666",
                    borderRadius: "4px",
                    fontSize: "12px",
                    marginBottom: "4px"
                  }}
                />
                <button
                  onClick={handleSetAddress}
                  style={{
                    width: "100%",
                    padding: "6px 12px",
                    backgroundColor: "#007bff",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Set Manual Address (View Only)
                </button>
              </div>
              
              {/* Clear manual address */}
              {manualAddress && (
                <button 
                  onClick={() => {
                    setManualAddress(null);
                    setShowProfile(false);
                  }}
                  style={{
                    width: "100%",
                    padding: "6px 12px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px"
                  }}
                >
                  Clear Manual Address
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;