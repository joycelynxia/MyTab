import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar } from 'react-icons/fa';

function extractShareToken(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/\/groups\/join\/([a-zA-Z0-9-]+)|\/join\/([a-zA-Z0-9-]+)/);
  if (match) return match[1] || match[2] || null;
  if (/^[a-zA-Z0-9-]{36}$/.test(trimmed)) return trimmed;
  return null;
}

interface AddGroupModalProps {
  onClose: () => void;
  onAdd: (groupName: string, memberNames: string[]) => void | Promise<void>;
}

const AddGroupModal = ({ onClose, onAdd }: AddGroupModalProps) => {
  const navigate = useNavigate();
  const [groupName, setGroupName] = useState("");
  const [memberNames, setMemberNames] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [joinInput, setJoinInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [option, setOption] = useState<"create" | "join">("create");

  const handleCreate = () => {
    setOption("create");
    setError("");
  };

  const handleJoin = () => {
    setOption("join");
    setError("");
  };

  const handleAddMember = () => {
    const name = input.trim();
    if (name && !memberNames.includes(name)) {
      setMemberNames([...memberNames, name]);
      setInput("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!groupName?.trim()) {
      setError("Please enter a group name");
      return;
    }
    if (!memberNames.length) {
      setError("Please add at least one member (use the + button)");
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(groupName.trim(), memberNames);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = (idx: number) => {
    setMemberNames(memberNames.filter((_, i) => i !== idx));
  };

  return (
    <div className="modal-overlay">
      <div className="modal add-group-modal">
        <h2>Add a new group</h2>
        <div className="add-group-toggle">
          <button
            type="button"
            className={`add-group-toggle-btn ${option === "create" ? "active" : ""}`}
            onClick={handleCreate}
          >
            Create
          </button>
          <button
            type="button"
            className={`add-group-toggle-btn ${option === "join" ? "active" : ""}`}
            onClick={handleJoin}
          >
            Join
          </button>
        </div>
        {option === "create" && (
          <form onSubmit={handleSubmit}>
            {error && <p className="modal-error">{error}</p>}
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
                  <FaStar />
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
              <button type="submit" className="add-btn" disabled={submitting}>
                {submitting ? "Creating..." : "add"}
              </button>
            </div>
          </form>
        )}

        {option === "join" && (
          <div className="add-group-join-section">
            <label htmlFor="joinLink">Paste invite link or share code</label>
            <div className="add-group-join-form">
              <input
                id="joinLink"
                type="text"
                placeholder="Invite link or share code"
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const token = extractShareToken(joinInput);
                    if (token) {
                      onClose();
                      navigate(`/groups/join/${token}`);
                    } else setJoinInput("");
                  }
                }}
              />
              <button
                type="button"
                className="add-group-join-btn"
                onClick={() => {
                  const token = extractShareToken(joinInput);
                  if (token) {
                    onClose();
                    navigate(`/groups/join/${token}`);
                  } else setJoinInput("");
                }}
              >
                Join group
              </button>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddGroupModal;
