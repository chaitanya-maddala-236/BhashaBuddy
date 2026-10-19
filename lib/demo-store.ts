import type { LanguageCode } from "@/lib/bhashabuddy-data";

export type Profile = {
  name: string;
  preferredLanguage: "English" | "Hindi";
  targetLanguage: LanguageCode;
  level: "beginner" | "some-words" | "understand";
  goal: "college" | "work" | "travel" | "everyday" | "family";
  minutesPerDay: 5 | 10 | 15 | 20;
  scriptPreference: "transliteration" | "native-first" | "both";
  isDemo: boolean;
};

export type AppState = {
  profile: Profile | null;
  completedDays: number[];
  savedPhraseIds: string[];
  practiceDates: string[];
  minutesByDate: Record<string, number>;
  recentPractice: number;
};

export const STORAGE_KEY = "bhashabuddy-journal-v1";

export const EMPTY_STATE: AppState = {
  profile: null,
  completedDays: [],
  savedPhraseIds: [],
  practiceDates: [],
  minutesByDate: {},
  recentPractice: 0,
};

export const DEMO_STATE: AppState = {
  profile: {
    name: "Ananya",
    preferredLanguage: "English",
    targetLanguage: "te",
    level: "some-words",
    goal: "everyday",
    minutesPerDay: 10,
    scriptPreference: "both",
    isDemo: true,
  },
  completedDays: [1, 2, 3, 4, 5, 6, 7],
  savedPhraseIds: ["te-bus-where", "te-repeat", "te-hello"],
  practiceDates: ["d-6", "d-5", "d-4", "d-2", "d-1"],
  minutesByDate: { "d-6": 8, "d-5": 12, "d-4": 10, "d-2": 8, "d-1": 10 },
  recentPractice: 3,
};

export function loadState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...EMPTY_STATE,
      ...parsed,
      profile: parsed.profile ?? null,
      completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : [],
      savedPhraseIds: Array.isArray(parsed.savedPhraseIds) ? parsed.savedPhraseIds : [],
      practiceDates: Array.isArray(parsed.practiceDates) ? parsed.practiceDates : [],
      minutesByDate: parsed.minutesByDate ?? {},
      recentPractice: parsed.recentPractice ?? 0,
    };
  } catch {
    return EMPTY_STATE;
  }
}

export function saveState(state: AppState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing or a full storage quota should not prevent a lesson.
  }
}

export function dayKey(offset: number) {
  return "d-" + offset;
}
