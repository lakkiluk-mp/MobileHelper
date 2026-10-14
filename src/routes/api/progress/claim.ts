import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { jsonError, readBody, withUser } from "@/lib/progress-rest.server";
import { claimDeviceProgress, readUserProgress } from "@/lib/progress.server";

const claimSchema = z.object({ deviceId: z.string().uuid() });

export const Route = createFileRoute("/api/progress/claim")({
  server: {
    handlers: {
      POST: ({ request }) =>
        withUser(async (userId) => {
          const data = await readBody(request, claimSchema);
          if (!data) return jsonError(400, "invalid body");
          await claimDeviceProgress(userId, data.deviceId);
          return Response.json({ items: await readUserProgress(userId) });
        }),
    },
  },
});
