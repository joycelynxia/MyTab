import { useState, useEffect } from "react";
import "../styling/SplitOption.css";
import type { Member, Split } from "../types/types";

interface Props {
  members: Member[];
  total: number;
}
const SplitOption: React.FC<Props> = ({ members, total }) => {
  const [option, setOption] = useState<
    "equally" | "as percents" | "as amounts"
  >("equally");
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Split[]>([]);
  const [amount, setAmount] = useState<number>(0);
  const [percent, setPercent] = useState<number>(0);

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
    setParticipants((prev) =>
      prev.map((m) => ({
        ...m,
        // percent: 100 / prev.length,
        amount: (total * m.percent) / 100,
      }))
    );
    setShowOptions(false);
  };

  const handleSetAmounts = () => {
    setOption("as amounts");
    setParticipants((prev) =>
      prev.map((m) => ({
        ...m,
        percent: m.amount / total,
        // amount: total / prev.length,
      }))
    );
    setShowOptions(false);
  };

  const handleSelectParticipants = (member: {
    id: string;
    memberName: string;
    amount: number;
    percent: number;
  }) => {
    setParticipants((prev) => {
      const exists = prev.some((p) => p.memberId === member.id);

      if (exists) {
        // Remove the participant
        return prev.filter((p) => p.memberId !== member.id);
      } else {
        // Add the participant
        return [
          ...prev,
          {
            memberId: member.id,
            memberName: member.memberName,
            amount: member.amount,
            percent: member.percent,
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

  //   useEffect(() => {
  //   console.log("participants updated:", participants);
  // }, [participants]);

  const getSplitAmount = (id: string) => {
    const member = participants.find((m) => m.memberId === id);
    return member?.amount.toFixed(2);
  };

  return (
    <div>
      <div className="title-line">
        <label>split</label>
        <div
          className="selected-option"
          onClick={() => setShowOptions(!showOptions)}
        >
          {option}^
        </div>
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
      </div>
      <div className="split-members">
        {members.map((m) => (
          <div key={m.id} className="member-row">
            <div className="left-side">
              <input
                type="checkbox"
                id={`member-${m.id}`}
                name="splitMembers"
                value={m.id}
                className="checkbox"
                onChange={() =>
                  handleSelectParticipants({
                    id: m.id,
                    memberName: m.memberName,
                    amount: 0,
                    percent: 0,
                  })
                }
              />
              <label htmlFor={`member-${m.id}`}>{m.memberName}</label>
            </div>
            <span className="amount">${getSplitAmount(m.id) || 0.0}</span>
            {option === "as amounts" && (
              <div>
                <input
                  type="number"
                  id="amount"
                  name="memberAmount"
                  value={amount}
                  // className="checkbox"
                  onChange={() =>
                    handleSelectParticipants({
                      id: m.id,
                      memberName: m.memberName,
                      amount: amount,
                      percent: 0,
                    })
                  }
                />
              </div>
            )}

            {option === "as percents" && (
              <div>
                <input
                  type="number"
                  id="percent"
                  name="memberPercent"
                  value={percent}
                  // className="checkbox"
                  onChange={() =>
                    handleSelectParticipants({
                      id: m.id,
                      memberName: m.memberName,
                      amount: 0,
                      percent: percent,
                    })
                  }
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
