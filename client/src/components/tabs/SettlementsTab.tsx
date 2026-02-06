import type { Settlement } from "../../types/types";
import { FaArrowRight } from "react-icons/fa";
import TrashIcon from "../TrashIcon";

interface Props {
  settlements: Settlement[];
  getNameFromId: (id: string) => string | undefined;
  canDelete?: boolean;
  onDeleteSettlement?: (settlementId: string) => void;
}

const SettlementsTab: React.FC<Props> = ({
  settlements,
  getNameFromId,
  canDelete,
  onDeleteSettlement,
}) => (
  <div className="settlements-container">
    <ul>
      {settlements.length > 0
        ? settlements.map((settlement) => {
            const settlementId = settlement.id;
            return (
            <div key={settlementId ?? settlement.payerId + settlement.payeeId} className="settlement-container item">
              <div>
                <h4>{settlement.note}</h4>
                <div className="transfer-participants">
                  {getNameFromId(settlement.payerId)}{" "}
                  <FaArrowRight size={10} color="black" />{" "}
                  {getNameFromId(settlement.payeeId)}
                </div>
              </div>

              <div className="expense-item-actions">
                <h4>${settlement.amount}</h4>
                {canDelete && onDeleteSettlement && settlementId && (
                  <button className="table-delete-btn" onClick={() => onDeleteSettlement(settlementId)} title="Delete" aria-label="Delete"><TrashIcon /></button>
                )}
              </div>
            </div>
          );
          })
        : "no settlements recorded"}
    </ul>
  </div>
);

export default SettlementsTab;
