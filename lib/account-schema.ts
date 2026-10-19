import { z } from "zod";

const languageCode = z.enum(["te", "hi", "ta", "kn", "ml"]);

const profileSchema = z.object({
  name: z.string().max(80),
  preferredLanguage: z.enum(["English", "Hindi"]),
  targetLanguage: languageCode,
  level: z.enum(["beginner", "some-words", "understand"]),
  goal: z.enum(["college", "work", "travel", "everyday", "family"]),
  minutesPerDay: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]),
  scriptPreference: z.enum(["transliteration", "native-first", "both"]),
  isDemo: z.boolean(),
});

export const learnerStateSchema = z.object({
  profile: profileSchema.nullable(),
  completedDays: z.array(z.number().int().min(1).max(30)).max(30),
  savedPhraseIds: z.array(z.string().min(1).max(100)).max(500),
  practiceDates: z.array(z.string().min(1).max(16)).max(730),
  minutesByDate: z.record(z.string().min(1).max(16), z.number().int().min(0).max(1440))
    .refine((value) => Object.keys(value).length <= 730),
  recentPractice: z.number().int().min(0).max(100_000),
}).strict();

export const conversationMessageSchema = z.object({
  role: z.enum(["tutor", "learner"]),
  text: z.string().max(600),
  meaning: z.string().max(300).optional(),
  feedback: z.string().max(500).optional(),
  transliteration: z.string().max(300).optional(),
  provider: z.enum(["gemini", "sample"]).optional(),
}).strict();

export const conversationMemorySchema = z.array(conversationMessageSchema).max(12);

export const memoryLanguageSchema = languageCode;
export const memoryScenarioSchema = z.string().trim().min(1).max(80).regex(/^[a-z0-9-]+$/);

export type LearnerStatePayload = z.infer<typeof learnerStateSchema>;
export type ConversationMemoryPayload = z.infer<typeof conversationMemorySchema>;
