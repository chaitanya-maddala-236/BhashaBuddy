import { PHRASES, type LanguageCode, type Phrase } from "@/lib/bhashabuddy-data";

export type ShadowingMode = "sentence" | "dialogue";
export type ShadowingLine = Phrase & { speaker?: "PARTNER" | "YOU" };
export type ShadowingItem = {
  id: string;
  title: string;
  kind: ShadowingMode;
  lines: ShadowingLine[];
};

const dialogueCards = [
  { id: "meet-someone", title: "Meet someone new", phraseIds: ["hello", "name-q", "name"] },
  { id: "find-the-station", title: "Find the bus station", phraseIds: ["bus-where", "left"] },
];

export function getShadowingItems(language: LanguageCode, mode: ShadowingMode): ShadowingItem[] {
  const phrases = PHRASES[language];
  if (mode === "sentence") {
    return phrases.map((phrase) => ({ id: phrase.id, title: phrase.meaning, kind: "sentence", lines: [phrase] }));
  }

  return dialogueCards.flatMap((card) => {
    const lines = card.phraseIds
      .map((id, index) => {
        const phrase = phrases.find((entry) => entry.id === `${language}-${id}`);
        if (!phrase) return null;
        const speaker = card.id === "meet-someone"
          ? index === 1 ? "PARTNER" : "YOU"
          : index === 0 ? "YOU" : "PARTNER";
        return { ...phrase, speaker } as ShadowingLine;
      })
      .filter((phrase): phrase is ShadowingLine => Boolean(phrase));
    return lines.length > 1 ? [{ id: card.id, title: card.title, kind: "dialogue" as const, lines }] : [];
  });
}

export function getShadowingItem(language: LanguageCode, mode: ShadowingMode, itemId: string): ShadowingItem | null {
  return getShadowingItems(language, mode).find((item) => item.id === itemId) ?? null;
}
