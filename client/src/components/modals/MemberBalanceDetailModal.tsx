import type { Member, Expense, Settlement } from "../../types/types";
import { formatDate, getNameFromId } from "../../utils/formatStrings";
import "../../styling/Modal.css";

interface Props {
  member: Member;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
  formatBalanceString: (balance: number) => string;
  onClose: () => void;
}

const MemberBalanceDetailModal: React.FC<Props> = ({
  member,
  members,
  expenses,
  settlements,
  formatBalanceString,
  onClose,
}) => {
  const expensesPaid = expenses.filter((e) => e.payerId === member.id);
  const expenseShares = expenses.filter((e) =>
    e.splits.some((s) => s.memberId === member.id)
  );
  const settlementsPaid = settlements.filter((s) => s.payerId === member.id);
  const settlementsReceived = settlements.filter((s) => s.payeeId === member.id);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal member-balance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <h2>{member.memberName}</h2>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="member-balance-summary">Balance: {formatBalanceString(member.balance ?? 0)}</p>

        <section className="member-detail-section">
          <h3>Expenses paid</h3>
          {expensesPaid.length === 0 ? (
            <p className="member-detail-empty">None</p>
          ) : (
            <ul className="member-detail-list">
              {expensesPaid.map((e) => (
                <li key={e.id}>
                  <span className="member-detail-date">{formatDate(e.date)}</span>
                  <span className="member-detail-desc">{e.expenseName}</span>
                  <span className="member-detail-amount">+${e.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="member-detail-section">
          <h3>Expense shares (owed)</h3>
          {expenseShares.length === 0 ? (
            <p className="member-detail-empty">None</p>
          ) : (
            <ul className="member-detail-list">
              {expenseShares.map((e) => {
                const split = e.splits.find((s) => s.memberId === member.id);
                if (!split) return null;
                return (
                  <li key={e.id}>
                    <span className="member-detail-date">{formatDate(e.date)}</span>
                    <span className="member-detail-desc">{e.expenseName}</span>
                    <span className="member-detail-amount member-detail-amount-negative">
                      −${split.amount.toFixed(2)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="member-detail-section">
          <h3>Settlements paid</h3>
          {settlementsPaid.length === 0 ? (
            <p className="member-detail-empty">None</p>
          ) : (
            <ul className="member-detail-list">
              {settlementsPaid.map((s, i) => (
                <li key={s.id ?? `paid-${i}`}>
                  <span className="member-detail-date">
                    {s.date ? formatDate(s.date) : "—"}
                  </span>
                  <span className="member-detail-desc">
                    Paid {getNameFromId(members, s.payeeId) ?? "—"}
                  </span>
                  <span className="member-detail-amount">+${s.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="member-detail-section">
          <h3>Settlements received</h3>
          {settlementsReceived.length === 0 ? (
            <p className="member-detail-empty">None</p>
          ) : (
            <ul className="member-detail-list">
              {settlementsReceived.map((s, i) => (
                <li key={s.id ?? `recv-${i}`}>
                  <span className="member-detail-date">
                    {s.date ? formatDate(s.date) : "—"}
                  </span>
                  <span className="member-detail-desc">
                    From {getNameFromId(members, s.payerId) ?? "—"}
                  </span>
                  <span className="member-detail-amount member-detail-amount-negative">
                    −${s.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

export default MemberBalanceDetailModal;
