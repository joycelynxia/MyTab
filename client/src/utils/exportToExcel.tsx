import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { Expense, Member } from "../types/types";
import { getNameFromId } from "../utils/formatStrings";

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
