import type { Member } from "../types/types";

export const formatDate = (dateInput: string | Date): string => {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const getNameFromId = (members: Member[], id: string) => {
    const member = members.find((m) => m.id === id);
    return member ? member.memberName : undefined;
  };
