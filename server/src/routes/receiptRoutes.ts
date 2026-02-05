import express from "express";
import prisma from "../prisma";
import { extractTextFromReceipt } from "../utils/receiptOcr";
import { authenticateToken, requireGroupAccessOrClaim } from "../middleware/auth";

const router = express.Router();

// OCR: extract text and line items from receipt image (Google Vision API free tier)
router.post("/ocr", authenticateToken, async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const { fullText, lineItems, receiptTotal, subtotal } = await extractTextFromReceipt(imageBase64);

    res.json({ fullText, lineItems, receiptTotal, subtotal });
  } catch (error: any) {
    console.error("Receipt OCR error:", error);

    if (error.code === 3) {
      return res.status(400).json({
        error: "Invalid image. Please upload a clear photo of your receipt.",
      });
    }
    if (error.code === 7) {
      return res.status(503).json({
        error: "Google Vision API unavailable. Check your API credentials.",
      });
    }

    res.status(500).json({
      error: error.message || "Failed to process receipt image",
    });
  }
});

// create a receipt (stores image for grouping expenses)
router.post("/", ...requireGroupAccessOrClaim("admin", "participant"), async (req, res) => {
  try {
    const { groupId, imageData } = req.body;

    if (!groupId) {
      return res.status(400).json({ error: "groupId is required" });
    }

    const receipt = await prisma.receipt.create({
      data: {
        groupId,
        imageData: imageData || null,
      },
    });

    res.status(201).json(receipt);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "failed to create receipt" });
  }
});

export default router;
