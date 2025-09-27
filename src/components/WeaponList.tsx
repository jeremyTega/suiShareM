// src/components/WeaponList.tsx
import React from "react";
import { WeaponInfo } from "../utils/chains";

interface Props {
  weapons: WeaponInfo[];
  onUse?: (weapon: WeaponInfo) => void;
  onRequest?: (weapon: WeaponInfo) => void;
}

const WeaponList: React.FC<Props> = ({ weapons, onUse, onRequest }) => {
  if (!weapons.length) {
    return <p className="muted">No weapons found</p>;
  }

  return (
    <div className="weapon-grid">
      {weapons.map((w) => (
        <div key={w.id} className="weapon-card">
          <div className="weapon-name">{w.name}</div>
          <div className="weapon-power">Power: {w.power}</div>
          <div className="weapon-id muted">{w.id.slice(0, 6)}...{w.id.slice(-4)}</div>

          <div className="weapon-actions">
            {onUse && (
              <button className="nav-btn" onClick={() => onUse(w)}>
                Use
              </button>
            )}
            {onRequest && (
              <button className="nav-btn" onClick={() => onRequest(w)}>
                Request
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeaponList;
