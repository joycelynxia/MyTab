import { FaList, FaTable } from "react-icons/fa";
import "../styling/ViewToggle.css";

interface Props {
  view: "list" | "grid";
  onViewChange: (view: "list" | "grid") => void;
}

const ViewToggle: React.FC<Props> = ({ view, onViewChange }) => (
  <div className="view-toggle">
    <button
      type="button"
      className={`view-toggle-btn ${view === "list" ? "active" : ""}`}
      onClick={() => onViewChange("list")}
      title="List view"
      aria-pressed={view === "list"}
    >
      <FaList size={16} />
      <span></span>
    </button>
    <button
      type="button"
      className={`view-toggle-btn ${view === "grid" ? "active" : ""}`}
      onClick={() => onViewChange("grid")}
      title="Grid view"
      aria-pressed={view === "grid"}
    >
      <FaTable size={16} />
      <span></span>
    </button>
  </div>
);

export default ViewToggle;
