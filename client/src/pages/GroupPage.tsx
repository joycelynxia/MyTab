import { useState } from "react";
import "../styling/GroupPage.css";
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
import SettlementsTab from "../components/tabs/SettlementsTab";
import ExpensesTab from "../components/tabs/ExpensesTab";
import {
  updateBalancesAfterExpense,
  updateBalancesAfterSettlement,
} from "../utils/groupActions";
import ExpensesTable from "../components/ExpensesTable";
import SettlementsTable from "../components/SettlementsTable";
import { exportExpensesToExcel } from "../utils/exportToExcel";

const GroupPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const group = useGroupData(groupId);
  const [members, setMembers] = useMembers(groupId);
  const [expenses, setExpenses] = useExpenses(groupId);
  const [settlements, setSettlements] = useSettlements(groupId);

  const [tab, setTab] = useState("balances");

  const [openMemberModal, setOpenMemberModal] = useState(false);
  const [openExpenseModal, setOpenExpenseModal] = useState(false);
  const [openSettlementModal, setOpenSettlementModal] = useState(false);

  const [tableView, setTableView] = useState(false);
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
    console.log("adding new settlement to group");

    try {
      console.log("inside try catch statement");
      const res = await fetch(`http://localhost:3000/settlements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, payerId, payeeId, amount, note }),
      });
      console.log("response status:", res.status);

      if (!res.ok) {
        throw new Error("failed to create new settlement");
      }
      console.log("wha the sfadg");

      const data = await res.json();
      console.log("added new settlement", data);

      const newSettlement: Settlement = {
        id: data.id,
        groupId: groupId!,
        note,
        payeeId,
        payerId,
        date: data.date,
        amount,
      };

      // update new balance on frontend
      console.log("updating balance of payer and payee");
      setMembers(
        updateBalancesAfterSettlement(members, payerId, payeeId, amount)
      );
      console.log("updating settlements");
      setSettlements((prevSettlements) => [...prevSettlements, newSettlement]);

      setOpenSettlementModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const getNameFromId = (id: string) => {
    // console.log("member id:", id);
    const member = members.find((m) => m.id === id);
    return member ? member.memberName : undefined;
  };

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
        <BalancesTab
          members={members}
          onAddMember={() => setOpenMemberModal(true)}
          onViewMember={() => {}}
          formatBalanceString={formatBalanceString}
        />
      )}
      {tab === "expenses" && (
        <div>
          <button onClick={() => setTableView(!tableView)}>
            {tableView ? "list view" : "table view"}
          </button>
          <button onClick={() => exportExpensesToExcel(expenses, members)}>
            export to excel
          </button>

          {tableView ? (
            <ExpensesTable members={members} expenses={expenses} />
          ) : (
            <ExpensesTab expenses={expenses} getNameFromId={getNameFromId} />
          )}
          <button onClick={() => setOpenExpenseModal(true)}>
            + add expense
          </button>
        </div>
      )}

      {/* manually settle */}
      {tab === "settlements" && (
        <div>
          <button onClick={() => setTableView(!tableView)}>
            {tableView ? "list view" : "table view"}
          </button>
          {tableView ? (
            <SettlementsTable members={members} settlements={settlements} />
          ) : (
            <SettlementsTab
              settlements={settlements}
              getNameFromId={getNameFromId}
            />
          )}
          <button onClick={() => setOpenSettlementModal(true)}>
            + add settlement
          </button>
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
