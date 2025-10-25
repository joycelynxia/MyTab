import express from "express";
import prisma from "../prisma";
import { updateBalance } from "../utils";
const router = express.Router();

router.get("/fromGroup/:groupId", async (req, res) => {
  console.log("getting all settlements from group");
  try {
    const { groupId } = req.params;
    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      include: {
        group: true,
        payer: true,
        payee: true,
      },
      orderBy: { date: "desc" },
    });
    console.log(settlements);
    res.status(201).json(settlements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to fetch settlements from group" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { groupId, payerId, payeeId, amount, note } = req.body;
    if (!groupId || !payerId || !payeeId || !amount) {
      return res.status(400).json({ error: "missing required fields" });
    }
    console.log(req.body);

    const settlement = await prisma.settlement.create({
      data: {
        groupId,
        payerId,
        payeeId,
        amount: parseFloat(amount),
        note,
      },
      include: {
        payee: true,
        payer: true,
        // group: true,
      }
    });

    updateBalance(payeeId, -amount);
    updateBalance(payerId, amount)
    res.status(201).json(settlement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to create new settlement" });
  }
});
export default router;
