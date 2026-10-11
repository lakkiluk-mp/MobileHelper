import { getSql } from "@/lib/db";
import type { ProgressStatus } from "@etalon/shared";

export type ProgressInput = {
  taskId: string;
  status: ProgressStatus;
  updatedAt: string;
  draft?: string;
};

type ProgressSqlRow = {
  task_id: string;
  status: ProgressStatus;
  updated_at: string;
  draft: string | null;
};

async function upsert(
  table: "device_progress" | "user_progress",
  ownerColumn: "device_id" | "user_id",
  ownerId: string,
  items: ProgressInput[],
): Promise<void> {
  const sql = await getSql();
  for (const item of items) {
    const draft = item.draft ?? null;
    if (table === "device_progress") {
      await sql`
        insert into device_progress (device_id, task_id, status, updated_at, draft)
        values (${ownerId}, ${item.taskId}, ${item.status}, ${item.updatedAt}, ${draft})
        on conflict (device_id, task_id) do update set
          status = excluded.status,
          updated_at = excluded.updated_at,
          draft = excluded.draft
        where device_progress.updated_at <= excluded.updated_at
      `;
    } else {
      await sql`
        insert into user_progress (user_id, task_id, status, updated_at, draft)
        values (${ownerId}, ${item.taskId}, ${item.status}, ${item.updatedAt}, ${draft})
        on conflict (user_id, task_id) do update set
          status = excluded.status,
          updated_at = excluded.updated_at,
          draft = excluded.draft
        where user_progress.updated_at <= excluded.updated_at
      `;
    }
  }
  void ownerColumn;
}

export async function saveDeviceProgress(deviceId: string, items: ProgressInput[]): Promise<void> {
  await upsert("device_progress", "device_id", deviceId, items);
}

export async function saveUserProgress(userId: string, items: ProgressInput[]): Promise<void> {
  await upsert("user_progress", "user_id", userId, items);
}

export async function readUserProgress(userId: string): Promise<ProgressInput[]> {
  const sql = await getSql();
  const rows = await sql<ProgressSqlRow>`
    select task_id, status, updated_at, draft from user_progress where user_id = ${userId}
  `;
  return rows.map((row) => ({
    taskId: row.task_id,
    status: row.status,
    updatedAt: row.updated_at,
    draft: row.draft ?? undefined,
  }));
}

export async function claimDeviceProgress(userId: string, deviceId: string): Promise<void> {
  const sql = await getSql();
  const rows = await sql<ProgressSqlRow>`
    select task_id, status, updated_at, draft from device_progress where device_id = ${deviceId}
  `;
  await saveUserProgress(
    userId,
    rows.map((row) => ({
      taskId: row.task_id,
      status: row.status,
      updatedAt: row.updated_at,
      draft: row.draft ?? undefined,
    })),
  );
}
