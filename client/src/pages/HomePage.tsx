import { useEffect, useState } from "react";
import AddGroupModal from "../components/modals/AddGroupModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import TrashIcon from "../components/TrashIcon";
import type { Group } from "../types/types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getRecentGroups, removeRecentGroup } from "../utils/recentGroups";
import "../styling/HomePage.css";

interface DisplayGroup extends Pick<Group, "id" | "groupName"> {
  role?: string;
}

const HomePage: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<DisplayGroup | null>(null);
  const [groups, setGroups] = useState<DisplayGroup[]>([]);
  const nav = useNavigate();
  const { user, isReady } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    if (user) {
      (async () => {
        const { apiFetch } = await import("../api/client");
        const res = await apiFetch("/groups/all");
        const data = res.ok ? await res.json() : [];
        setGroups(Array.isArray(data) ? data : []);
      })().catch(() => setGroups([]));
    } else {
      setGroups(getRecentGroups());
    }
  }, [user, isReady]);

  const addGroup = async (groupName: string, memberNames: string[]) => {
    const { apiFetch } = await import("../api/client");
    const res = await apiFetch("/groups", {
      method: "POST",
      body: JSON.stringify({ groupName, memberNames }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Failed to create group");
    }

    const data = await res.json();
    const newGroup: DisplayGroup = {
      id: data.id,
      groupName: data.groupName ?? groupName,
      role: data.groupUsers?.length ? "admin" : undefined,
    };

    setGroups((prev) => {
      const filtered = prev.filter((g) => g.id !== newGroup.id);
      return [newGroup, ...filtered];
    });

    nav(`/groups/${data.id}`);
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const { apiFetch } = await import("../api/client");
      const res = await apiFetch(`/groups/${groupId}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("Failed to delete group");
      }
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      removeRecentGroup(groupId);
      setGroupToDelete(null);
    } catch (error) {
      console.error("Error deleting group", error);
    }
  };

  const showDelete = (g: DisplayGroup) => user && g.role === "admin";

  return (
    <div className="homepage-container">
      <div>
        <div className="title-create">
          <div className="title">my tabs</div>
          <button className="new-btn" onClick={() => setOpenModal(true)}>
            new +
          </button>
        </div>

        {groups.length > 0 ? (
          <div className="groups-container">
            {groups.map((group) => (
              <div
                key={group.id}
                className="group-item"
                onClick={() => nav(`/groups/${group.id}`)}
              >
                <div className="group-title">{group.groupName}</div>
                {showDelete(group) && (
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGroupToDelete(group);
                    }}
                    title="Delete group"
                    aria-label="Delete group"
                  >
                    <TrashIcon size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="homepage-empty">
            <p>Create or join a group to get started.</p>
            {!user && (
              <p className="homepage-hint">
                Log in to access your groups from any device.
              </p>
            )}
          </div>
        )}
      </div>

      {openModal && (
        <AddGroupModal onClose={() => setOpenModal(false)} onAdd={addGroup} />
      )}

      {groupToDelete && (
        <ConfirmDeleteModal
          title="Delete group?"
          message={`Are you sure you want to delete "${groupToDelete.groupName}"? This cannot be undone.`}
          onConfirm={() => deleteGroup(groupToDelete.id)}
          onCancel={() => setGroupToDelete(null)}
        />
      )}
    </div>
  );
};

export default HomePage;
