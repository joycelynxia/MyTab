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
import { useParams } from "react-router-dom";
import { createMember } from "../api/members";
import BalancesTab from "../components/tabs/BalancesTab";
import MemberBalanceDetailModal from "../components/modals/MemberBalanceDetailModal";
import SettlementsTab from "../components/tabs/SettlementsTab";
import ExpensesTab from "../components/tabs/ExpensesTab";
import {
  updateBalancesAfterExpense,
  updateBalancesAfterSettlement,
} from "../utils/groupActions";
import ExpensesTable from "../components/ExpensesTable";
import SettlementsTable from "../components/SettlementsTable";
import ViewToggle from "../components/ViewToggle";
import { apiFetch } from "../api/client";
import { exportBalancesToExcel } from "../utils/exportToExcel";
import { formatDate } from "../utils/formatStrings";

type GroupRole = "admin" | "participant" | "viewer";

const GroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const group = useGroupData(groupId) as (Group & { myRole?: GroupRole; accessLevel?: "full" | "add_only"; shareToken?: string }) | undefined;
  const accessLevel = group?.accessLevel ?? "full";
  const canEdit = accessLevel === "full" || accessLevel === "add_only";
  const canDelete = accessLevel === "full";
  const [members, setMembers] = useMembers(groupId);
  const [expenses, setExpenses] = useExpenses(groupId);
  const [settlements, setSettlements] = useSettlements(groupId);

  const [tab, setTab] = useState("balances");

  const [openMemberModal, setOpenMemberModal] = useState(false);
  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [openSettlementModal, setOpenSettlementModal] = useState(false);

  const [expenseView, setExpenseView] = useState<"list" | "grid">("list");
  const [settlementView, setSettlementView] = useState<"list" | "grid">("list");
  const [expenseSearch, setExpenseSearch] = useState("");
  const [settlementSearch, setSettlementSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

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
    imageData,
  }: {
    expenseName: string;
    amount: number;
    date: Date;
    payerId: string;
    splits: Split[];
    imageData?: string[];
  }) => {
    console.log("adding new expense to group");

    try {
      const res = await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify({ groupId, expenseName, amount, payerId, splits, imageData }),
      });

      const data = await res.json();
      console.log("created new expense and updated respective balances", data);

      const newExpense: Expense = {
        id: data.id,
        groupId: groupId!,
        expenseName: data.expenseName ?? expenseName,
        amount: data.amount ?? amount,
        date: data.date ?? date,
        splits: data.splits ?? splits,
        payerId: data.payerId ?? payerId,
        imageData: data.imageData ?? imageData,
      };
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

    const res = await apiFetch("/settlements", {
      method: "POST",
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

  const deleteExpense = async (expenseId: string) => {
    try {
      const res = await apiFetch(`/expenses/${expenseId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      const expense = expenses.find((e) => e.id === expenseId);
      if (expense) {
        setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
        setMembers((prev) =>
          prev.map((m) => {
            if (m.id === expense.payerId) return { ...m, balance: m.balance + expense.amount };
            const split = expense.splits?.find((s) => s.memberId === m.id);
            if (split) return { ...m, balance: m.balance - split.amount };
            return m;
          })
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteSettlement = async (settlementId: string) => {
    try {
      const res = await apiFetch(`/settlements/${settlementId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      const settlement = settlements.find((s) => s.id === settlementId);
      if (settlement) {
        setSettlements((prev) => prev.filter((s) => s.id !== settlementId));
        setMembers((prev) =>
          updateBalancesAfterSettlement(prev, settlement.payeeId, settlement.payerId, settlement.amount)
        );
      }
    } catch (error) {
      console.error(error);
    }
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
    setSelectedMemberId(memberId);
  };
  const selectedMember = selectedMemberId
    ? members.find((m) => m.id === selectedMemberId) ?? null
    : null;

  const inviteLink = group?.shareToken
    ? `${window.location.origin}/groups/join/${group.shareToken}`
    : "";

  const copyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
    }
  };

  return (
    <div className="group-page-container">
      <div className="group-header-row">
        <h3 className="group-name">{group?.groupName}</h3>
        {inviteLink && (
          <button className="copy-link-btn" onClick={copyInviteLink} title="Copy invite link">
            Copy invite link
          </button>
        )}
      </div>

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
            onAddMember={canEdit ? () => setOpenMemberModal(true) : undefined}
            onViewMember={handleViewMember}
            formatBalanceString={formatBalanceString}
            onMarkAsPaid={canEdit ? (payerId, payeeId, amount) =>
              createSettlement(payerId, payeeId, amount, "Settle up") : undefined}
            onExportBalances={() =>
              exportBalancesToExcel(members, expenses, settlements, group?.groupName)}
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
            {/* <button onClick={() => exportExpensesToExcel(expenses, members)}>
              export
            </button> */}
            {canEdit && (
              <>
                {/* <button onClick={() => setOpenReceiptModal(true)}>
                  add from receipt
                </button> */}
                <button onClick={() => setOpenExpenseModal(true)}>
                  + new expense
                </button>
              </>
            )}
          </div>
          {expenseView === "grid" ? (
            <ExpensesTable
              members={members}
              expenses={filteredExpenses}
              canDelete={canDelete}
              onDeleteExpense={deleteExpense}
            />
          ) : (
            <ExpensesTab
              expenses={filteredExpenses}
              getNameFromId={getNameFromId}
              canDelete={canDelete}
              onDeleteExpense={deleteExpense}
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
            {canEdit && (
              <button onClick={() => setOpenSettlementModal(true)}>
                + new settlement
              </button>
            )}
          </div>
          {settlementView === "grid" ? (
            <SettlementsTable
              members={members}
              settlements={filteredSettlements}
              canDelete={canDelete}
              onDeleteSettlement={deleteSettlement}
            />
          ) : (
            <SettlementsTab
              settlements={filteredSettlements}
              getNameFromId={getNameFromId}
              canDelete={canDelete}
              onDeleteSettlement={deleteSettlement}
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
          onAdd={(expenseName, amount, date, payerId, splitBetween, imageData) =>
            addExpense({
              expenseName,
              amount,
              date,
              payerId,
              splits: splitBetween,
              imageData,
            })
          }
          onClose={() => setOpenExpenseModal(false)}
          members={members}
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

      {selectedMember && (
        <MemberBalanceDetailModal
          member={selectedMember}
          members={members}
          expenses={expenses}
          settlements={settlements}
          formatBalanceString={formatBalanceString}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </div>
  );
};

export default GroupPage;
