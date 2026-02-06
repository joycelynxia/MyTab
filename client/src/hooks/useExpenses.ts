import { useEffect, useState } from "react";
import type { Expense } from "../types/types";
import { apiFetch } from "../api/client";

export const useExpenses = (groupId?: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!groupId) return;

    const fetchExpenses = async () => {
      try {
        const res = await apiFetch(`/expenses/fromGroup/${groupId}`);
        if (!res.ok) throw new Error("Failed to fetch expenses");
        const data = await res.json();
        setExpenses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching expenses:", err);
        setExpenses([]);
      }
    };

    fetchExpenses();
  }, [groupId]);

  return [expenses, setExpenses] as const;
};
