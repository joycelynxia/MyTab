import { useState, useMemo } from "react";
import "../styling/GroupPage.css";
import "../styling/SearchBar.css";
import type { Member, Expense, Settlement, Group, Split } from "../types/types";
import { useGroupData } from "../hooks/useGroupData";
import { useExpenses } from "../hooks/useExpenses";
import { useMembers } from "../hooks/useMembers";
import { useSettlements } from "../hooks/useSettlements";
import AddMemberModal from "../components/modals/AddMemberModal";
import AddSettlementModal from "../components/modals/AddSettlementModal";
import AddExpenseModal from "../components/modals/AddExpenseModal";
import AddExpenseFromReceiptModal from "../components/modals/AddExpenseFromReceiptModal";
import { useParams } from "react-router-dom";
import { createMember } from "../api/members";
import BalancesTab from "../components/tabs/BalancesTab";
import SettlementsTab from "../components/tabs/SettlementsTab";
import ExpensesTab from "../components/tabs/ExpensesTab";
import {
  updateBalancesAfterExpense,
  updateBalancesAfterSettlement,
} from "../utils/groupActions";
import ExpensesTable from "../components/ExpensesTable";
import SettlementsTable from "../components/SettlementsTable";
import ViewToggle from "../components/ViewToggle";
import { exportExpensesToExcel } from "../utils/exportToExcel";
import { formatDate } from "../utils/formatStrings";

const GroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const group = useGroupData(groupId);
  const [members, setMembers] = useMembers(groupId);
  const [expenses, setExpenses] = useExpenses(groupId);
  const [settlements, setSettlements] = useSettlements(groupId);

  const [tab, setTab] = useState("balances");

  const [openMemberModal, setOpenMemberModal] = useState(false);
  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [openSettlementModal, setOpenSettlementModal] = useState(false);

  const [expenseView, setExpenseView] = useState<"list" | "grid">("list");
  const [settlementView, setSettlementView] = useState<"list" | "grid">("list");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [settlementSearch, setSettlementSearch] = useState("");
  const [openMemberView, setOpenMemberView] = useState(false);
  const [openExpenseView, setOpenExpenseView] = useState(false);
  const [openSettlementView, setOpenSettlementView] = useState(false);

  const addMember = (memberName: string) => {
    console.log("adding new member to group");
    let id;
    if (groupId) {
      id = String(createMember(groupId, memberName));
    }
    // create new member object and add to array
    const newMember: Member = {
      groupId: groupId!,
      memberName,
      id: id!,
      balance: 0,
    };
    setMembers([...members, newMember]);
    setOpenMemberModal(false);
  };

  const addExpense = async ({
    expenseName,
    amount,
    date,
    payerId,
    splits,
  }: {
    expenseName: string;
    amount: number;
    date: Date;
    payerId: string;
    splits: Split[];
  }) => {
    console.log("adding new expense to group");

    try {
      const res = await fetch(`http://localhost:3000/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId, expenseName, amount, payerId, splits }),
      });

      const data = await res.json();
      console.log("created new expense and updated respective balances", data);

      const newExpense: Expense = {
        id: data.id,
        groupId: groupId!,
        expenseName,
        amount,
        date,
        splits,
        payerId,
      };
      console.log("SPLITS:", splits);
      setExpenses([...expenses, newExpense]);
      setMembers(updateBalancesAfterExpense(members, payerId, amount, splits));
    } catch (error) {
      console.error(error);
    }

    setOpenExpenseModal(false);
  };

  const createSettlement = async (
    payerId: string,
    payeeId: string,
    amount: number,
    note: string
  ) => {
    if (Math.round(amount * 100) === 0) return;

    const res = await fetch(`http://localhost:3000/settlements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, payerId, payeeId, amount, note }),
    });

    if (!res.ok) {
      throw new Error("failed to create new settlement");
    }

    const data = await res.json();
    const newSettlement: Settlement = {
      id: data.id,
      groupId: groupId!,
      note,
      payeeId,
      payerId,
      date: data.date,
      amount,
    };

    setMembers((prev) =>
      updateBalancesAfterSettlement(prev, payerId, payeeId, amount)
    );
    setSettlements((prev) => [...prev, newSettlement]);
  };

  const addSettlement = async ({
    payerId,
    payeeId,
    amount,
    note,
  }: {
    payerId: string;
    payeeId: string;
    amount: number;
    note: string;
  }) => {
    try {
      await createSettlement(payerId, payeeId, amount, note);
      setOpenSettlementModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const getNameFromId = (id: string) => {
    const member = members.find((m) => m.id === id);
    return member ? member.memberName : undefined;
  };

  const filteredExpenses = useMemo(() => {
    if (!expenseSearch.trim()) return expenses;
    const term = expenseSearch.toLowerCase().trim();
    return expenses.filter((expense) => {
      const payerName = getNameFromId(expense.payerId)?.toLowerCase() ?? "";
      const dateStr = formatDate(expense.date).toLowerCase();
      return (
        expense.expenseName.toLowerCase().includes(term) ||
        payerName.includes(term) ||
        expense.amount.toString().includes(term) ||
        dateStr.includes(term)
      );
    });
  }, [expenses, expenseSearch, members]);

  const filteredSettlements = useMemo(() => {
    if (!settlementSearch.trim()) return settlements;
    const term = settlementSearch.toLowerCase().trim();
    return settlements.filter((settlement) => {
      const payerName = getNameFromId(settlement.payerId)?.toLowerCase() ?? "";
      const payeeName = getNameFromId(settlement.payeeId)?.toLowerCase() ?? "";
      const note = (settlement.note ?? "").toLowerCase();
      const dateStr = settlement.date
        ? formatDate(settlement.date).toLowerCase()
        : "";
      return (
        note.includes(term) ||
        payerName.includes(term) ||
        payeeName.includes(term) ||
        settlement.amount.toString().includes(term) ||
        dateStr.includes(term)
      );
    });
  }, [settlements, settlementSearch, members]);

  const formatBalanceString = (balance: number) => {
    if (balance < 0) {
      return `-$${Math.abs(balance).toFixed(2)}`;
    } else if (balance > 0) {
      return `+$${balance.toFixed(2)}`;
    } else {
      return "$0";
    }
  };

  const handleViewMember = (memberId: string) => {
    console.log("viewing details for member");
  };

  return (
    <div className="group-page-container">
      <h3 className="group-name">{group?.groupName}</h3>

      <div className="tabs">
        {["balances", "expenses", "settlements"].map((t) => (
          <div
            key={t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </div>
        ))}
      </div>
      {/* add member to group */}
      {tab === "balances" && (
        <div className="tab-content">
          <BalancesTab
            members={members}
            onAddMember={() => setOpenMemberModal(true)}
            onViewMember={() => {}}
            formatBalanceString={formatBalanceString}
            onMarkAsPaid={(payerId, payeeId, amount) =>
              createSettlement(payerId, payeeId, amount, "Settle up")
            }
          />
        </div>
      )}
      {tab === "expenses" && (
        <div className="tab-content">
          <div className="toolbar">
            <div className="search-bar">
              <input
                type="search"
                placeholder="Search expenses..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                aria-label="Search expenses"
              />
            </div>
            <ViewToggle view={expenseView} onViewChange={setExpenseView} />
            <button onClick={() => exportExpensesToExcel(expenses, members)}>
              export
            </button>
            <button onClick={() => setOpenReceiptModal(true)}>
              add from receipt
            </button>
            <button onClick={() => setOpenExpenseModal(true)}>
              + new expense
            </button>
          </div>
          {expenseView === "grid" ? (
            <ExpensesTable members={members} expenses={filteredExpenses} />
          ) : (
            <ExpensesTab
              expenses={filteredExpenses}
              getNameFromId={getNameFromId}
            />
          )}
        </div>
      )}

      {/* manually settle */}
      {tab === "settlements" && (
        <div className="tab-content">
          <div className="toolbar">
            <div className="search-bar">
              <input
                type="search"
                placeholder="Search settlements..."
                value={settlementSearch}
                onChange={(e) => setSettlementSearch(e.target.value)}
                aria-label="Search settlements"
              />
            </div>
            <ViewToggle
              view={settlementView}
              onViewChange={setSettlementView}
            />
            <button onClick={() => setOpenSettlementModal(true)}>
              + new settlement
            </button>
          </div>
          {settlementView === "grid" ? (
            <SettlementsTable
              members={members}
              settlements={filteredSettlements}
            />
          ) : (
            <SettlementsTab
              settlements={filteredSettlements}
              getNameFromId={getNameFromId}
            />
          )}
        </div>
      )}

      {/* modals for adding members, expenses, and settlements */}
      {openMemberModal && (
        <AddMemberModal
          onAdd={addMember}
          onClose={() => setOpenMemberModal(false)}
        />
      )}

      {openExpenseModal && (
        <AddExpenseModal
          onAdd={(expenseName, amount, date, payerId, splitBetween) =>
            addExpense({
              expenseName,
              amount,
              date,
              payerId,
              splits: splitBetween,
            })
          }
          onClose={() => setOpenExpenseModal(false)}
          members={members}
        />
      )}

      {openReceiptModal && groupId && (
        <AddExpenseFromReceiptModal
          onAdd={(expenseName, amount, date, payerId, splits) =>
            addExpense({
              expenseName,
              amount,
              date,
              payerId,
              splits,
            })
          }
          onClose={() => setOpenReceiptModal(false)}
          members={members}
          groupId={groupId}
        />
      )}

      {openSettlementModal && (
        <AddSettlementModal
          onAdd={(payerId, payeeId, amount, note) =>
            addSettlement({ payerId, payeeId, amount, note })
          }
          onClose={() => setOpenSettlementModal(false)}
          members={members}
        />
      )}
    </div>
  );
};

export default GroupPage;
