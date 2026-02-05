import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
  groupRole?: string;
  claimedMemberId?: string;
  accessLevel?: "full" | "add_only";
}

/** Requires JWT. Use for delete and other privileged ops. */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

/** Tries JWT, sets req.user if valid. Does not fail. */
export function optionalAuthenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = { id: payload.userId, email: payload.email };
  } catch {
    // Ignore invalid token
  }
  next();
}

export type GroupRole = "admin" | "participant" | "viewer";

function getGroupIdFromRequest(req: Request): string | undefined {
  return req.params.groupId || req.body?.groupId;
}

/** Parses claim cookie and sets req.claimedMemberId if valid for groupId. */
function parseClaimForGroup(req: AuthRequest, groupId: string): boolean {
  const raw = (req as any).signedCookies?.mytab_claim;
  if (!raw || typeof raw !== "string") return false;
  try {
    const { groupId: g, memberId } = JSON.parse(raw) as { groupId: string; memberId: string };
    if (g === groupId && memberId) {
      req.claimedMemberId = memberId;
      return true;
    }
  } catch {
    // Ignore
  }
  return false;
}

export function requireGroupRole(...allowedRoles: GroupRole[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const groupId = getGroupIdFromRequest(req);
    if (!groupId) {
      return res.status(400).json({ error: "Group ID required" });
    }

    const groupUser = await prisma.groupUser.findUnique({
      where: {
        userId_groupId: { userId: req.user.id, groupId },
      },
    });

    if (!groupUser) {
      return res.status(403).json({ error: "Access denied to this group" });
    }

    if (!allowedRoles.includes(groupUser.role as GroupRole)) {
      return res.status(403).json({
        error: `Requires one of: ${allowedRoles.join(", ")}. Your role: ${groupUser.role}`,
      });
    }

    (req as any).groupRole = groupUser.role;
    next();
  };
}

/** JWT + GroupUser required. */
export function requireGroupAccess(...allowedRoles: GroupRole[]) {
  return [authenticateToken, requireGroupRole(...allowedRoles)];
}

/**
 * Allows JWT+GroupUser (full) OR claim cookie (add_only).
 * Use for: GET group, GET members, GET expenses, GET settlements, POST expense, POST settlement, POST member.
 */
export function requireGroupAccessOrClaim(...allowedRoles: GroupRole[]) {
  return [
    optionalAuthenticateToken,
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      const groupId = getGroupIdFromRequest(req);
      if (!groupId) {
        return res.status(400).json({ error: "Group ID required" });
      }

      // 1. JWT + GroupUser → full access
      if (req.user) {
        const groupUser = await prisma.groupUser.findUnique({
          where: { userId_groupId: { userId: req.user.id, groupId } },
        });
        if (groupUser && allowedRoles.includes(groupUser.role as GroupRole)) {
          (req as any).groupRole = groupUser.role;
          req.accessLevel = "full";
          return next();
        }
      }

      // 2. Claim cookie for this group → add_only
      if (parseClaimForGroup(req, groupId)) {
        req.accessLevel = "add_only";
        (req as any).groupRole = "member";
        return next();
      }

      return res.status(403).json({ error: "Access denied to this group" });
    },
  ];
}
