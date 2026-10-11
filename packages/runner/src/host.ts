import type { TapeEvent } from "./tape.ts";

export type RunOptions = {
  /** Classic script when false. Strict is a property of the card, not of the app. */
  strict: boolean;
  timeoutMs?: number;
  /** How long to keep the run open so microtasks and 0-delay timers can land. */
  waitMs?: number;
  runId?: string;
};

export interface HostAdapter {
  run(code: string, options: RunOptions): Promise<TapeEvent[]>;
}

export const DEFAULT_TIMEOUT_MS = 1000;
export const DEFAULT_WAIT_MS = 40;
