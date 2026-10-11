import { buildImplementProgram, DEFAULT_TIMEOUT_MS, DEFAULT_WAIT_MS, SERIALIZE_SOURCE, type TapeEvent } from "@etalon/runner";

export type BrowserRun = {
  code: string;
  strict: boolean;
  mode: "predict" | "implement";
  tests?: Array<{ code: string }>;
  waitMs?: number;
};

function isTapeEvent(value: unknown): value is TapeEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as { type?: string };
  return event.type === "log" || event.type === "error" || event.type === "test";
}

/** HTML ends a script at `</script`. A JS `\/` is still `/`, so the string value stays intact. */
function escapeScript(source: string): string {
  return source.replace(/<\/(script)/gi, "<\\/$1");
}

/**
 * Isolated classic script, not a function. Top-level `var` / `let` and sloppy
 * `this` match the Node vm host. The page has no same-origin access, so the
 * task cannot touch the app. A late log after the wait window is dropped
 * because the listener checks the run token.
 */
export function runInBrowser(input: BrowserRun): Promise<TapeEvent[]> {
  const program =
    input.mode === "implement" ? buildImplementProgram(input.code, input.tests ?? []) : input.code;
  const waitMs = input.waitMs ?? (input.mode === "implement" ? 80 : DEFAULT_WAIT_MS);
  const timeoutMs = Math.max(DEFAULT_TIMEOUT_MS, waitMs + 700);
  const token = crypto.randomUUID();
  const source = input.strict ? `"use strict";\n${program}` : program;

  const harness = escapeScript(`
    ${SERIALIZE_SOURCE}
    window.__serialize = __serialize;
    window.__report = function (event) {
      parent.postMessage({ source: "etalon", token: ${JSON.stringify(token)}, event: event }, "*");
    };
    var send = function () {
      var args = [];
      for (var i = 0; i < arguments.length; i++) args.push(__serialize(arguments[i]));
      __report({ type: "log", args: args });
    };
    window.console = { log: send, info: send, warn: send, error: send };
    window.onerror = function (message, source, lineno, colno, error) {
      __report({
        type: "error",
        name: (error && error.name) || "Error",
        message: String((error && error.message) || message || "ошибка"),
      });
      return true;
    };
  `);

  const html = `<!doctype html><title>run</title><script>${harness}</script><script>${escapeScript(source)}</script><script>setTimeout(function(){parent.postMessage({source:"etalon",token:${JSON.stringify(token)},done:true},"*");},${waitMs});</script>`;

  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.title = "Прогон задачи";
    iframe.style.cssText = "position:absolute;width:0;height:0;border:0";
    const events: TapeEvent[] = [];
    let settled = false;

    const finish = (timedOut: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      iframe.remove();
      if (timedOut) {
        events.push({ type: "error", name: "TimeoutError", message: "execution timed out" });
      }
      resolve(events);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data as { source?: string; token?: string; event?: unknown; done?: boolean } | null;
      if (!data || data.source !== "etalon" || data.token !== token) return;
      if (isTapeEvent(data.event)) events.push(data.event);
      if (data.done) finish(false);
    };

    const timer = window.setTimeout(() => finish(true), timeoutMs);
    window.addEventListener("message", onMessage);
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  });
}
