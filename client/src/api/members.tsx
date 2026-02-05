import { apiFetch } from "./client";

export const createMember = async (groupId: string, memberName: string) => {
  const res = await apiFetch("/members", {
    method: "POST",
    body: JSON.stringify({ groupId, memberName }),
  });

  if (!res.ok) {
    throw new Error("failed to create member");
  }

  const data = await res.json();
  console.log(`created member ${memberName} in group ${groupId}`);
  return data.id;
};
