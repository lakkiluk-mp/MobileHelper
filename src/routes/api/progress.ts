import { createFileRoute } from "@tanstack/react-router";
import { progressBatchSchema } from "@/lib/progress-api";
import { jsonError, readBody, withUser } from "@/lib/progress-rest.server";
import { readUserProgress, saveUserProgress } from "@/lib/progress.server";

export const Route = createFileRoute("/api/progress")({
  server: {
    handlers: {
      GET: () =>
        withUser(async (userId) => Response.json({ items: await readUserProgress(userId) })),
      POST: ({ request }) =>
        withUser(async (userId) => {
          const data = await readBody(request, progressBatchSchema);
          if (!data) return jsonError(400, "invalid body");
          await saveUserProgress(userId, data.items);
          return Response.json({ items: await readUserProgress(userId) });
        }),
    },
  },
});
