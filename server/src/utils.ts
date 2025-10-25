import prisma from "./prisma";

export const updateBalance = async (id: string, amount: number) => {
  await prisma.member.update({
    where: { id },
    data: {
      balance: {
        increment: amount,
      },
    },
  });
};
