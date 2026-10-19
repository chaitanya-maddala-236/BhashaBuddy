import type { LanguageCode } from "@/lib/bhashabuddy-data";

export type ConversationMessage = {
  role: "tutor" | "learner";
  text: string;
  meaning?: string;
  feedback?: string;
  transliteration?: string;
  provider?: "gemini" | "sample";
};

const API_KEY_STORAGE_KEY = "bhashabuddy.gemini.key.v1";
const MEMORY_STORAGE_PREFIX = "bhashabuddy.tutor.memory.v1";
const CLOUD_MEMORY_OPT_IN_KEY = "bhashabuddy.account.sync-memory.v1";
export const MAX_MEMORY_MESSAGES = 12;

export function getCloudMemorySyncEnabled() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CLOUD_MEMORY_OPT_IN_KEY) === "true";
  } catch {
    return false;
  }
}

export function setCloudMemorySyncEnabled(enabled: boolean) {
  try {
    if (enabled) window.localStorage.setItem(CLOUD_MEMORY_OPT_IN_KEY, "true");
    else window.localStorage.removeItem(CLOUD_MEMORY_OPT_IN_KEY);
  } catch {
    throw new Error("This browser could not save the memory setting. Check its storage settings and try again.");
  }
}

export function getGeminiApiKey() {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(API_KEY_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveGeminiApiKey(apiKey: string) {
  try {
    window.sessionStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } catch {
    throw new Error("This browser tab could not store the key. Check its storage settings and try again.");
  }
}

export function clearGeminiApiKey() {
  try {
    window.sessionStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch {
    // The key is already unavailable when session storage is disabled.
  }
}

export function getConversationMemoryKey(language: LanguageCode, scenario: string) {
  return `${MEMORY_STORAGE_PREFIX}:${language}:${scenario}`;
}

export function readConversationMemory(storageKey: string): ConversationMessage[] | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const messages = parsed.filter((item): item is ConversationMessage =>
      item !== null
      && typeof item === "object"
      && ((item as ConversationMessage).role === "tutor" || (item as ConversationMessage).role === "learner")
      && typeof (item as ConversationMessage).text === "string"
      && (item as ConversationMessage).text.length <= 600,
    );
    return messages.slice(-MAX_MEMORY_MESSAGES);
  } catch {
    return null;
  }
}

export function saveConversationMemory(storageKey: string, messages: ConversationMessage[]) {
  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(messages.slice(-MAX_MEMORY_MESSAGES)));
  } catch {
    // The conversation remains usable if the browser blocks session storage.
  }
}

export function clearConversationMemory(storageKey: string) {
  try {
    window.sessionStorage.removeItem(storageKey);
  } catch {
    // The visible conversation can still be reset in component state.
  }
}
