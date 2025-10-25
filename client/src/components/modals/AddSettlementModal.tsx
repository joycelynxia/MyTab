import { useState } from "react";
import type { Member } from "../../types/types";

interface AddSettlementModalProps {
  onClose: () => void;
  onAdd: (
    payerId: string,
    payeeId: string,
    amount: number,
    note: string
  ) => void;
  members: Member[];
}

const AddSettlementModal = ({
  onClose,
  onAdd,
  members,
}: AddSettlementModalProps) => {
  const [payerId, setPayerId] = useState<string>("");
  const [payeeId, setPayeeId] = useState<string>("");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState<string>("");

  const handleAdd = () => {
    if (!payerId || !payerId || !amount || !note) {
      alert("please include a payer, payee, note, and amount to be settled");
      return;
    }

    if (payerId === payeeId) {
      alert("payer and payee cannot be the same");
      return;
    }

    onAdd(payerId, payeeId, amount, note);

    setPayerId("");
    setPayeeId("");
    setAmount(0);
    setNote("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>add settlement</h2>

        <label htmlFor="payer">From</label>
        <select
          id="payer"
          value={payerId}
          onChange={(e) => setPayerId(e.target.value)}
        >
          <option value="" disabled>
            select payer
          </option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.memberName}
            </option>
          ))}
        </select>

        <label htmlFor="payee">To</label>
        <select
          id="payee"
          value={payeeId}
          onChange={(e) => setPayeeId(e.target.value)}
        >
          <option value="" disabled>
            select payee
          </option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.memberName}
            </option>
          ))}
        </select>

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

        <label htmlFor="note">add a note</label>
        <input
          id="note"
          type="text"
          placeholder="reason for paying"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="modal-actions">
          <button onClick={handleAdd}>add</button>
          <button onClick={onClose}>close</button>
        </div>
      </div>
    </div>
  );
};

export default AddSettlementModal;
