import { useState } from "react";
import { FaStar } from 'react-icons/fa'; // Import the star icon from Font Awesome

interface AddGroupModalProps {
  onClose: () => void;
  onAdd: (groupName: string, memberNames: string[]) => void;
}

const AddGroupModal = ({ onClose, onAdd }: AddGroupModalProps) => {
  const [groupName, setGroupName] = useState("");
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const handleAddMember = () => {
    const name = input.trim();
    if (name && !memberNames.includes(name)) {
      setMemberNames([...memberNames, name]);
      setInput("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !memberNames) {
      alert("please add a group name and group members")
      return;
    }
    onAdd(groupName, memberNames);
  };

  const handleDeleteMember = (idx: number) => {
    setMemberNames(memberNames.filter((_, i) => i !== idx));
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>create a new group</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="groupName">group name</label>
          <input
            id="groupName"
            type="text"
            placeholder="e.g. paris trip"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <label>members</label>
          <div className="member-list">
            {memberNames.map((m, idx) => (
              <div key={idx} className="member-item">
                <FaStar/>
                <pre onClick={() => handleDeleteMember(idx)}> {m}</pre>
              </div>
            ))}
          </div>

          <div className="add-member">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddMember();
                }
              }}
              placeholder="member name"
            />
            <button type="button" onClick={handleAddMember}>
              +
            </button>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              close
            </button>
            <button type="submit" className="add-btn">
              add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGroupModal;
