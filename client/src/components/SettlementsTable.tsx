import type { Member, Settlement } from "../types/types";
import TrashIcon from "./TrashIcon";
import { formatDate, getNameFromId } from "../utils/formatStrings";
import "../styling/DataTable.css";
interface Props {
  members: Member[];
  settlements: Settlement[];
  canDelete?: boolean;
  onDeleteSettlement?: (settlementId: string) => void;
}

const SettlementsTable: React.FC<Props> = ({
  members,
  settlements,
  canDelete,
  onDeleteSettlement,
}) => {
  return (
    <table className="grid-table">
  <thead>
    <tr>
      <th>Date</th>
      <th>Description</th>
      <th>Amount</th>
      <th>Paid By</th>
      <th>Received By</th>
      {canDelete && <th></th>}
    </tr>
  </thead>
  <tbody>
    {settlements.map((settlement) => {
      const settlementId = settlement.id;
      return (
      <tr key={settlementId ?? settlement.payerId + settlement.payeeId}>
        <td>{settlement.date ? formatDate(settlement.date) : ""}</td>
        <td>{settlement.note}</td>
        <td>${settlement.amount.toFixed(2)}</td>
        <td>{getNameFromId(members, settlement.payerId)}</td>
        <td>{getNameFromId(members, settlement.payeeId)}</td>
        {canDelete && onDeleteSettlement && settlementId && (
          <td>
            <button className="table-delete-btn" onClick={() => onDeleteSettlement(settlementId)} title="Delete" aria-label="Delete"><TrashIcon /></button>
          </td>
        )}
      </tr>
    );
    })}
  </tbody>
</table>

  );
};

export default SettlementsTable;
