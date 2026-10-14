import { createFileRoute } from "@tanstack/react-router";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";

const APK_NAME = "etalon.apk";

export const Route = createFileRoute("/download/apk")({
  server: {
    handlers: {
      GET: async () => {
        const path = join(process.env.APK_DIR?.trim() || "/data/apk", APK_NAME);
        const info = await stat(path).catch(() => null);
        if (!info?.isFile()) return new Response("APK not found", { status: 404 });
        const body = Readable.toWeb(createReadStream(path)) as ReadableStream;
        return new Response(body, {
          headers: {
            "content-type": "application/vnd.android.package-archive",
            "content-length": String(info.size),
            "content-disposition": `attachment; filename="${APK_NAME}"`,
            "cache-control": "no-cache",
          },
        });
      },
    },
  },
});
