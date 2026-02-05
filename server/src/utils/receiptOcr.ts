import { ImageAnnotatorClient } from "@google-cloud/vision";

const client = new ImageAnnotatorClient();

export interface ParsedLineItem {
  description: string;
  amount: number;
}

// Skip lines that are purely summary/footer (exact or starts with these)
const SKIP_LINE_PATTERNS = [
  /^\s*total\s*$/i,
  /^\s*subtotal\s*$/i,
  /^\s*tax\s*$/i,
  /^\s*tips?\s*$/i,
  /^\s*change\s*$/i,
  /^\s*cash\s*$/i,
  /^\s*card\s*$/i,
  /thank\s+you/i,
  /^\s*receipt\s*$/i,
  /visa|mastercard|debit\s*card|credit\s*card/i,
  /^\s*date\s*:\s*/i,
  /^\s*time\s*:\s*/i,
  /balance\s*due/i,
  /amount\s*due/i,
];

// Extract price from string - supports $X.XX, X.XX, $X, 1,234.56
function extractPrice(str: string): { amount: number; match: string } | null {
  // Match: $1,234.56 or $12.99 or $5 or 12.99 or 5.00 (with optional commas)
  const patterns = [
    /\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*$/,  // at end: 12.99, 1,234.56
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/,       // $12.99 anywhere
    /(\d+\.\d{2})\s*$/,                           // 12.99 at end (no $)
  ];
  for (const re of patterns) {
    const m = str.match(re);
    if (m) {
      const numStr = m[1].replace(/,/g, "");
      const amount = parseFloat(numStr);
      if (!isNaN(amount) && amount > 0 && amount < 99999) {
        return { amount, match: m[0] };
      }
    }
  }
  return null;
}

function shouldSkipLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 2) return true;
  return SKIP_LINE_PATTERNS.some((p) => p.test(trimmed));
}

function normalizeLine(line: string): string {
  // Collapse multiple spaces/tabs, trim
  return line.replace(/\s+/g, " ").trim();
}

function parseReceiptText(fullText: string): ParsedLineItem[] {
  const rawLines = fullText.split(/\r?\n/).map(normalizeLine).filter((l) => l);
  const items: ParsedLineItem[] = [];
  let pendingDescription = "";

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Line is only a price (e.g. "12.99") - pair with previous line as description
    const priceOnly = line.match(/^\s*\$?\s*(\d+(?:\.\d{1,2})?)\s*$/);
    if (priceOnly && pendingDescription && !shouldSkipLine(pendingDescription)) {
      const amount = parseFloat(priceOnly[1]);
      if (amount > 0 && amount < 99999) {
        items.push({ description: pendingDescription, amount });
        pendingDescription = "";
        continue;
      }
    }

    const extracted = extractPrice(line);
    if (extracted) {
      const description = line
        .replace(extracted.match, "")
        .replace(/^[\s.\-]+|[\s.\-]+$/g, "")
        .trim();

      if (description && !shouldSkipLine(description)) {
        items.push({ description, amount: extracted.amount });
      }
      pendingDescription = "";
      continue;
    }

    // No price on this line - might be start of multi-line item
    if (!shouldSkipLine(line) && line.length > 1) {
      // If next line looks like a price, save as pending
      const nextLine = rawLines[i + 1];
      const nextIsPrice = nextLine && /^\s*\$?\s*\d+(?:\.\d{1,2})?\s*$/.test(nextLine);
      if (nextIsPrice) {
        pendingDescription = line;
      } else {
        // Standalone line - try to find $X.XX anywhere
        const anywhere = line.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
        if (anywhere) {
          const amount = parseFloat(anywhere[1]);
          const desc = line.replace(/\$\s*\d+(?:\.\d{1,2})?/, "").trim();
          if (desc && amount > 0 && amount < 99999 && !shouldSkipLine(desc)) {
            items.push({ description: desc, amount });
          }
        }
      }
    }
  }

  // Deduplicate by description+amount (OCR sometimes repeats)
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.description}|${item.amount}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function extractTextFromReceipt(imageBase64: string): Promise<{
  fullText: string;
  lineItems: ParsedLineItem[];
  receiptTotal: number | null;
  subtotal: number | null;
}> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const [result] = await client.documentTextDetection({
    image: { content: base64Data },
  });

  const fullText = result.fullTextAnnotation?.text || "";
  let lineItems = parseReceiptText(fullText);

  // Fallback: if structured parse found nothing, try splitting by common delimiters
  if (lineItems.length === 0 && fullText.length > 10) {
    const altItems = parseReceiptText(
      fullText.replace(/\t/g, "\n").replace(/\s{2,}/g, "\n")
    );
    if (altItems.length > 0) {
      lineItems = altItems;
    }
  }

  // Extract receipt total (TOTAL, Amount Paid, etc.) - the actual amount paid
  const receiptTotal = extractReceiptTotal(fullText);
  const subtotal = extractSubtotal(fullText);

  return { fullText, lineItems, receiptTotal, subtotal };
}

function extractReceiptTotal(text: string): number | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    // Look for TOTAL, Amount Paid - price on same line or next
    const isTotalLine =
      /^\s*total\s*$/i.test(lower) ||
      /total\s*$/i.test(lower) ||
      /^total\s+/i.test(lower) ||
      /amount\s*paid/i.test(lower);

    if (isTotalLine) {
      const m = line.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/);
      if (m) {
        const amount = parseFloat(m[1].replace(/,/g, ""));
        if (amount > 0 && amount < 999999) return amount;
      }
      // Price might be on next line
      const nextLine = lines[i + 1];
      if (nextLine) {
        const nm = nextLine.match(/^\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*$/);
        if (nm) {
          const amount = parseFloat(nm[1].replace(/,/g, ""));
          if (amount > 0 && amount < 999999) return amount;
        }
      }
    }
  }
  return null;
}

function extractSubtotal(text: string): number | null {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*subtotal\s*$/i.test(line) || /subtotal\s*$/i.test(line) || /^subtotal\s+/i.test(line)) {
      const m = line.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/);
      if (m) {
        const amount = parseFloat(m[1].replace(/,/g, ""));
        if (amount > 0 && amount < 999999) return amount;
      }
      const nextLine = lines[i + 1];
      if (nextLine) {
        const nm = nextLine.match(/^\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*$/);
        if (nm) {
          const amount = parseFloat(nm[1].replace(/,/g, ""));
          if (amount > 0 && amount < 999999) return amount;
        }
      }
    }
  }
  return null;
}
