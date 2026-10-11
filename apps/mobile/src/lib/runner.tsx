import {
  buildImplementProgram,
  DEFAULT_TIMEOUT_MS,
  SERIALIZE_SOURCE,
  type TapeEvent,
} from "@etalon/runner";
import * as Crypto from "expo-crypto";
import { useRef } from "react";
import { StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

export type PhoneRun = {
  code: string;
  strict: boolean;
  mode: "predict" | "implement";
  tests?: Array<{ code: string }>;
  waitMs?: number;
};

type Pending = {
  token: string;
  events: TapeEvent[];
  resolve: (events: TapeEvent[]) => void;
  timer: ReturnType<typeof setTimeout>;
};

type Bridge = {
  run: (input: PhoneRun) => Promise<TapeEvent[]>;
  onMessage: (event: WebViewMessageEvent) => void;
  markReady: () => void;
};

function escapeScript(source: string): string {
  return source.replace(/<\/(script)/gi, "<\\/$1");
}

function isTapeEvent(value: unknown): value is TapeEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as { type?: string };
  return event.type === "log" || event.type === "error" || event.type === "test";
}

function iframeHtml(input: PhoneRun, token: string, waitMs: number): string {
  const program = input.mode === "implement" ? buildImplementProgram(input.code, input.tests ?? []) : input.code;
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
  return `<!doctype html><title>run</title><script>${harness}</script><script>${escapeScript(source)}</script><script>setTimeout(function(){parent.postMessage({source:"etalon",token:${JSON.stringify(token)},done:true},"*");},${waitMs});</script>`;
}

const HOST = `<!doctype html><html><body><script>
window.__run = function (payload) {
  var token = payload.token;
  var iframe = document.createElement("iframe");
  iframe.setAttribute("sandbox", "allow-scripts");
  iframe.srcdoc = payload.html;
  function onMessage(event) {
    if (event.source !== iframe.contentWindow) return;
    var data = event.data;
    if (!data || data.source !== "etalon" || data.token !== token) return;
    window.ReactNativeWebView.postMessage(JSON.stringify({ token: token, event: data.event, done: !!data.done }));
    if (data.done) {
      window.removeEventListener("message", onMessage);
      iframe.remove();
    }
  }
  window.addEventListener("message", onMessage);
  document.body.appendChild(iframe);
};
</script></body></html>`;

let bridge: Bridge | null = null;

export function runInPhone(input: PhoneRun): Promise<TapeEvent[]> {
  if (!bridge) return Promise.resolve([{ type: "error", name: "RunnerError", message: "прогон ещё не готов" }]);
  return bridge.run(input);
}

export function RunnerHost() {
  const webRef = useRef<WebView>(null);
  const pending = useRef<Pending | null>(null);
  const ready = useRef(false);
  const queue = useRef<Array<() => void>>([]);

  const finish = (timedOut: boolean) => {
    const current = pending.current;
    if (!current) return;
    pending.current = null;
    clearTimeout(current.timer);
    if (timedOut) current.events.push({ type: "error", name: "TimeoutError", message: "execution timed out" });
    current.resolve(current.events);
  };

  const api: Bridge = {
    markReady: () => {
      ready.current = true;
      const jobs = queue.current.splice(0);
      for (const job of jobs) job();
    },
    onMessage: (event) => {
      const current = pending.current;
      if (!current) return;
      let data: { token?: string; event?: unknown; done?: boolean } | null = null;
      try {
        data = JSON.parse(event.nativeEvent.data) as { token?: string; event?: unknown; done?: boolean };
      } catch {
        return;
      }
      if (!data || data.token !== current.token) return;
      if (isTapeEvent(data.event)) current.events.push(data.event);
      if (data.done) finish(false);
    },
    run: (input) =>
      new Promise((resolve) => {
        const start = () => {
          if (pending.current) finish(true);
          const token = Crypto.randomUUID();
          const waitMs = input.waitMs ?? (input.mode === "implement" ? 80 : 60);
          const timeoutMs = Math.max(DEFAULT_TIMEOUT_MS, waitMs + 700);
          const timer = setTimeout(() => finish(true), timeoutMs);
          pending.current = { token, events: [], resolve, timer };
          const html = iframeHtml(input, token, waitMs);
          webRef.current?.injectJavaScript(`window.__run(${JSON.stringify({ token, html })});true;`);
        };
        if (ready.current && webRef.current) start();
        else queue.current.push(start);
      }),
  };
  bridge = api;

  return (
    <WebView
      ref={webRef}
      originWhitelist={["*"]}
      source={{ html: HOST }}
      onLoadEnd={api.markReady}
      onMessage={api.onMessage}
      javaScriptEnabled
      style={styles.host}
    />
  );
}

const styles = StyleSheet.create({
  host: { position: "absolute", width: 1, height: 1, opacity: 0 },
});
