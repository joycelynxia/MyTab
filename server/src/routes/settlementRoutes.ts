import express from "express";
import prisma from "../prisma";
import { updateBalance } from "../utils";
import { authenticateToken, AuthRequest, requireGroupAccessOrClaim } from "../middleware/auth";

const router = express.Router();

router.get("/fromGroup/:groupId", ...requireGroupAccessOrClaim("admin", "participant", "viewer"), async (req, res) => {
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

router.post("/", ...requireGroupAccessOrClaim("admin", "participant"), async (req, res) => {
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

router.delete("/:settlementId", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { settlementId } = req.params;
    const userId = req.user!.id;
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
    });
    if (!settlement) {
      return res.status(404).json({ error: "Settlement not found" });
    }
    const groupUser = await prisma.groupUser.findUnique({
      where: { userId_groupId: { userId, groupId: settlement.groupId } },
    });
    if (!groupUser || !["admin", "participant"].includes(groupUser.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    await updateBalance(settlement.payeeId, settlement.amount);
    await updateBalance(settlement.payerId, -settlement.amount);
    await prisma.settlement.delete({
      where: { id: settlementId },
    });
    res.json({ message: "Settlement deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete settlement" });
  }
});

export default router;
