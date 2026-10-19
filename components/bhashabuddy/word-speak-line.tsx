"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { getGeminiApiKey } from "@/lib/gemini-session";
import { getLanguage, type LanguageCode } from "@/lib/bhashabuddy-data";
import { playLanguageSpeech } from "@/lib/speech-playback";

export function WordSpeakLine({ text, languageCode, className = "" }: { text: string; languageCode: LanguageCode; className?: string }) {
  const [notice, setNotice] = useState("");
  const language = getLanguage(languageCode);
  const words = text.match(/\S+\s*/gu) ?? [text];

  return (
    <>
      <span className={`word-speak-line ${className}`} lang={language.locale}>
        {words.map((part, index) => {
          const word = part.trimEnd();
          const spacing = part.slice(word.length);
          return (
            <span className="word-speak-token" key={`${word}-${index}`}>
              <span>{word}</span>
              <button type="button" className="word-speak-button" onClick={() => {
                setNotice("");
                void playLanguageSpeech({
                  text: word,
                  language,
                  apiKey: getGeminiApiKey(),
                  callbacks: {
                    onFallback: (reason) => setNotice(`Gemini voice unavailable: ${reason} Trying your browser voice.`),
                    onError: setNotice,
                  },
                });
              }} aria-label={`Hear ${word}`} title="Hear this word">
                <Volume2 size={12} aria-hidden="true" />
              </button>{spacing}
            </span>
          );
        })}
      </span>
      {notice && <span className="word-speak-notice" role="status">{notice}</span>}
    </>
  );
}
