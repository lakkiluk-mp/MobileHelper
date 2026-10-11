import { authMiddleware } from "@/lib/auth/middleware";
import { createServerFn } from "@tanstack/react-start";
import { progressStatusSchema } from "@etalon/shared";
import { z } from "zod";

const itemSchema = z.object({
  taskId: z.string().min(1).max(40),
  status: progressStatusSchema,
  updatedAt: z.string().min(1).max(40),
  draft: z.string().max(20000).optional(),
});

const batchSchema = z.object({
  items: z.array(itemSchema).max(100),
});

export const pushDeviceProgress = createServerFn({ method: "POST" })
  .validator(batchSchema.extend({ deviceId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { saveDeviceProgress } = await import("./progress.server");
    await saveDeviceProgress(data.deviceId, data.items);
    return { ok: true as const };
  });

export const pushUserProgress = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(batchSchema)
  .handler(async ({ data, context }) => {
    const { saveUserProgress } = await import("./progress.server");
    await saveUserProgress(context.userId, data.items);
    return { ok: true as const };
  });

export const pullUserProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { readUserProgress } = await import("./progress.server");
    return readUserProgress(context.userId);
  });

export const claimDevice = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ deviceId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { claimDeviceProgress } = await import("./progress.server");
    await claimDeviceProgress(context.userId, data.deviceId);
    return { ok: true as const };
  });
