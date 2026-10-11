import type { Card, ProgressStatus } from "@etalon/shared";

export type ProgressRow = {
  taskId: string;
  status: ProgressStatus;
  updatedAt: string;
  draft?: string;
};

const DB_NAME = "etalon";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("cards")) db.createObjectStore("cards");
      if (!db.objectStoreNames.contains("progress")) db.createObjectStore("progress");
      if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox");
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readCards(): Promise<Card[]> {
  const db = await openDb();
  const rows = await requestToPromise(db.transaction("cards").objectStore("cards").getAll());
  db.close();
  return rows as Card[];
}

export async function writeCards(cards: Card[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("cards", "readwrite");
  tx.objectStore("cards").clear();
  for (const card of cards) tx.objectStore("cards").put(card, card.id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function readProgress(): Promise<ProgressRow[]> {
  const db = await openDb();
  const rows = await requestToPromise(db.transaction("progress").objectStore("progress").getAll());
  db.close();
  return rows as ProgressRow[];
}

export async function writeProgress(row: ProgressRow): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(["progress", "outbox"], "readwrite");
  tx.objectStore("progress").put(row, row.taskId);
  tx.objectStore("outbox").put(row, row.taskId);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function readOutbox(): Promise<ProgressRow[]> {
  const db = await openDb();
  const rows = await requestToPromise(db.transaction("outbox").objectStore("outbox").getAll());
  db.close();
  return rows as ProgressRow[];
}

export async function clearOutbox(taskIds: string[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("outbox", "readwrite");
  for (const id of taskIds) tx.objectStore("outbox").delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function replaceProgress(rows: ProgressRow[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("progress", "readwrite");
  const store = tx.objectStore("progress");
  store.clear();
  for (const row of rows) store.put(row, row.taskId);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

let memoryDeviceId: string | null = null;

export function deviceId(): string {
  const key = "etalon-device";
  if (memoryDeviceId) return memoryDeviceId;
  try {
    if (typeof localStorage === "undefined") {
      memoryDeviceId = crypto.randomUUID();
      return memoryDeviceId;
    }
    const existing = localStorage.getItem(key);
    if (existing) {
      memoryDeviceId = existing;
      return existing;
    }
    const created = crypto.randomUUID();
    localStorage.setItem(key, created);
    memoryDeviceId = created;
    return created;
  } catch {
    memoryDeviceId = crypto.randomUUID();
    return memoryDeviceId;
  }
}
