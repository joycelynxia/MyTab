import express from "express";
import prisma from "../prisma";
import { AuthRequest, requireGroupAccessOrClaim } from "../middleware/auth";

const router = express.Router();

// get information for a specific member - need to verify group access via member's group
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        settlementsPaid: true,
        settlementsReceived: true,
        group: true,
      },
    });
    res.json(member);
    console.log("found member: ", member)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: `failed to fetch member with id: ${id}`});
  }
});

// get all members in a group
router.get("/fromGroup/:groupId", ...requireGroupAccessOrClaim("admin", "participant", "viewer"), async (req, res) => {
  const {groupId} = req.params;
  try {
    const members = await prisma.member.findMany({
      where: {groupId},
      include: {
          settlementsPaid: true,
        settlementsReceived: true,
        group: true,
      }
    });
    res.json(members);
    console.log('found members for group', groupId);
  } catch (error) {
    console.error(error);
    res.status(500).json({error: `failed to find members of group ${groupId}`})
  }
})

router.post("/", ...requireGroupAccessOrClaim("admin", "participant"), async (req: AuthRequest, res) => {
  try {
    const { groupId, memberName } = req.body;
    const member = await prisma.member.create({
      data: { groupId, memberName },
    });
    res.json(member);
    console.log('created new member', member)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to create member" });
  }
});

export default router;
