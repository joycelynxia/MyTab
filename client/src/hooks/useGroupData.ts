import { useEffect, useState } from "react";
import type { Group } from "../types/types";

export const useGroupData = (groupId?: string) => {
  const [group, setGroup] = useState<Group>();

  useEffect(() => {
    if (!groupId) return;
    const fetchGroup = async () => {
      try {
        const res = await fetch(`http://localhost:3000/groups/${groupId}`);
        if (!res.ok) throw new Error("Failed to fetch group");
        const data = await res.json();
        setGroup(data);
      } catch (err) {
        console.error("Error fetching group:", err);
      }
    };
    fetchGroup();
  }, [groupId]);

  return group;
};
