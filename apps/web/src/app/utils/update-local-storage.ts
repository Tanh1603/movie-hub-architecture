export function updateLocalStorage(
  newPartialData: Record<string, unknown>,
  storageKey: string
) {
  const saved = localStorage.getItem(storageKey);
  const currentData = saved ? JSON.parse(saved) : {};
  const mergedData = { ...currentData, ...newPartialData };
  localStorage.setItem(storageKey, JSON.stringify(mergedData));
}
