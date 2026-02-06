import React, { useState } from "react";
import type { Member, Split } from "../../types/types";
// import Select from "react-select";
import "../../styling/Modal.css";
import SplitOption from "../SplitOption";

interface ImageItem {
  id: string;
  preview: string;
  base64: string;
}

interface AddExpenseModalProps {
  onClose: () => void;
  onAdd: (
    expenseName: string,
    amount: number,
    date: Date,
    payerId: string,
    splitBetween: Split[],
    imageData?: string[]
  ) => void;
  members: Member[];
}

const EPSILON = 0.05; // tolerance for float comparison (rounding)

const AddExpenseModal = ({ onClose, onAdd, members }: AddExpenseModalProps) => {
  const [expenseName, setExpenseName] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<Date>(new Date());
  const [payerId, setPayerId] = useState<string>("");
  const [participants, setParticipants] = useState<Split[]>([]);
  const [option, setOption] = useState<
    "equally" | "as percents" | "as amounts"
  >("equally");
  const [images, setImages] = useState<ImageItem[]>([]);
  const [error, setError] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !expenseName.trim() ||
      !amount ||
      !payerId ||
      participants.length === 0
    ) {
      setError("Please fill in all fields");
      return;
    }

    if (
      participants.length === 1 &&
      participants[0].memberId === payerId
    ) {
      setError("An expense cannot have only the payer in the split. Add at least one other person or remove the payer from the split.");
      return;
    }

    const runningTotal = participants.reduce(
      (sum, m) => sum + (Number(m.amount) || 0),
      0
    );
    const totalPercent = participants.reduce(
      (sum, m) => sum + (Number(m.percent) || 0),
      0
    );

    if (
      (option === "as amounts" || option === "equally") &&
      Math.abs(runningTotal - amount) > EPSILON
    ) {
      setError("Individual amounts do not add up to the total amount");
      return;
    }
    if (
      option === "as percents" &&
      Math.abs(totalPercent - 100) > EPSILON
    ) {
      setError("Percentages do not add up to 100%");
      return;
    }

    let finalParticipants = [...participants];

    // Update percents to match amounts (or amounts to match percents)
    if (option === "as amounts" || option === "equally") {
      finalParticipants = finalParticipants.map((m) => ({
        ...m,
        amount: Number(m.amount) || 0,
        percent: (amount > 0 ? (Number(m.amount) || 0) / amount : 0) * 100,
      }));
    } else if (option === "as percents") {
      finalParticipants = finalParticipants.map((m) => ({
        ...m,
        percent: Number(m.percent) || 0,
        amount: (amount * (Number(m.percent) || 0)) / 100,
      }));
    }
    const imageData = images.length > 0 ? images.map((img) => img.base64) : undefined;
    onAdd(expenseName, amount, date, payerId, finalParticipants, imageData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        if (!base64) return;
        setImages((prev) => [
          ...prev,
          { id: `${Date.now()}-${Math.random()}`, preview: dataUrl, base64 },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>add an expense</h2>

        <form onSubmit={handleSubmit}>
          {error && <p className="modal-error">{error}</p>}
          <label htmlFor="expenseName">description</label>
          <input
            id="expenseName"
            type="text"
            value={expenseName}
            onChange={(e) => setExpenseName(e.target.value)}
          />
          <div className="expense-image-upload">
            <label htmlFor="image">images</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            {images.length > 0 && (
              <div className="expense-image-previews">
                {images.map((img) => (
                  <div key={img.id} className="expense-image-preview-wrap">
                    <img
                      src={img.preview}
                      alt=""
                      className="expense-image-preview"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="expense-image-remove"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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

          <SplitOption
            members={members}
            total={amount}
            participants={participants}
            setParticipants={setParticipants}
            option={option}
            setOption={setOption}
            disabled={!amount || amount <= 0}
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
