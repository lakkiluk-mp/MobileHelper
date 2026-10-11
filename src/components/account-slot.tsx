import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function AccountSlot() {
  const { user, isPending } = useCurrentUserState();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  if (!ready || isPending) return <div className="h-8 w-20 animate-pulse rounded-full bg-line" />;
  if (user) return <UserButton />;
  return (
    <Link to="/login" className="inline-flex min-h-11 items-center text-sm text-mark no-underline">
      Войти
    </Link>
  );
}
