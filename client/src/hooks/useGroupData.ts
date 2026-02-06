import { useEffect, useState } from "react";
import type { Group } from "../types/types";
import { addRecentGroup } from "../utils/recentGroups";

export const useGroupData = (groupId?: string) => {
  const [group, setGroup] = useState<Group>();

  useEffect(() => {
    if (!groupId) return;
    const fetchGroup = async () => {
      try {
        const res = await (await import("../api/client")).apiFetch(`/groups/${groupId}`);
        if (!res.ok) throw new Error("Failed to fetch group");
        const data = await res.json();
        setGroup(data);
        addRecentGroup({ id: data.id, groupName: data.groupName });
      } catch (err) {
        console.error("Error fetching group:", err);
      }
    };
    fetchGroup();
  }, [groupId]);

  return group;
};
