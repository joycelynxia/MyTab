import express from "express";
import crypto from "crypto";
import prisma from "../prisma";
import {
  authenticateToken,
  AuthRequest,
  requireGroupAccess,
  requireGroupAccessOrClaim,
} from "../middleware/auth";

const router = express.Router();

// get all groups (only groups user has access to)
router.get("/all", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const groupUsers = await prisma.groupUser.findMany({
      where: { userId },
      include: { group: true },
    });
    const groups = groupUsers.map((gu) => ({ ...gu.group, role: gu.role }));
    res.json(groups);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to fetch groups" });
  }
});

// Public: get group + members by share token (for join page)
router.get("/byToken/:shareToken", async (req, res) => {
  try {
    const { shareToken } = req.params;
    const group = await prisma.group.findUnique({
      where: { shareToken },
      include: { members: true },
    });
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.json({ id: group.id, groupName: group.groupName, members: group.members });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch group" });
  }
});

// Public: claim a member (select or add), sets cookie, returns groupId
router.post("/claim", async (req, res) => {
  try {
    const { shareToken, memberId, memberName } = req.body;
    if (!shareToken?.trim()) {
      return res.status(400).json({ error: "shareToken required" });
    }

    const group = await prisma.group.findUnique({
      where: { shareToken: shareToken.trim() },
    });
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    let finalMemberId: string;

    if (memberId) {
      const member = await prisma.member.findFirst({
        where: { id: memberId, groupId: group.id },
      });
      if (!member) {
        return res.status(400).json({ error: "Member not found in this group" });
      }
      finalMemberId = member.id;
    } else if (memberName?.trim()) {
      const member = await prisma.member.create({
        data: { groupId: group.id, memberName: memberName.trim() },
      });
      finalMemberId = member.id;
    } else {
      return res.status(400).json({ error: "memberId or memberName required" });
    }

    const payload = JSON.stringify({ groupId: group.id, memberId: finalMemberId });
    res.cookie("mytab_claim", payload, {
      signed: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ groupId: group.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to claim member" });
  }
});

router.get("/:groupId", ...requireGroupAccessOrClaim("admin", "participant", "viewer"), async (req, res) => {
  const { groupId } = req.params;
  const role = (req as any).groupRole;
  const accessLevel = (req as AuthRequest).accessLevel ?? "full";
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
    res.json({ ...group, myRole: role, accessLevel });
    console.log("found group", group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `failed to fetch group ${groupId}` });
  }
});

router.post("/", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { groupName } = req.body;
    const userId = req.user!.id;

    const group = await prisma.group.create({
      data: {
        groupName,
        shareToken: crypto.randomUUID(),
        groupUsers: {
          create: { userId, role: "admin" },
        },
      },
      include: { groupUsers: true },
    });
    res.json(group);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to create group" });
  }
});

// Invite user to group (admin only)
router.post("/:groupId/users", ...requireGroupAccess("admin"), async (req: AuthRequest, res) => {
  try {
    const { groupId } = req.params;
    const { email, role } = req.body;

    if (!email?.trim() || !role) {
      return res.status(400).json({ error: "Email and role (admin, participant, viewer) required" });
    }

    const validRoles = ["admin", "participant", "viewer"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: "Role must be admin, participant, or viewer" });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return res.status(404).json({ error: "No user found with that email" });
    }

    await prisma.groupUser.create({
      data: { userId: user.id, groupId, role },
    });

    res.status(201).json({ message: "User added to group", userId: user.id, role });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({ error: "User already has access to this group" });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to add user" });
  }
});

router.delete("/:groupId", ...requireGroupAccess("admin"), async (req, res) => {
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
