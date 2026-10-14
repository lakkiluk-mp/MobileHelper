import type { Card } from "@etalon/shared";
import * as Clipboard from "expo-clipboard";
import { Linking, Platform, Share, ToastAndroid } from "react-native";
import { sendToApp } from "../../modules/deepseek";

const ANDROID_PACKAGE = "com.deepseek.chat";
const WEB_URL = "https://chat.deepseek.com";

function block(code: string): string {
  return "```js\n" + code.trim() + "\n```";
}

export function discussText(card: Card): string {
  if (card.kind === "predict") {
    return [
      `Разбери задачу «${card.title}».`,
      "Что выведет этот JavaScript-код и почему именно так? Объясни пошагово порядок выполнения, какие механизмы языка тут работают и где обычно ошибаются.",
      block(card.code),
      `Правильный ответ: ${card.answer}`,
    ].join("\n\n");
  }
  return [
    `Помоги разобраться с задачей «${card.title}».`,
    card.statement,
    "Заготовка:",
    block(card.starter),
    "Эталонное решение:",
    block(card.solution),
    "Объясни идею решения и почему оно работает, разбери типичные ошибки и сложность. Если есть другие подходы — покажи и сравни.",
  ].join("\n\n");
}

async function open(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

async function copy(text: string): Promise<void> {
  try {
    await Clipboard.setStringAsync(text);
  } catch {
    return;
  }
}

export async function discussInDeepseek(card: Card): Promise<void> {
  const text = discussText(card);
  if (Platform.OS === "android") {
    const result = sendToApp(ANDROID_PACKAGE, text);
    if (result === "sent") return;
    await copy(text);
    if (result === "opened") {
      ToastAndroid.show("Промпт скопирован — вставь в чат", ToastAndroid.LONG);
      return;
    }
    if (result === "missing" && (await open(`market://details?id=${ANDROID_PACKAGE}`))) return;
  } else {
    await copy(text);
    if (await open(WEB_URL)) return;
  }
  try {
    await Share.share({ message: text });
  } catch {
    return;
  }
}
