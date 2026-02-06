import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { Expense, Member, Settlement } from "../types/types";
import { getNameFromId } from "../utils/formatStrings";

interface BalanceEvent {
  date: string;
  memberId: string;
  memberName: string;
  type: string;
  description: string;
  amount: number;
}

function buildSummaryRows(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[]
) {
  const totals = new Map<
    string,
    { paid: number; owed: number; settlementsPaid: number; settlementsReceived: number }
  >();
  for (const m of members) {
    totals.set(m.id, { paid: 0, owed: 0, settlementsPaid: 0, settlementsReceived: 0 });
  }
  for (const e of expenses) {
    const t = totals.get(e.payerId);
    if (t) t.paid += e.amount;
    for (const s of e.splits) {
      const t2 = totals.get(s.memberId);
      if (t2) t2.owed += s.amount;
    }
  }
  for (const s of settlements) {
    const tp = totals.get(s.payerId);
    if (tp) tp.settlementsPaid += s.amount;
    const tr = totals.get(s.payeeId);
    if (tr) tr.settlementsReceived += s.amount;
  }
  return members.map((m) => {
    const t = totals.get(m.id)!;
    const balance = typeof m.balance === "number" ? m.balance : 0;
    const status = balance > 0 ? "Owed" : balance < 0 ? "Owes" : "Settled";
    return {
      Member: m.memberName,
      "Total Paid (as payer)": t.paid.toFixed(2),
      "Total Owed (shares)": t.owed.toFixed(2),
      "Settlements Paid": t.settlementsPaid.toFixed(2),
      "Settlements Received": t.settlementsReceived.toFixed(2),
      "Net Balance": balance.toFixed(2),
      Status: status,
    };
  });
}

function buildItemizedRows(
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[]
): BalanceEvent[] {
  const events: BalanceEvent[] = [];
  const getName = (id: string) => getNameFromId(members, id) ?? "Unknown";
  for (const e of expenses) {
    const dateStr = new Date(e.date).toISOString().split("T")[0];
    events.push({
      date: dateStr,
      memberId: e.payerId,
      memberName: getName(e.payerId),
      type: "Expense paid",
      description: e.expenseName,
      amount: e.amount,
    });
    for (const s of e.splits) {
      events.push({
        date: dateStr,
        memberId: s.memberId,
        memberName: s.memberName ?? getName(s.memberId),
        type: "Expense share",
        description: e.expenseName,
        amount: -s.amount,
      });
    }
  }
  for (const s of settlements) {
    const dateStr = s.date
      ? (typeof s.date === "string" ? s.date : new Date(s.date).toISOString()).split("T")[0]
      : "";
    const payeeName = getName(s.payeeId);
    const payerName = getName(s.payerId);
    events.push({
      date: dateStr,
      memberId: s.payerId,
      memberName: payerName,
      type: "Settlement paid",
      description: `Paid ${payeeName}`,
      amount: s.amount,
    });
    events.push({
      date: dateStr,
      memberId: s.payeeId,
      memberName: payeeName,
      type: "Settlement received",
      description: `From ${payerName}`,
      amount: -s.amount,
    });
  }
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

export const exportBalancesToExcel = (
  members: Member[],
  expenses: Expense[],
  settlements: Settlement[],
  groupName?: string
) => {
  const summaryData = buildSummaryRows(members, expenses, settlements);
  const events = buildItemizedRows(members, expenses, settlements);

  const runningBalance = new Map<string, number>();
  for (const m of members) {
    runningBalance.set(m.id, 0);
  }
  const itemizedData = events.map((ev) => {
    const prev = runningBalance.get(ev.memberId) ?? 0;
    const next = prev + ev.amount;
    runningBalance.set(ev.memberId, next);
    const amountStr = ev.amount >= 0 ? `+${ev.amount.toFixed(2)}` : ev.amount.toFixed(2);
    return {
      Member: ev.memberName,
      Type: ev.type,
      Date: ev.date,
      Description: ev.description,
      Amount: amountStr,
      "Balance After": next.toFixed(2),
    };
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  const wsItemized = XLSX.utils.json_to_sheet(itemizedData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
  XLSX.utils.book_append_sheet(wb, wsItemized, "Itemized");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  const safeName = groupName?.replace(/[/\\?*:|"]/g, "_").trim() || "";
  const filename = safeName ? `balances-${safeName}.xlsx` : "group-balances.xlsx";
  saveAs(blob, filename);
};

export const exportExpensesToExcel = (expenses: Expense[], members: Member[]) => {
  // Transform data into a JSON array
  const exportData = expenses.map((expense) => ({
    Date: String(expense.date).split("T")[0],
    Description: expense.expenseName,
    Amount: expense.amount.toFixed(2),
    Payer: getNameFromId(members, expense.payerId),
    "Split Between": expense.splits
      .map((p) => `${p.memberName}: ${p.amount.toFixed(2)}`)
      .join(", "),
  }));

  // Create a worksheet from JSON
  const ws = XLSX.utils.json_to_sheet(exportData);

  // Create a new workbook and append the worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Expenses");

  // Write the workbook and trigger download
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/octet-stream" });
  saveAs(blob, "expenses.xlsx");
};
