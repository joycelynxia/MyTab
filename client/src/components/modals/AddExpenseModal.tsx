import React, { useState } from "react";
import type { Member, Split } from "../../types/types";
import Select from "react-select";
import "../../styling/Modal.css";

interface AddExpenseModalProps {
  onClose: () => void;
  onAdd: (
    expenseName: string,
    amount: number,
    date: Date,
    payerId: string,
    splitBetween: Split[]
  ) => void;
  members: Member[];
}

const AddExpenseModal = ({ onClose, onAdd, members }: AddExpenseModalProps) => {
  const [expenseName, setExpenseName] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<Date>(new Date());
  const [payerId, setPayerId] = useState<string>("");
  const [participants, setParticipants] = useState<Record<string, string>[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !expenseName.trim() ||
      !amount ||
      !payerId ||
      participants.length === 0
    ) {
      alert("please fill in all fields");
      return;
    }
    const splitBetween = handleSplitBetween();
    console.log(splitBetween);
    console.log("add fields filled - now adding expense");
    onAdd(expenseName, amount, date, payerId, splitBetween);
  };

  const handleSelectParticipants = (selectedOptions: any) => {
    const selectedMembers = selectedOptions
      ? selectedOptions.map((opt: any) => ({
          memberId: opt.value,
          memberName: opt.label,
        }))
      : [];
    setParticipants(selectedMembers);
  };

  const handleSplitBetween = () => {
    const splits: Split[] = participants.map((participant) => ({
      memberId: participant.memberId,
      memberName: participant.memberName,
      amount: amount / participants.length,
    }));
    return splits;
    // OR if you want to append to existing splits:
    // setSplitBetween(prev => [...prev, ...newSplits]);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>add an expense</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="expenseName">description</label>
          <input
            id="expenseName"
            type="text"
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
          />

          <label htmlFor="amount">amount</label>
          <input
            id="amount"
            type="number"
            placeholder="enter amount"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min="0"
            step="0.01"
          />

          <label htmlFor="date">date</label>
          <input
            id="date"
            type="date"
            value={date.toISOString().split("T")[0]}
            onChange={(e) => setDate(new Date(e.target.value))}
          />

          <label htmlFor="payer">paid by</label>
          <select
            id="payer"
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
          >
            <option value="" disabled></option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.memberName}
              </option>
            ))}
          </select>

          <label>split evenly with</label>
          <Select
            isMulti
            options={members.map((m) => ({
              value: m.id,
              label: m.memberName,
            }))}
            onChange={handleSelectParticipants}
            placeholder="select members"
            className="select-dropdown"
          />

          <div className="modal-actions">
            <button type="submit" className="add-btn">
              add
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
