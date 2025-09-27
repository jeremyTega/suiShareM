// src/utils/chains.ts
import { client, packageId } from "../blockchain/suiClient";

export interface WeaponInfo {
  id: string;
  name: string;
  power: number;
  objectId: string;
}

export async function getWeaponsForUser(address: string): Promise<WeaponInfo[]> {
  try {
    console.log(`Fetching weapons for address: ${address}`);
    
    // Query for all objects owned by the user that match the Weapon struct
    const result = await client.getOwnedObjects({
      owner: address,
      filter: {
        StructType: `${packageId}::obs::Weapon`
      },
      options: {
        showContent: true,
        showType: true,
      }
    });

    console.log("Raw weapons query result:", result);

    const weapons: WeaponInfo[] = [];
    
    for (const obj of result.data) {
      if (obj.data?.content && 'fields' in obj.data.content) {
        const fields = obj.data.content.fields as any;
        
        weapons.push({
          id: fields.id?.id || obj.data.objectId,
          name: fields.name || "Unknown Weapon",
          power: parseInt(fields.power) || 0,
          objectId: obj.data.objectId,
        });
      }
    }

    console.log(`Found ${weapons.length} weapons:`, weapons);
    return weapons;
    
  } catch (error) {
    console.error("Error fetching weapons:", error);
    return [];
  }
}