import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styling/GroupJoinPage.css";

const API_BASE = "http://localhost:3000";

interface Member {
  id: string;
  memberName: string;
}

interface GroupInfo {
  id: string;
  groupName: string;
  members: Member[];
}

const GroupJoinPage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addMode, setAddMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!shareToken) {
      setError("Invalid link");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/groups/byToken/${shareToken}`);
        if (!res.ok) {
          setError(res.status === 404 ? "Group not found" : "Failed to load group");
          return;
        }
        const data = await res.json();
        setGroup(data);
      } catch {
        setError("Failed to load group");
      } finally {
        setLoading(false);
      }
    })();
  }, [shareToken]);

  const claimMember = async (memberId?: string, memberName?: string) => {
    if (!shareToken || submitting) return;
    if (memberName !== undefined && !memberName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/groups/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(
          memberId ? { shareToken, memberId } : { shareToken, memberName: memberName?.trim() }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to join");
        return;
      }
      navigate(`/groups/${data.groupId}`);
    } catch {
      setError("Failed to join");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="group-join-page">
        <div className="group-join-card">Loading...</div>
      </div>
    );
  }

  if (error && !group) {
    return (
      <div className="group-join-page">
        <div className="group-join-card group-join-error">{error}</div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="group-join-page">
      <div className="group-join-card">
        <h2>{group.groupName}</h2>
        <p className="group-join-prompt">Who are you?</p>
        <div className="group-join-members">
          {group.members.map((m) => (
            <button
              key={m.id}
              className="group-join-member-btn"
              onClick={() => claimMember(m.id)}
              disabled={submitting}
            >
              {m.memberName}
            </button>
          ))}
          {!addMode ? (
            <button
              className="group-join-add-btn"
              onClick={() => setAddMode(true)}
              disabled={submitting}
            >
              Add my name
            </button>
          ) : (
            <div className="group-join-add-form">
              <input
                type="text"
                placeholder="Your name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && claimMember(undefined, newName)}
                autoFocus
              />
              <button
                onClick={() => claimMember(undefined, newName)}
                disabled={submitting || !newName.trim()}
              >
                Join
              </button>
              <button onClick={() => { setAddMode(false); setNewName(""); }}>Cancel</button>
            </div>
          )}
        </div>
        {error && <p className="group-join-error-msg">{error}</p>}
      </div>
    </div>
  );
};

export default GroupJoinPage;
