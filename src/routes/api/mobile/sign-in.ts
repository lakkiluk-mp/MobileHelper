import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

export const Route = createFileRoute("/api/mobile/sign-in")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const response = await auth.api.signInSocial({
          body: { provider: "google", callbackURL: "/api/mobile/done" },
          headers: request.headers,
          asResponse: true,
        });
        const data = (await response.json()) as { url?: string };
        if (!data.url) return new Response("Sign-in unavailable", { status: 503 });
        const headers = new Headers({ location: data.url });
        for (const cookie of response.headers.getSetCookie()) headers.append("set-cookie", cookie);
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
