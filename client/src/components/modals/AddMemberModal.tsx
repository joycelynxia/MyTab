import { useState } from "react";

interface AddMemberModalProps {
  onClose: () => void;
  onAdd: (memberName: string) => void;
}

const AddMemberModal = ({ onClose, onAdd }: AddMemberModalProps) => {
  const [memberName, setMemberName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) {
      alert("please enter a name");
      return;
    }
    onAdd(memberName.trim());
    setMemberName("");
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>add member</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="member name"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
          />

          <div className="modal-actions">
            <button type="submit" className="add-btn">
              add
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;
