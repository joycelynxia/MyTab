// src/api/members.ts
export const createMember = async (groupId: string, memberName: string) => {
  console.log("adding new member to group");

  const res = await fetch(`http://localhost:3000/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ groupId, memberName }),
  });

  if (!res.ok) {
    throw new Error("failed to create member");
  }

  const data = await res.json();
  console.log(`created member ${memberName} in group ${groupId}`);
  return data.id;
};
