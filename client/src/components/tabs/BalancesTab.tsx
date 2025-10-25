import type { Member } from "../../types/types";

interface Props {
  members: Member[];
  onAddMember: () => void;
  onViewMember: (id: string) => void;
  formatBalanceString: (balance: number) => string;
}

const BalancesTab: React.FC<Props> = ({ members, onAddMember, onViewMember, formatBalanceString }) => (
  <div className="balances-container">
    <ul className="">
      {members.map((member) => (
        <div
          key={member.id}
          className="balance-container item"
          onClick={() => onViewMember(member.id)}
        >
          <h4>{member.memberName}</h4>
          <h4> {formatBalanceString(member.balance)}</h4>
        </div>
      ))}
    </ul>
    <button onClick={onAddMember}>+ add member</button>
  </div>
);

export default BalancesTab;