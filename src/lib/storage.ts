export const StorageKeys = {
  DAILY_SESSION: "grimoire_daily_session",
  CHALLENGE_PROGRESS: "grimoire_challenge_progress",
  PREFERENCES: "grimoire_preferences",
  STREAK: "grimoire_streak",
  PROGRESS: "grimoire_progress",
  CLIENT_ID: "grimoire_client_id",
};

export function getClientId(): string {
  if (typeof window === "undefined") return "server_rendering";
  let clientId = localStorage.getItem(StorageKeys.CLIENT_ID);
  if (!clientId) {
    clientId = crypto.randomUUID ? crypto.randomUUID() : 'id_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(StorageKeys.CLIENT_ID, clientId);
  }
  return clientId;
}

export function saveLocal<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar no localStorage (${key}):`, error);
  }
}

export function getLocal<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Erro ao ler do localStorage (${key}):`, error);
    return null;
  }
}

export function removeLocal(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Erro ao remover do localStorage (${key}):`, error);
  }
}

export function clearLocal(): void {
  if (typeof window === "undefined") return;
  localStorage.clear();
}
