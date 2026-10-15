import { useCallback, useEffect, useState } from "react";
import { checkUpdate, installUpdate } from "./update";

export function useUpdate(checkOnMount: boolean) {
  const [available, setAvailable] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  const check = useCallback(async (silent: boolean) => {
    setChecking(true);
    setError(null);
    try {
      setAvailable(await checkUpdate());
      setChecked(true);
    } catch {
      if (!silent) setError("Не удалось проверить обновления");
    } finally {
      setChecking(false);
    }
  }, []);

  const install = useCallback(async () => {
    setError(null);
    setProgress(0);
    try {
      await installUpdate(setProgress);
    } catch {
      setError("Не удалось скачать обновление");
    } finally {
      setProgress(null);
    }
  }, []);

  useEffect(() => {
    if (checkOnMount) void check(true);
  }, [check, checkOnMount]);

  return {
    available,
    checking,
    checked,
    progress,
    error,
    hidden,
    check: () => check(false),
    install,
    dismiss: () => setHidden(true),
  };
}
