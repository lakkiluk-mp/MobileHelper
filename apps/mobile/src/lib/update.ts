import * as Application from "expo-application";
import { File, Paths } from "expo-file-system";
import { getContentUriAsync } from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";
import { API_URL, APK_URL } from "./sync";

const FLAG_GRANT_READ_URI_PERMISSION = 1;
const FLAG_ACTIVITY_NEW_TASK = 0x10000000;

export const currentVersion = Application.nativeApplicationVersion ?? "0.0.0";

function compareVersions(left: string, right: string): number {
  const a = left.split(".").map((part) => Number.parseInt(part, 10) || 0);
  const b = right.split(".").map((part) => Number.parseInt(part, 10) || 0);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export async function checkUpdate(): Promise<string | null> {
  if (Platform.OS !== "android") return null;
  const response = await fetch(`${API_URL}/download/version`, {
    headers: { "cache-control": "no-cache" },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const { version } = (await response.json()) as { version?: string };
  if (!version) return null;
  return compareVersions(version, currentVersion) > 0 ? version : null;
}

export async function installUpdate(onProgress: (share: number) => void): Promise<void> {
  const target = new File(Paths.cache, "etalon-update.apk");
  const apk = await File.downloadFileAsync(APK_URL, target, {
    idempotent: true,
    onProgress: ({ bytesWritten, totalBytes }) => {
      if (totalBytes > 0) onProgress(bytesWritten / totalBytes);
    },
  });
  const uri = await getContentUriAsync(apk.uri);
  await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
    data: uri,
    type: "application/vnd.android.package-archive",
    flags: FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK,
  });
}
