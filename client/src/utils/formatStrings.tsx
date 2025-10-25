import type { Member } from "../types/types";

  export const getNameFromId = (members: Member[], id: string) => {
    const member = members.find((m) => m.id === id);
    return member ? member.memberName : undefined;
  };