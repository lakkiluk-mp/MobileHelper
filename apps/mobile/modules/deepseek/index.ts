import { requireOptionalNativeModule } from "expo";

type Result = "sent" | "opened" | "missing";

const native = requireOptionalNativeModule<{ send(packageName: string, text: string): Result }>("Deepseek");

export function sendToApp(packageName: string, text: string): Result | null {
  return native ? native.send(packageName, text) : null;
}
