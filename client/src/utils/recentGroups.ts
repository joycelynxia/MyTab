const STORAGE_KEY = "mytab_recent_groups";

export interface RecentGroup {
  id: string;
  groupName: string;
}

export function getRecentGroups(): RecentGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRecentGroup(group: RecentGroup): void {
  const list = getRecentGroups();
  const filtered = list.filter((g) => g.id !== group.id);
  const updated = [{ ...group }, ...filtered].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeRecentGroup(groupId: string): void {
  const list = getRecentGroups().filter((g) => g.id !== groupId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function clearRecentGroups(): void {
  localStorage.removeItem(STORAGE_KEY);
}
