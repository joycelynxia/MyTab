import { useEffect, useState } from "react";
import type { Member } from "../types/types";
import { apiFetch } from "../api/client";

export const useMembers = (groupId?: string) => {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!groupId) return;
    const fetchMembers = async () => {
      try {
        const res = await apiFetch(`/members/fromGroup/${groupId}`);
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        setMembers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching members:", err);
        setMembers([]);
      }
    };
    fetchMembers();
  }, [groupId]);

  return [members, setMembers] as const;
};
