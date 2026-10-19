"use client";

import { Check } from "lucide-react";
import { LANGUAGES, type LanguageCode } from "@/lib/bhashabuddy-data";

const notes: Record<LanguageCode, string> = {
  te: "South India",
  hi: "Across India",
  ta: "Tamil Nadu",
  kn: "Karnataka",
  ml: "Kerala",
};

export function LanguagePicker({
  value,
  onChange,
  compact = false,
}: {
  value: LanguageCode;
  onChange: (language: LanguageCode) => void;
  compact?: boolean;
}) {
  return (
    <div className={`language-picker${compact ? " language-picker--compact" : ""}`} role="group" aria-label="Choose a language to learn">
      {LANGUAGES.map((language, index) => {
        const selected = value === language.code;
        return (
          <button
            key={language.code}
            type="button"
            className={`language-choice language-choice--${language.code}${selected ? " is-selected" : ""}`}
            aria-pressed={selected}
            onClick={() => onChange(language.code)}
          >
            <span className="language-choice__top"><span>{String(index + 1).padStart(2, "0")}</span><span>{notes[language.code]}</span></span>
            <span className="language-choice__native" lang={language.locale}>{language.nativeName}</span>
            <span className="language-choice__name">{language.name}</span>
            {selected && <span className="language-choice__selected"><Check size={13} /> Selected</span>}
          </button>
        );
      })}
    </div>
  );
}
