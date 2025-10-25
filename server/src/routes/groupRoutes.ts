import express from "express";
import prisma from "../prisma";
import { group } from "console";

const router = express.Router();

// get all groups
router.get("/all", async (req, res) => {
  try {
    const groups = await prisma.group.findMany();
    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to fetch groups" });
  }
});

router.get("/:groupId", async (req, res) => {
  const { groupId } = req.params;
  try {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: true,
        expenses: true,
        settlements: true,
      },
    });
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json(group);
    console.log("found group", group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `failed to fetch group ${groupId}` });
  }
});

router.post("/", async (req, res) => {
  try {
    console.log("Received body:", req.body); // 👈 Add this

    const { groupName } = req.body;
    const group = await prisma.group.create({
      data: { groupName },
    });
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to create group" });
  }
});

// server/src/routes/groupRoutes.ts
router.delete("/:groupId", async (req, res) => {
  const { groupId } = req.params;

  try {
    // 1️⃣ Delete all splits associated with this group's expenses
    await prisma.split.deleteMany({
      where: {
        expense: {
          groupId,
        },
      },
    });

    // 2️⃣ Delete all expenses in the group
    await prisma.expense.deleteMany({
      where: { groupId },
    });

    // 3️⃣ Delete all settlements in the group
    await prisma.settlement.deleteMany({
      where: { groupId },
    });

    // 4️⃣ Delete all members in the group
    await prisma.member.deleteMany({
      where: { groupId },
    });

    // 5️⃣ Finally, delete the group itself
    const group = await prisma.group.delete({
      where: { id: groupId },
    });

    res.json({ message: "Group and all associated data deleted successfully", group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete group" });
  }
});


export default router;
