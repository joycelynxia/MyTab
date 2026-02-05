import React, { useState, useCallback } from "react";
import type { Member, Split } from "../../types/types";
import "../../styling/Modal.css";

interface ParsedItem {
  description: string;
  amount: number;
}

interface ReceiptItem extends ParsedItem {
  id: string;
  splitMode: "assign" | "split";
  assignedTo: string;
  splitBetween: string[]; // memberIds when splitMode is "split"
}

interface AddExpenseFromReceiptModalProps {
  onClose: () => void;
  onAdd: (
    expenseName: string,
    amount: number,
    date: Date,
    payerId: string,
    splits: Split[]
  ) => void | Promise<void>;
  members: Member[];
  groupId: string;
}

const AddExpenseFromReceiptModal: React.FC<AddExpenseFromReceiptModalProps> = ({
  onClose,
  onAdd,
  members,
  groupId,
}) => {
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [rawOcrText, setRawOcrText] = useState<string | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [receiptTotal, setReceiptTotal] = useState<string>(""); // Actual amount paid (after tax, coupons)
  const [payerId, setPayerId] = useState("");
  const [date, setDate] = useState(new Date());

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setScanError(null);
      setRawOcrText(null);
      setReceiptTotal("");
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        if (!base64) return;

        setReceiptImage(reader.result as string);
        setIsScanning(true);

        try {
          const { apiFetch } = await import("../../api/client");
          const res = await apiFetch("/receipts/ocr", {
            method: "POST",
            body: JSON.stringify({ imageBase64: base64 }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to scan receipt");

          const lineItems: ReceiptItem[] = (data.lineItems || []).map(
            (item: ParsedItem, i: number) => ({
              id: `item-${i}-${Date.now()}`,
              description: item.description,
              amount: item.amount,
              splitMode: "split" as const,
              assignedTo: "",
              splitBetween: members.map((m) => m.id),
            })
          );

          setItems(lineItems);
          setRawOcrText(data.fullText || null);
          if (data.receiptTotal != null && data.receiptTotal > 0) {
            setReceiptTotal(data.receiptTotal.toFixed(2));
          }
          if (lineItems.length === 0 && data.fullText) {
            setScanError("No line items detected. You can add them manually below.");
          }
        } catch (err: any) {
          setScanError(err.message || "Failed to scan receipt. Add items manually.");
          setItems([]);
          setRawOcrText(null);
          setReceiptTotal("");
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    },
    [members]
  );

  const addManualItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: "",
        amount: 0,
        splitMode: "split",
        assignedTo: "",
        splitBetween: members.map((m) => m.id),
      },
    ]);
  };

  const updateItem = (id: string, updates: Partial<ReceiptItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleSplitMember = (itemId: string, memberId: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const current = item.splitBetween;
        const next = current.includes(memberId)
          ? current.filter((id) => id !== memberId)
          : [...current, memberId];
        return { ...item, splitBetween: next };
      })
    );
  };

  const getSplitsForItem = (item: ReceiptItem, amountOverride?: number): Split[] => {
    const amount = amountOverride ?? item.amount;
    if (amount <= 0) return [];

    if (item.splitMode === "assign" && item.assignedTo) {
      const member = members.find((m) => m.id === item.assignedTo);
      return [
        {
          memberId: item.assignedTo,
          memberName: member?.memberName,
          amount,
          percent: 100,
        },
      ];
    }

    const splitBetween = item.splitBetween.filter(Boolean);
    if (splitBetween.length === 0) return [];

    const perPerson = Math.floor((amount / splitBetween.length) * 100) / 100;
    const remainder = Math.round((amount - perPerson * splitBetween.length) * 100) / 100;
    return splitBetween.map((memberId, i) => {
      const member = members.find((m) => m.id === memberId);
      const isLast = i === splitBetween.length - 1;
      return {
        memberId,
        memberName: member?.memberName,
        amount: isLast ? perPerson + remainder : perPerson,
        percent: 100 / splitBetween.length,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!payerId) {
      alert("Please select who paid");
      return;
    }

    const validItems = items.filter(
      (i) =>
        i.description.trim() &&
        i.amount > 0 &&
        ((i.splitMode === "assign" && i.assignedTo) ||
          (i.splitMode === "split" && i.splitBetween.length > 0))
    );

    if (validItems.length === 0) {
      alert("Add at least one item with a description, amount, and split.");
      return;
    }

    const itemsSum = validItems.reduce((s, i) => s + i.amount, 0);
    const totalPaid = receiptTotal.trim() ? parseFloat(receiptTotal) : null;
    const shouldProrate =
      totalPaid != null && itemsSum > 0 && Math.abs(totalPaid - itemsSum) > 0.001;

    const scaleFactor = shouldProrate ? totalPaid! / itemsSum : 1;
    const proratedAmounts = validItems.map((item, idx) => {
      if (!shouldProrate) return item.amount;
      const scaled = Math.round(item.amount * scaleFactor * 100) / 100;
      if (idx === validItems.length - 1) {
        const soFar = proratedAmounts.slice(0, -1).reduce((s, a) => s + a, 0);
        return Math.round((totalPaid! - soFar) * 100) / 100;
      }
      return scaled;
    });

    for (let idx = 0; idx < validItems.length; idx++) {
      const item = validItems[idx];
      const amountToUse = proratedAmounts[idx];
      const splits = getSplitsForItem(item, amountToUse);
      if (splits.length === 1 && splits[0].memberId === payerId) {
        alert(
          `"${item.description}" cannot be assigned only to the payer. Add someone else or split between multiple people.`
        );
        return;
      }
    }

    for (let idx = 0; idx < validItems.length; idx++) {
      const item = validItems[idx];
      const amountToUse = getAmountForItem(item, idx);
      const splits = getSplitsForItem(item, amountToUse);
      await onAdd(item.description, amountToUse, date, payerId, splits);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal receipt-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add from receipt</h2>

        <div className="receipt-upload-section">
          <label className="receipt-upload-label">Upload receipt image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isScanning}
            className="receipt-file-input"
          />
          {isScanning && <p className="receipt-scanning">Scanning receipt...</p>}
          {scanError && <p className="receipt-error">{scanError}</p>}
          {rawOcrText && (
            <div className="receipt-raw-text">
              <button
                type="button"
                className="receipt-raw-toggle"
                onClick={() => setShowRawText(!showRawText)}
              >
                {showRawText ? "Hide" : "View"} raw OCR text
              </button>
              {showRawText && (
                <pre className="receipt-raw-content">{rawOcrText}</pre>
              )}
            </div>
          )}
          {receiptImage && !isScanning && (
            <img
              src={receiptImage}
              alt="Receipt preview"
              className="receipt-preview"
            />
          )}
        </div>

        <div className="receipt-items-section">
          <div className="receipt-items-header">
            <label>Line items</label>
            <button type="button" onClick={addManualItem} className="add-item-btn">
              + Add item
            </button>
          </div>

          <div className="receipt-items-list">
            {items.map((item) => (
              <div key={item.id} className="receipt-item-row">
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, { description: e.target.value })
                  }
                  className="receipt-item-desc"
                />
                <input
                  type="number"
                  placeholder="0.00"
                  value={item.amount || ""}
                  onChange={(e) =>
                    updateItem(item.id, {
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  min="0"
                  step="0.01"
                  className="receipt-item-amount"
                />

                <select
                  value={item.splitMode}
                  onChange={(e) =>
                    updateItem(item.id, {
                      splitMode: e.target.value as "assign" | "split",
                    })
                  }
                  className="receipt-item-mode"
                >
                  <option value="assign">Assign to</option>
                  <option value="split">Split between</option>
                </select>

                {item.splitMode === "assign" ? (
                  <select
                    value={item.assignedTo}
                    onChange={(e) =>
                      updateItem(item.id, { assignedTo: e.target.value })
                    }
                    className="receipt-item-assign"
                  >
                    <option value="">Select person</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.memberName}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="receipt-item-split">
                    {members.map((m) => (
                      <label key={m.id} className="receipt-split-checkbox">
                        <input
                          type="checkbox"
                          checked={item.splitBetween.includes(m.id)}
                          onChange={() => toggleSplitMember(item.id, m.id)}
                        />
                        {m.memberName}
                      </label>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="receipt-remove-btn"
                  aria-label="Remove item"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="receipt-meta">
          <div>
            <label htmlFor="receipt-total">
              Receipt total
              <span className="receipt-meta-hint"> (actual paid, after tax/coupons)</span>
            </label>
            <input
              id="receipt-total"
              type="number"
              placeholder="e.g. 25.45"
              min="0"
              step="0.01"
              value={receiptTotal}
              onChange={(e) => setReceiptTotal(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="receipt-payer">Paid by</label>
            <select
              id="receipt-payer"
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
            >
              <option value="">Select</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.memberName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="receipt-date">Date</label>
            <input
              id="receipt-date"
              type="date"
              value={date.toISOString().split("T")[0]}
              onChange={(e) => setDate(new Date(e.target.value))}
            />
          </div>
        </div>
        {receiptTotal && (() => {
          const itemsSum = items
            .filter((i) => i.description.trim() && i.amount > 0)
            .reduce((s, i) => s + i.amount, 0);
          const total = parseFloat(receiptTotal);
          const willProrate = itemsSum > 0 && !isNaN(total) && Math.abs(total - itemsSum) > 0.01;
          return willProrate ? (
            <p className="receipt-prorate-note">
              Items sum to ${itemsSum.toFixed(2)} but receipt total is ${total.toFixed(2)}. Amounts will be
              prorated so splits match what was actually paid (tax, coupons included).
            </p>
          ) : null;
        })()}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="add-btn"
            disabled={items.length === 0}
          >
            Add {items.filter((i) => i.description && i.amount > 0).length} expense(s)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseFromReceiptModal;
