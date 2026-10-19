"use client";

import { useMemo, useState } from "react";
import { Bookmark, Check, Headphones, Search, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RouteActions } from "@/components/bhashabuddy/app";
import { getLanguage, PHRASES } from "@/lib/bhashabuddy-data";
import { WordSpeakLine } from "@/components/bhashabuddy/word-speak-line";

const categories = ["All phrases", "Greetings", "Introductions", "Transport", "Directions", "Food", "Shopping", "Asking for help"];

function speak(text: string, locale: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  window.speechSynthesis.speak(utterance);
}

export function PhrasebookPage({ actions }: { actions: RouteActions }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All phrases");
  const [savedOnly, setSavedOnly] = useState(false);
  const profile = actions.state.profile!;
  const language = getLanguage(profile.targetLanguage);
  const phrases = PHRASES[profile.targetLanguage];

  const filtered = useMemo(() => phrases.filter((phrase) => {
    const matchesCategory = category === "All phrases"
      || (category === "Asking for help" ? phrase.category === "Asking for help" : phrase.category === category);
    const matchesSaved = !savedOnly || actions.state.savedPhraseIds.includes(phrase.id);
    const term = query.trim().toLocaleLowerCase();
    const matchesQuery = !term || [phrase.nativeText, phrase.transliteration, phrase.meaning, phrase.category]
      .some((value) => value.toLocaleLowerCase().includes(term));
    return matchesCategory && matchesSaved && matchesQuery;
  }), [actions.state.savedPhraseIds, category, phrases, query, savedOnly]);

  return (
    <div className="phrasebook-page">
      <div className="page-overline"><span>04 / YOUR POCKET INDEX</span><span>{language.name.toUpperCase()} <i>·</i> {phrases.length} SAMPLE PHRASES</span></div>
      <header className="screen-heading screen-heading--phrasebook">
        <div><span className="eyebrow">A PERSONAL COLLECTION</span><h1>Keep the words<br /><em>you want to use.</em></h1></div>
        <p>Search by meaning, script, or sound. Save a phrase when it feels useful, then come back to it before your next conversation.</p>
      </header>
      <div className="phrasebook-tools">
        <div className="search-wrap"><Search size={17} /><label htmlFor="phrase-search" className="sr-only">Search your phrasebook</label><Input id="phrase-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a word or situation" />
          {query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={15} /></button>}
        </div>
        <button className={"saved-filter" + (savedOnly ? " is-active" : "")} onClick={() => setSavedOnly((value) => !value)} aria-pressed={savedOnly}><Bookmark size={15} fill={savedOnly ? "currentColor" : "none"} /> Saved <span>{actions.state.savedPhraseIds.filter((id) => phrases.some((phrase) => phrase.id === id)).length}</span></button>
      </div>
      <div className="category-tabs" role="tablist" aria-label="Phrase categories">
        {categories.map((item) => <button key={item} role="tab" aria-selected={category === item} className={category === item ? "is-active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
      </div>

      <div className="phrasebook-list" aria-live="polite">
        <div className="phrasebook-list__heading"><span>PHRASE</span><span>MEANING & CONTEXT</span><span>KEEP</span></div>
        {filtered.length ? filtered.map((phrase, index) => {
          const saved = actions.state.savedPhraseIds.includes(phrase.id);
          return <article className="phrasebook-row" key={phrase.id}>
            <div className="phrasebook-row__main">
              <span className="phrasebook-row__number">{String(index + 1).padStart(2, "0")}</span>
              <div><p className="phrasebook-native"><WordSpeakLine text={phrase.nativeText} languageCode={profile.targetLanguage} /></p><p className="phrasebook-translit">{phrase.transliteration}</p></div>
              <button className="phrase-play" onClick={() => speak(phrase.nativeText, language.locale)} aria-label={"Play " + phrase.meaning}><Volume2 size={16} /><span>Listen</span></button>
            </div>
            <div className="phrasebook-row__meaning"><span className="phrase-category">{phrase.category.toUpperCase()}</span><strong>{phrase.meaning}</strong><p>{phrase.note}</p></div>
            <button className={"phrase-save" + (saved ? " is-saved" : "")} onClick={() => actions.toggleSaved(phrase.id)} aria-label={(saved ? "Remove from saved phrases" : "Save phrase") + ": " + phrase.meaning}>{saved ? <Check size={16} /> : <Bookmark size={16} />}</button>
          </article>;
        }) : <div className="phrasebook-empty"><span className="empty-mark">01</span><h2>No phrase on this page.</h2><p>Try a different word or clear your filters.</p><Button className="btn-line" onClick={() => { setQuery(""); setCategory("All phrases"); setSavedOnly(false); }}>Show all phrases</Button></div>}
      </div>
      <div className="phrasebook-note"><span>EDITOR&apos;S NOTE</span><p>These sample phrases are for practice and demonstration. Usage and transliteration may vary by region; no phrase is marked as independently reviewed.</p><Headphones size={19} /></div>
    </div>
  );
}
