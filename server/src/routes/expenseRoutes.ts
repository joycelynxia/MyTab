import express from "express";
import prisma from "../prisma";
import { updateBalance } from "../utils";
const router = express.Router();

// get ALL expenses for a group
router.get("/fromGroup/:groupId", async (req, res) => {
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

// create a new expense
router.post("/", async (req, res) => {
  try {
    console.log('creating expense')
    const { groupId, expenseName, amount, payerId, splits } = req.body;

    if (!groupId || !expenseName || !amount || !payerId || !splits) {
      return res.status(400).json({ error: "mising required fields" });
    }

    console.log(req.body);
    const expense = await prisma.expense.create({
      data: {
        groupId,
        expenseName,
        amount: parseFloat(amount),
        payerId,
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

    console.log("created expense", expense);
    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to create new expense" });
  }
});

export default router;
