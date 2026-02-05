import type { Member } from "../../types/types";
import SettleUpButton from "../SettleUpButton";

interface Props {
  members: Member[];
  onAddMember?: () => void;
  onViewMember: (id: string) => void;
  formatBalanceString: (balance: number) => string;
  onMarkAsPaid?: (payerId: string, payeeId: string, amount: number) => Promise<void>;
}

const BalancesTab: React.FC<Props> = ({
  members,
  onAddMember,
  onViewMember,
  formatBalanceString,
  onMarkAsPaid,
}) => (
  <>
    <div className="toolbar">
      <div className="toolbar-spacer" />
      {onMarkAsPaid && <SettleUpButton members={members} onMarkAsPaid={onMarkAsPaid} />}
      {onAddMember && <button onClick={onAddMember}>+ add member</button>}
    </div>
    <div className="balances-container">
      <ul>
        {members.map((member) => (
          <div
            key={member.id}
            className="balance-container item"
            onClick={() => onViewMember(member.id)}
          >
            <h4>{member.memberName}</h4>
            <h4>{formatBalanceString(member.balance)}</h4>
          </div>
        ))}
      </ul>
    </div>
  </>
);

export default BalancesTab;