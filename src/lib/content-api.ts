import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getManifest = createServerFn({ method: "GET" }).handler(async () => {
  const { readManifest } = await import("./catalog.server");
  return readManifest();
});

export const getTasks = createServerFn({ method: "GET" })
  .validator(z.object({ ids: z.array(z.string().min(1)).max(80) }))
  .handler(async ({ data }) => {
    const { readTasks } = await import("./catalog.server");
    return readTasks(data.ids);
  });
