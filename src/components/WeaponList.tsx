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
    <div className="weapon-list">
      {weapons.map((w) => (
        <div key={w.id} className="weapon-card">
          <div className="weapon-row">
            <div>
              <div className="weapon-name">{w.name}</div>
              <div className="weapon-id muted">{w.id}</div>
            </div>
            <div className="weapon-power">Power: {w.power}</div>
          </div>

          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            {onUse && (
              <button className="nav-btn" onClick={() => onUse(w)}>
                Use
              </button>
            )}
            {onRequest && (
              <button className="nav-btn" onClick={() => onRequest(w)}>
                Request Share
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default WeaponList;
