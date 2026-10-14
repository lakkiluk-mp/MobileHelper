import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

const APP_CALLBACK = "etalon://auth";

export const Route = createFileRoute("/api/mobile/done")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
          query: { disableCookieCache: true },
        });
        const target = session
          ? `${APP_CALLBACK}?token=${encodeURIComponent(session.session.token)}`
          : `${APP_CALLBACK}?error=no_session`;
        return new Response(null, { status: 302, headers: { location: target } });
      },
    },
  },
});
