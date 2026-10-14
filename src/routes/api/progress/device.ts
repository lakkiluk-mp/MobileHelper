import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { progressBatchSchema } from "@/lib/progress-api";
import { jsonError, readBody } from "@/lib/progress-rest.server";
import { saveDeviceProgress } from "@/lib/progress.server";

const deviceBatchSchema = progressBatchSchema.extend({ deviceId: z.string().uuid() });

export const Route = createFileRoute("/api/progress/device")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const data = await readBody(request, deviceBatchSchema);
        if (!data) return jsonError(400, "invalid body");
        await saveDeviceProgress(data.deviceId, data.items);
        return Response.json({ ok: true });
      },
    },
  },
});
