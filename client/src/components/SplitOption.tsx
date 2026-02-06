import { useState, useEffect } from "react";
import "../styling/SplitOption.css";
import type { Member, Split } from "../types/types";

interface Props {
  members: Member[];
  total: number;
  participants: Split[];
  setParticipants: React.Dispatch<React.SetStateAction<Split[]>>;
  option: "equally" | "as percents" | "as amounts";
  setOption: React.Dispatch<
    React.SetStateAction<"equally" | "as percents" | "as amounts">
  >;
  disabled?: boolean;
}

const SplitOption: React.FC<Props> = ({
  members,
  total,
  participants,
  setParticipants,
  option,
  setOption,
  disabled = false,
}) => {
  const [showOptions, setShowOptions] = useState<boolean>(false);

  useEffect(() => {
    if (!members || members.length === 0) return;

    setParticipants(
      members.map((m) => ({
        memberId: m.id,
        memberName: m.memberName,
        amount: total / members.length,
        percent: 100 / members.length,
      }))
    );
  }, [total, members]);

  const handleSetEqually = () => {
    setOption("equally");
    setParticipants((prev) =>
      prev.map((m) => ({
        ...m,
        percent: 100 / prev.length,
        amount: total / prev.length,
      }))
    );

    setShowOptions(false);
  };

  const handleSetPercents = () => {
    setOption("as percents");
    setShowOptions(false);
  };

  const handleSetAmounts = () => {
    setOption("as amounts");
    setShowOptions(false);
  };

  const handleSelectParticipants = (member: {
    id: string;
    memberName: string;
  }) => {
    setParticipants((prev) => {
      const memberToDelete = prev.find((p) => p.memberId === member.id);
      if (memberToDelete) {
        // Remove the member first
        const remaining = prev.filter((p) => p.memberId !== member.id);
        if (remaining.length === 0) return remaining;
        const amountToDistribute = memberToDelete.amount / remaining.length;
        const percentToDistribute = memberToDelete.percent / remaining.length;

        return remaining.map((p) => ({
          ...p,
          amount: p.amount + amountToDistribute,
          percent: p.percent + percentToDistribute,
        }));
      } else {
        // Add the participant
        return [
          ...prev,
          {
            memberId: member.id,
            memberName: member.memberName,
            amount: 0,
            percent: 0,
          },
        ];
      }
    });

    if (option === "equally") {
      handleSetEqually();
    } else if (option === "as amounts") {
      handleSetAmounts();
    } else {
      handleSetPercents();
    }
  };

  const getSplitAmount = (id: string) => {
    const member = participants.find((m) => m.memberId === id);
    return member?.amount.toFixed(2);
  };

  const handleAmountChange = (memberId: string, value: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.memberId === memberId ? { ...p, amount: value } : p))
    );
  };

  const handlePercentChange = (memberId: string, value: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.memberId === memberId ? { ...p, percent: value } : p))
    );
  };

  return (
    <div className={disabled ? "split-option-disabled" : ""}>
      <div className="title-line">
        <label>split</label>
        {disabled ? (
          <span className="split-placeholder">Enter amount first</span>
        ) : (
          <div className="selected-option-wrapper">
            {showOptions && (
              <div className="options">
                <span className="option" onClick={handleSetEqually}>
                  equally
                </span>
                <span className="option" onClick={handleSetPercents}>
                  as percents
                </span>
                <span className="option" id="amounts" onClick={handleSetAmounts}>
                  as amounts
                </span>
              </div>
            )}
            <div
              className="selected-option"
              onClick={() => setShowOptions(!showOptions)}
            >
              {option}^
            </div>
          </div>
        )}
      </div>
      <div className={`split-members ${disabled ? "split-members-disabled" : ""}`}>
        {members.map((m) => (
          <div key={m.id} className="member-row">
            <div className="left-side">
              <input
                type="checkbox"
                id={`member-${m.id}`}
                name="splitMembers"
                value={m.id}
                className="checkbox"
                defaultChecked={true}
                disabled={disabled}
                onChange={() =>
                  handleSelectParticipants({
                    id: m.id,
                    memberName: m.memberName,
                  })
                }
              />
              <label htmlFor={`member-${m.id}`}>{m.memberName}</label>
            </div>
            {option === "equally" && (
              <span className="amount">${getSplitAmount(m.id) || 0.0}</span>
            )}

            {option === "as amounts" && (
              <div>
                <input
                  type="number"
                  id="amount"
                  name="memberAmount"
                  value={
                    participants.find((p) => p.memberId === m.id)?.amount ?? ""
                  }
                  onChange={(e) =>
                    handleAmountChange(m.id, Number(e.target.value))
                  }
                  min="0"
                  max={total}
                  step="0.01"
                  disabled={disabled}
                />
              </div>
            )}

            {option === "as percents" && (
              <div>
                <input
                  type="number"
                  id="percent"
                  name="memberPercent"
                  value={
                    participants.find((p) => p.memberId === m.id)?.percent ?? ""
                  }
                  onChange={(e) =>
                    handlePercentChange(m.id, Number(e.target.value))
                  }
                  min="0"
                  max={"100"}
                  step="1"
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SplitOption;
