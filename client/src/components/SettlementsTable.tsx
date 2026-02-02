import type { Member, Settlement } from "../types/types";
import { formatDate, getNameFromId } from "../utils/formatStrings";
import "../styling/DataTable.css";
interface Props {
  members: Member[];
  settlements: Settlement[];
}

const SettlementsTable: React.FC<Props> = ({
  members,
  settlements,
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
    </tr>
  </thead>
  <tbody>
    {settlements.map((settlement) => (
      <tr key={settlement.id}>
        <td>{settlement.date ? formatDate(settlement.date) : ""}</td>
        <td>{settlement.note}</td>
        <td>${settlement.amount.toFixed(2)}</td>
        <td>{getNameFromId(members, settlement.payerId)}</td>
        <td>{getNameFromId(members, settlement.payeeId)}</td>
      </tr>
    ))}
  </tbody>
</table>

  );
};

export default SettlementsTable;
