import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm items-center px-5">
        <div className="h-11 w-full animate-pulse rounded-full bg-line" />
      </main>
    );
  }
  if (user) return <Navigate to="/" />;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-5">
      <p className="text-xs font-medium tracking-widest text-muted uppercase">Эталон</p>
      <h1 className="mt-2 text-3xl text-ink">Вход</h1>
      <p className="mt-3 text-sm text-pretty text-muted">
        Чтобы оценка с этого устройства подтянулась на другое. Без входа всё остаётся локально.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        {authEnabled ? (
          GROK_PROVIDERS.map((provider) => (
            <button
              key={provider.providerId}
              type="button"
              onClick={() => signIn(provider.providerId, { callbackURL: "/" })}
              className="min-h-11 rounded-full border border-line bg-card px-4 text-sm text-ink"
            >
              Войти через {provider.label}
            </button>
          ))
        ) : (
          <p className="text-sm text-muted">Вход выключен.</p>
        )}
      </div>
      <Link to="/" className="mt-6 inline-flex min-h-11 items-center text-sm text-mark no-underline">
        Назад к задачам
      </Link>
    </main>
  );
}
