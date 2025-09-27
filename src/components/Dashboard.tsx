// src/components/Dashboard.tsx
import React, { useEffect, useState } from "react";
import Header from "./Header";
import "./Dashboard.css";
import WeaponList from "./WeaponList";
import { getWeaponsForUser, WeaponInfo } from "../utils/chains";
import { Transaction } from "@mysten/sui/transactions";
import { activeAddress, signAndExecute as localSignAndExecute, client } from "../blockchain/suiClient";

interface LoanInfo {
  id: string;
  weapon: WeaponInfo;
  lender: string;
  renter: string;
  expiry_timestamp: number;
  duration: number;
}

interface WeaponRequest {
  id: string;
  lender: string;
  renter: string;
  weapon: string;
  duration: number;
  status: 'pending' | 'accepted' | 'rejected';
}

const Dashboard: React.FC = () => {
  const [weapons, setWeapons] = useState<WeaponInfo[]>([]);
  const [borrowedWeapons, setBorrowedWeapons] = useState<LoanInfo[]>([]);
  const [weaponRequests, setWeaponRequests] = useState<WeaponRequest[]>([]);
  const [loadingWeapons, setLoadingWeapons] = useState(false);
  const [minting, setMinting] = useState(false);
  const [manualAddress, setManualAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");

  // Request weapon modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    lenderAddress: '',
    weaponId: '',
    duration: 24 // hours
  });

  // Requests modal state
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  const packageId = import.meta.env.VITE_PACKAGE_ID || "0x0";
  const currentAddress = manualAddress || activeAddress;

  // Auto-load data when address changes
  useEffect(() => {
    if (!currentAddress) {
      setWeapons([]);
      setBorrowedWeapons([]);
      setBalance("0");
      return;
    }

    let mounted = true;
    (async () => {
      setLoadingWeapons(true);
      try {
        // Load owned weapons
        const w = await getWeaponsForUser(currentAddress);
        if (mounted) setWeapons(w);

        // Load borrowed weapons (loans where current user is renter)
        const loans = await getBorrowedWeapons(currentAddress);
        if (mounted) setBorrowedWeapons(loans);

        // Load weapon requests (where current user is lender)
        const requests = await getWeaponRequests(currentAddress);
        if (mounted) setWeaponRequests(requests);

        // Check balance
        const bal = await client.getBalance({ owner: currentAddress });
        if (mounted) {
          const suiAmount = (parseInt(bal.totalBalance) / 1000000000).toFixed(4);
          setBalance(suiAmount);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        if (mounted) {
          setWeapons([]);
          setBorrowedWeapons([]);
          setBalance("0");
        }
      } finally {
        if (mounted) setLoadingWeapons(false);
      }
    })();

    return () => { mounted = false; };
  }, [currentAddress]);

  // Mock function to get borrowed weapons - you'd implement this with actual Sui queries
  const getBorrowedWeapons = async (address: string): Promise<LoanInfo[]> => {
    // This would query for Loan objects where renter == address
    // For now, returning empty array since we need to implement the actual query
    try {
      const result = await client.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${packageId}::obs::Loan`
        },
        options: {
          showContent: true,
          showType: true,
        }
      });

      return result.data.map(obj => {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          return {
            id: obj.data.objectId,
            weapon: {
              id: fields.weapon.fields.id.id,
              name: fields.weapon.fields.name,
              power: parseInt(fields.weapon.fields.power),
              objectId: fields.weapon.fields.id.id
            },
            lender: fields.lender,
            renter: fields.renter,
            expiry_timestamp: parseInt(fields.expiry_timestamp),
            duration: parseInt(fields.duration)
          };
        }
        return null;
      }).filter(Boolean) as LoanInfo[];
    } catch (error) {
      console.error("Error fetching borrowed weapons:", error);
      return [];
    }
  };

  // Mock function to get weapon requests - you'd implement this with event queries
  const getWeaponRequests = async (address: string): Promise<WeaponRequest[]> => {
    // This would query for RequestWeaponEvent events where lender == address
    // For now, returning mock data
    return [];
  };

  const handleMintWeapon = async (weaponType: number) => {
    if (!packageId || packageId === "0x0") {
      alert("Invalid package ID. Check your .env file.");
      return;
    }

    if (!currentAddress) {
      alert("No wallet address available!");
      return;
    }

    if (parseFloat(balance) === 0) {
      alert(`No SUI found for gas fees!\n\nGet testnet SUI from:\n• https://faucet.testnet.sui.io/\n• Enter this address: ${currentAddress}`);
      return;
    }

    if (manualAddress && manualAddress !== activeAddress) {
      alert("Manual address is view-only. You can only mint with the environment wallet.");
      return;
    }

    setMinting(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::obs::mint`,
        arguments: [tx.pure.u8(weaponType)],
      });

      const result = await localSignAndExecute(tx);
      console.log("Mint successful:", result);
      
      const weaponName = weaponType === 1 ? "Sword" : weaponType === 2 ? "Bow" : "Axe";
      alert(`${weaponName} minted successfully!`);
      
      // Refresh data after 3 seconds
      setTimeout(async () => {
        if (currentAddress) {
          const w = await getWeaponsForUser(currentAddress);
          setWeapons(w);
          const bal = await client.getBalance({ owner: currentAddress });
          setBalance((parseInt(bal.totalBalance) / 1000000000).toFixed(4));
        }
      }, 3000);
      
    } catch (error: any) {
      console.error("Mint failed:", error);
      alert(`Failed to mint weapon: ${error?.message || "Unknown error"}`);
    } finally {
      setMinting(false);
    }
  };

  const handleRequestWeapon = async () => {
    if (!currentAddress || currentAddress !== activeAddress) {
      alert("You need the environment wallet to request weapons.");
      return;
    }

    if (!requestForm.lenderAddress || !requestForm.weaponId) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const tx = new Transaction();
      const durationMs = requestForm.duration * 60 * 60 * 1000; // Convert hours to milliseconds
      
      tx.moveCall({
        target: `${packageId}::obs::request_weapon`,
        arguments: [
          tx.pure.address(requestForm.lenderAddress),
          tx.pure.address(requestForm.weaponId),
          tx.pure.u64(durationMs)
        ],
      });

      const result = await localSignAndExecute(tx);
      console.log("Request successful:", result);
      alert("Weapon request sent successfully!");
      
      setShowRequestModal(false);
      setRequestForm({ lenderAddress: '', weaponId: '', duration: 24 });
      
    } catch (error: any) {
      console.error("Request failed:", error);
      alert(`Failed to request weapon: ${error?.message || "Unknown error"}`);
    }
  };

  const handleAcceptRequest = async (request: WeaponRequest, weaponObjectId: string) => {
    if (!currentAddress || currentAddress !== activeAddress) {
      alert("You need the environment wallet to accept requests.");
      return;
    }

    try {
      const tx = new Transaction();
      const durationMs = request.duration;
      
      // Get clock object (you might need to create this or pass it)
      const clockObjectId = "0x6"; // Sui system clock object
      
      tx.moveCall({
        target: `${packageId}::obs::lend_weapon`,
        arguments: [
          tx.object(weaponObjectId),
          tx.pure.address(request.renter),
          tx.pure.u64(durationMs),
          tx.object(clockObjectId)
        ],
      });

      const result = await localSignAndExecute(tx);
      console.log("Lend successful:", result);
      alert("Weapon lent successfully!");
      
      // Refresh data
      setTimeout(async () => {
        if (currentAddress) {
          const w = await getWeaponsForUser(currentAddress);
          setWeapons(w);
          const loans = await getBorrowedWeapons(currentAddress);
          setBorrowedWeapons(loans);
        }
      }, 3000);
      
    } catch (error: any) {
      console.error("Lend failed:", error);
      alert(`Failed to lend weapon: ${error?.message || "Unknown error"}`);
    }
  };

  const getMintButtonProps = (type: number) => {
    const canMint = currentAddress === activeAddress && parseFloat(balance) > 0;
    const disabled = minting || !canMint || !packageId || packageId === "0x0";
    
    let text: string;
    if (minting) {
      text = "Minting...";
    } else if (!currentAddress) {
      text = "No Address";
    } else if (currentAddress !== activeAddress) {
      text = "View Only";
    } else if (parseFloat(balance) === 0) {
      text = "Need SUI";
    } else if (!packageId || packageId === "0x0") {
      text = "Invalid Package";
    } else {
      text = `Mint ${type === 1 ? "Sword" : type === 2 ? "Bow" : "Axe"}`;
    }
    
    const style = disabled
      ? { backgroundColor: "#ff4444", color: "white" }
      : { backgroundColor: "#4caf50", color: "white" };
      
    return { disabled, text, style };
  };

  return (
    <>
      <Header
        onRequestWeapon={() => setShowRequestModal(true)}
        onSeeRequests={() => setShowRequestsModal(true)}
        manualAddress={manualAddress}
        setManualAddress={setManualAddress}
        currentAddress={currentAddress}
        activeAddress={activeAddress}
        balance={balance}
      />

      <main className="main-sections" style={{ paddingTop: 80 }}>
        
        {/* Wallet Status */}
        <section className="section">
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <h3>Wallet Status</h3>
            {currentAddress ? (
              <div>
                <p style={{ 
                  color: currentAddress === activeAddress ? '#4caf50' : '#ff9800',
                  fontSize: '14px',
                  margin: '8px 0'
                }}>
                  {currentAddress === activeAddress ? "Environment Wallet (Can Mint)" : "Manual Address (View Only)"}
                </p>
                <p style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all' }}>
                  {currentAddress}
                </p>
                <p style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: parseFloat(balance) > 0 ? '#4caf50' : '#ff4444'
                }}>
                  Balance: {balance} SUI
                </p>
                {parseFloat(balance) === 0 && (
                  <p style={{ fontSize: '12px', color: '#ff4444' }}>
                    Need testnet SUI for gas fees. Get from{' '}
                    <a href="https://faucet.testnet.sui.io/" target="_blank" rel="noopener noreferrer" style={{ color: '#007bff' }}>
                      faucet
                    </a>
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: '#666' }}>No wallet address configured</p>
            )}
          </div>
        </section>

        <div className="divider" />

        {/* Mint Weapons */}
        <section className="section section1">
          <div style={{ marginBottom: 16 }}>
            <h3>Mint New Weapons</h3>
            <p className="muted" style={{ marginBottom: 12 }}>
              {currentAddress === activeAddress 
                ? "Mint weapons to your environment wallet"
                : currentAddress
                ? "Switch to environment wallet to mint"
                : "Configure wallet to mint weapons"
              }
            </p>
            <div className="mint-buttons" style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[1, 2, 3].map((type) => {
                const { disabled, text, style } = getMintButtonProps(type);
                return (
                  <button
                    key={type}
                    onClick={() => handleMintWeapon(type)}
                    disabled={disabled}
                    style={{ ...style, padding: '12px 24px', border: 'none', borderRadius: '6px', cursor: disabled ? 'not-allowed' : 'pointer' }}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* Borrowed Weapons */}
        <section className="section section2">
          <div style={{ marginBottom: 16 }}>
            <h3>Borrowed Weapons ({borrowedWeapons.length})</h3>
            <p className="muted" style={{ marginBottom: 12 }}>
              Weapons you've borrowed from other users
            </p>
            {borrowedWeapons.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {borrowedWeapons.map((loan) => {
                  const isExpired = Date.now() > loan.expiry_timestamp;
                  const timeLeft = Math.max(0, loan.expiry_timestamp - Date.now());
                  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                  
                  return (
                    <div key={loan.id} style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '16px',
                      backgroundColor: isExpired ? '#fee' : '#f9f9f9'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
                            {loan.weapon.name} (Power: {loan.weapon.power})
                          </h4>
                          <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                            From: {loan.lender.slice(0, 10)}...{loan.lender.slice(-8)}
                          </p>
                          <p style={{ 
                            margin: '4px 0', 
                            fontSize: '12px', 
                            color: isExpired ? '#d32f2f' : '#4caf50' 
                          }}>
                            {isExpired 
                              ? "Expired - Weapon will auto-return" 
                              : `Time left: ${hoursLeft}h ${minutesLeft}m`
                            }
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => alert(`Using ${loan.weapon.name}!`)}
                            disabled={isExpired}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: isExpired ? '#ccc' : '#4a90e2',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: isExpired ? 'not-allowed' : 'pointer'
                            }}
                          >
                            Use
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted">No borrowed weapons. Request weapons from other users!</p>
            )}
          </div>
        </section>

        <div className="divider" />

        {/* Owned Weapons */}
        <section className="section section3">
          <div style={{ marginBottom: 16 }}>
            <h3>Your Owned Weapons ({weapons.length})</h3>
            {loadingWeapons ? (
              <p className="muted">Loading weapons...</p>
            ) : weapons.length === 0 ? (
              <p className="muted">
                {!currentAddress 
                  ? "Configure wallet to view weapons"
                  : "No weapons found. Mint some above!"
                }
              </p>
            ) : (
              <WeaponList
                weapons={weapons}
                onUse={(w) => alert(`Using ${w.name} (Power: ${w.power})`)}
                onRequest={(w) => alert(`This weapon can be borrowed by others`)}
              />
            )}
          </div>
        </section>
      </main>

      {/* Request Weapon Modal */}
      {showRequestModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <h3>Request Weapon</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Lender Address:</label>
              <input
                type="text"
                value={requestForm.lenderAddress}
                onChange={(e) => setRequestForm({...requestForm, lenderAddress: e.target.value})}
                placeholder="0x..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Weapon ID:</label>
              <input
                type="text"
                value={requestForm.weaponId}
                onChange={(e) => setRequestForm({...requestForm, weaponId: e.target.value})}
                placeholder="0x..."
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px' }}>Duration (hours):</label>
              <input
                type="number"
                value={requestForm.duration}
                onChange={(e) => setRequestForm({...requestForm, duration: parseInt(e.target.value) || 24})}
                min="1"
                max="168"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowRequestModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestWeapon}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests Modal */}
      {showRequestsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3>Weapon Requests</h3>
            {weaponRequests.length === 0 ? (
              <p className="muted">No weapon requests yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                {weaponRequests.map((request) => (
                  <div key={request.id} style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <p><strong>From:</strong> {request.renter.slice(0, 10)}...{request.renter.slice(-8)}</p>
                    <p><strong>Duration:</strong> {request.duration} hours</p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        onClick={() => handleAcceptRequest(request, request.weapon)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => alert("Request rejected")}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowRequestsModal(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;