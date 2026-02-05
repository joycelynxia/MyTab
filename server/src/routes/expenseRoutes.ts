import express from "express";
import prisma from "../prisma";
import { updateBalance } from "../utils";
import { authenticateToken, AuthRequest, requireGroupAccess, requireGroupAccessOrClaim } from "../middleware/auth";

const router = express.Router();

// get ALL expenses for a group
router.get("/fromGroup/:groupId", ...requireGroupAccessOrClaim("admin", "participant", "viewer"), async (req, res) => {
  console.log("fetching expenses");
  try {
    const { groupId } = req.params;
    const expenses = await prisma.expense.findMany({
      where: { groupId },
      include: {
        payer: true,
        splits: {
          include: {
            member: true,
          },
        },
      },
      orderBy: {
        date: "desc", // order by most recent first
      },
    });
    console.log(expenses);
    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to fetch all expenses" });
  }
});

// create a new expense (participant or admin)
router.post("/", ...requireGroupAccessOrClaim("admin", "participant"), async (req: AuthRequest, res) => {
  try {
    const { groupId, expenseName, amount, payerId, splits, receiptId } = req.body;
    const addedById = req.user?.id ?? null;

    if (!groupId || !expenseName || !amount || !payerId || !splits) {
      return res.status(400).json({ error: "missing required fields" });
    }

    const expense = await prisma.expense.create({
      data: {
        groupId,
        expenseName,
        amount: parseFloat(amount),
        payerId,
        addedById,
        receiptId: receiptId || null,
        splits: {
          create: splits.map((split: any) => ({
            memberId: split.memberId,
            memberName: split.memberName,
            amount: split.amount,
            percent: split.percent,
          })),
        },
      },
      include: {
        payer: true,
        group: true,
        splits: { include: { member: true } },
      },
    });

    updateBalance(payerId, amount);

    expense.splits.forEach((split) => {
      updateBalance(split.memberId, -split.amount);
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to create new expense" });
  }
});

// delete expense - admin can delete any, participant only their own
router.delete("/:expenseId", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { expenseId } = req.params;
    const userId = req.user!.id;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: { splits: true },
    });

    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const groupUser = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId, groupId: expense.groupId } },
    });

    if (!groupUser) {
      return res.status(403).json({ error: "Access denied to this group" });
    }

    if (groupUser.role === "participant") {
      if (expense.addedById !== userId) {
        return res.status(403).json({ error: "Participants can only delete expenses they added" });
      }
    } else if (groupUser.role !== "admin") {
      return res.status(403).json({ error: "Viewers cannot delete expenses" });
    }

    // Reverse balance updates
    await updateBalance(expense.payerId, -expense.amount);
    for (const split of expense.splits) {
      await updateBalance(split.memberId, split.amount);
    }

    await prisma.expense.delete({
      where: { id: expenseId },
    });

    res.json({ message: "Expense deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to delete expense" });
  }
});

export default router;
