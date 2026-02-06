import { useState } from "react";
import { FaArrowRight, FaCheck } from "react-icons/fa";
import type { Member, Settlement } from "../types/types";
import { getNameFromId } from "../utils/formatStrings";
import "../styling/SettleUp.css";

interface Props {
  members: Member[];
  onMarkAsPaid: (
    payerId: string,
    payeeId: string,
    amount: number
  ) => Promise<void>;
}
const SettleUpButton: React.FC<Props> = ({ members, onMarkAsPaid }) => {
  const [openView, setOpenView] = useState(false);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const roundsToZero = (n: number) => Math.round(n * 100) === 0;

  const handleSettleButton = () => {
    setOpenView(true);

    const debtors = members
      .filter((m) => m.balance < 0 && !roundsToZero(m.balance))
      .map((m) => ({
        id: m.id,
        name: m.memberName,
        balance: Math.abs(m.balance),
      }));
    const creditors = members
      .filter((m) => m.balance > 0 && !roundsToZero(m.balance))
      .map((m) => ({ id: m.id, name: m.memberName, balance: m.balance }));
    const settlements = [];
    let i = 0,
      j = 0;

    while (i < debtors.length && j < creditors.length) {
      const owed = debtors[i].balance;
      const toReceive = creditors[j].balance;
      const amountToPay = Math.min(owed, toReceive);

      if (!roundsToZero(amountToPay)) {
        settlements.push({
          payer: debtors[i].id,
          payee: creditors[j].id,
          amount: amountToPay.toFixed(2),
        });
      }

      debtors[i].balance -= amountToPay;
      creditors[j].balance -= amountToPay;

      if (roundsToZero(debtors[i].balance)) i++;
      if (roundsToZero(creditors[j].balance)) j++;
    }
    setSettlements(
      settlements.map((s) => {
        const settlement: Settlement = {
          payerId: s.payer,
          payeeId: s.payee,
          amount: Number(s.amount),
        };
        return settlement;
      })
    );
  };
  const handlePaidButton = async (s: Settlement) => {
    try {
      await onMarkAsPaid(s.payerId, s.payeeId, s.amount);
      setSettlements((prev) =>
        prev.filter(
          (item) => !(item.payeeId === s.payeeId && item.payerId === s.payerId)
        )
      );
    } catch (error) {
      console.error("Failed to record settlement:", error);
    }
  };

  const getSettlementKey = (s: Settlement) => {
    return `${s.payerId}-to-${s.payeeId}`;
  };

  return (
    <div>
      {openView ? (
        <div className="modal-overlay settleup-overlay" onClick={() => setOpenView(false)}>
          <div
            className="settleup-modal modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="settleup-header">
              <h2>Settle up</h2>
              <button
                type="button"
                className="settleup-close-btn"
                onClick={() => setOpenView(false)}
                aria-label="Close"
              >
                x
                {/* <FaTimes size={20} /> */}
              </button>
            </div>

            {settlements.length === 0 ? (
              <div className="settleup-empty">
                <FaCheck className="settleup-empty-icon" />
                <p className="settleup-empty-title">All settled!</p>
                <p className="settleup-empty-text">
                  All tabs have been paid. No action needed.
                </p>
              </div>
            ) : (
              <>
                <p className="settleup-subtitle">
                  Mark each payment as completed when it's done.
                </p>
                <div className="settleup-list">
                  {settlements.map((s) => (
                    <div
                      key={getSettlementKey(s)}
                      className="settleup-settlement-card"
                    >
                      <div className="settleup-settlement-flow">
                        <span className="settleup-person">
                          {getNameFromId(members, s.payerId)}
                        </span>
                        <FaArrowRight
                          className="settleup-arrow"
                          size={14}
                          aria-hidden
                        />
                        <span className="settleup-amount">
                          ${s.amount.toFixed(2)}
                        </span>
                        <FaArrowRight
                          className="settleup-arrow"
                          size={14}
                          aria-hidden
                        />
                        <span className="settleup-person">
                          {getNameFromId(members, s.payeeId)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="settleup-mark-btn"
                        onClick={() => handlePaidButton(s)}
                      >
                        Mark as paid
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="settleup-footer">
              <button
                type="button"
                className="settleup-done-btn"
                onClick={() => setOpenView(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button onClick={handleSettleButton}>settle up</button>
      )}
    </div>
  );
};

export default SettleUpButton;
