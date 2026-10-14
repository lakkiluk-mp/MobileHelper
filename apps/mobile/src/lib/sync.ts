import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { deviceId, dropOutbox, mergeRemoteProgress, readOutbox, type ProgressRow } from "./db";

export const API_URL = "https://etalon.offerist-ai.ru";
export const APK_URL = `${API_URL}/download/apk`;

const TOKEN_KEY = "etalon-session";
const CALLBACK = "etalon://auth";
const BATCH = 100;

export type Account = { name: string; email: string };

export class AuthExpiredError extends Error {}

async function readToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401) throw new AuthExpiredError("unauthorized");
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return (await response.json()) as T;
}

export async function currentAccount(): Promise<Account | null> {
  const token = await readToken();
  if (!token) return null;
  const session = await request<{ user?: { name?: string; email?: string } } | null>(
    "/api/auth/get-session",
    {},
    token,
  );
  if (!session?.user) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return null;
  }
  return { name: session.user.name ?? "", email: session.user.email ?? "" };
}

async function pushOutbox(token: string | null): Promise<void> {
  const pending = await readOutbox();
  for (let index = 0; index < pending.length; index += BATCH) {
    const chunk = pending.slice(index, index + BATCH);
    const items = chunk.map((entry) => entry.row);
    if (token) {
      const result = await request<{ items: ProgressRow[] }>(
        "/api/progress",
        { method: "POST", body: JSON.stringify({ items }) },
        token,
      );
      await mergeRemoteProgress(result.items);
    } else {
      await request("/api/progress/device", {
        method: "POST",
        body: JSON.stringify({ deviceId: await deviceId(), items }),
      });
    }
    await dropOutbox(chunk);
  }
}

export async function syncProgress(): Promise<void> {
  const token = await readToken();
  try {
    await pushOutbox(token);
    if (token) {
      const result = await request<{ items: ProgressRow[] }>("/api/progress", {}, token);
      await mergeRemoteProgress(result.items);
    }
  } catch (error) {
    if (error instanceof AuthExpiredError) await SecureStore.deleteItemAsync(TOKEN_KEY);
    throw error;
  }
}

export async function signIn(): Promise<Account | null> {
  const result = await WebBrowser.openAuthSessionAsync(`${API_URL}/api/mobile/sign-in`, CALLBACK);
  if (result.type !== "success") return null;
  const match = /[?&]token=([^&#]+)/.exec(result.url);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) throw new Error("Вход не завершён");
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await pushOutbox(null);
  const claimed = await request<{ items: ProgressRow[] }>(
    "/api/progress/claim",
    { method: "POST", body: JSON.stringify({ deviceId: await deviceId() }) },
    token,
  );
  await mergeRemoteProgress(claimed.items);
  return currentAccount();
}

export async function signOut(): Promise<void> {
  const token = await readToken();
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  if (!token) return;
  await fetch(`${API_URL}/api/auth/sign-out`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: "{}",
  }).catch(() => undefined);
}
