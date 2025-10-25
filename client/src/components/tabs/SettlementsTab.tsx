import type { Settlement } from "../../types/types";
import { FaArrowRight } from "react-icons/fa";

interface Props {
  settlements: Settlement[];
  getNameFromId: (id: string) => string | undefined;
}

const SettlementsTab: React.FC<Props> = ({
  settlements,
  getNameFromId,
}) => (
  <div className="settlements-container">
    <ul>
      {settlements.length > 0
        ? settlements.map((settlement) => (
            <div key={settlement.id} className="settlement-container item">
              <div>
                <h4>{settlement.note}</h4>
                <div className="transfer-participants">
                  {getNameFromId(settlement.payerId)}{" "}
                  <FaArrowRight size={10} color="black" />{" "}
                  {getNameFromId(settlement.payeeId)}
                </div>
              </div>

              <h4>${settlement.amount}</h4>
            </div>
          ))
        : "no settlements recorded"}
    </ul>
  </div>
);

export default SettlementsTab;
