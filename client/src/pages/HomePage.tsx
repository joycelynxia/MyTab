import { useEffect, useState } from "react";
import AddGroupModal from "../components/modals/AddGroupModal";
import ConfirmDeleteModal from "../components/modals/ConfirmDeleteModal";
import type { Group } from "../types/types";
import { useNavigate } from "react-router-dom";
import "../styling/HomePage.css";
import { createMember } from "../api/members";

const HomePage: React.FC = () => {
  const [openModal, setOpenModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [currentMembers, setCurrentMembers] = useState<string[]>([]);
  const nav = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:3000/groups/all`)
      .then((res) => res.json())
      .then((data) => {
        Array.isArray(data) ? setGroups(data) : setGroups([]);
      })
      .catch(() => setGroups([]));
  });

  // useEffect to load all groups
  const addGroup = async (groupName: string, memberNames: string[]) => {
    console.log("creating new group");
    const res = await fetch(`http://localhost:3000/groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupName }),
    });

    if (!res.ok) {
      throw new Error("failed to create group");
    }

    const data = await res.json();
    const groupId = data.id;

    memberNames.forEach((m) => {
      let memberId = String(createMember(groupId, m));
      setCurrentMembers([...currentMembers, memberId]);
    });

    const newGroup: Group = {
      id: groupId,
      groupName,
      members: currentMembers,
    };

    console.log(newGroup);
    // add newGroup to backend

    setGroups([...groups, newGroup]);
    // setOpenModal(false);

    nav(`/groups/${data.id}`);
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const res = await fetch(`http://localhost:3000/groups/${groupId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("failed to delete group");
      }
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group.id != groupId)
      );
      setGroupToDelete(null);
    } catch (error) {
      console.error("error deleting group", error);
    }
  };

  return (
    <div className="homepage-container">
      {groups ? (
        <div>
          <div className="title-create">
            <div className="title">my tabs</div>
            <button className="new-btn" onClick={() => setOpenModal(true)}>new +</button>
          </div>

          <div className="groups-container">
            {groups.map((group) => (
              <div
                key={group.id}
                className="group-item"
                onClick={() => nav(`/groups/${group.id}`)}
              >
                <div className="group-title">{group.groupName}</div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGroupToDelete(group);
                  }}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h1>let's settle this now</h1>
          <h3>track tabs. split bills. stay friends</h3>
        </div>
      )}

      {/* <CreateGroupButton /> */}

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
