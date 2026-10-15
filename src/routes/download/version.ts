import { createFileRoute } from "@tanstack/react-router";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const MANIFEST_NAME = "etalon.json";

export const Route = createFileRoute("/download/version")({
  server: {
    handlers: {
      GET: async () => {
        const path = join(process.env.APK_DIR?.trim() || "/data/apk", MANIFEST_NAME);
        const manifest = (await readFile(path, "utf8")
          .then((raw) => JSON.parse(raw))
          .catch(() => null)) as { version?: unknown } | null;
        if (typeof manifest?.version !== "string") {
          return new Response("Version not found", { status: 404 });
        }
        return Response.json(
          { version: manifest.version },
          { headers: { "cache-control": "no-cache" } },
        );
      },
    },
  },
});
