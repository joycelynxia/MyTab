import type { Member, Split } from "../types/types";

export const updateBalancesAfterExpense = (
  members: Member[],
  payerId: string,
  amount: number,
  splits: Split[]
): Member[] => {
  return members.map((member) => {
    let newBalance = member.balance;
    if (member.id === payerId) newBalance += amount;
    if (splits.find((split) => split.memberId === member.id))
      newBalance -= amount / splits.length;
    return { ...member, balance: newBalance };
  });
};

export const updateBalancesAfterSettlement = (
  members: Member[],
  payerId: string,
  payeeId: string,
  amount: number
): Member[] => {
  return members.map((member) => {
    if (member.id === payerId) return { ...member, balance: member.balance + amount };
    if (member.id === payeeId) return { ...member, balance: member.balance - amount };
    return member;
  });
};
