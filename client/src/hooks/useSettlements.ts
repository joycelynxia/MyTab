import { useEffect, useState } from "react";
import type { Settlement } from "../types/types";

export const useSettlements = (groupId?: string) => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    if (!groupId) return;

    const fetchSettlements = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/settlements/fromGroup/${groupId}`
        );
        if (!res.ok) throw new Error("Failed to fetch settlements");
        const data = await res.json();
        setSettlements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching settlements:", err);
        setSettlements([]);
      }
    };

    fetchSettlements();
  }, [groupId]);

  return [settlements, setSettlements] as const;
};
