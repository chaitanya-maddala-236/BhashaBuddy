"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, ExternalLink, KeyRound, Languages, LoaderCircle, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RouteActions } from "@/components/bhashabuddy/app";
import { getLanguage } from "@/lib/bhashabuddy-data";
import { clearGeminiApiKey, getGeminiApiKey, saveGeminiApiKey } from "@/lib/gemini-session";
import { LanguagePicker } from "@/components/bhashabuddy/language-picker";

const goals = [
  { id: "college", label: "College" },
  { id: "work", label: "Work" },
  { id: "travel", label: "Travel" },
  { id: "everyday", label: "Everyday life" },
  { id: "family", label: "Family & friends" },
] as const;

function GeminiKeySettings() {
  const [draft, setDraft] = useState("");
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    const hasKey = Boolean(getGeminiApiKey());
    setHasSavedKey(hasKey);
    if (hasKey) setStatus({ kind: "success", text: "A Gemini key was checked and saved for this tab. Re-check it if you changed its access." });
  }, []);

  async function checkKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = draft.trim() || getGeminiApiKey();
    if (!candidate) {
      setStatus({ kind: "error", text: "Paste a Gemini API key before checking it." });
      return;
    }

    setChecking(true);
    setStatus({ kind: "info", text: "Checking Gemini access…" });
    try {
      const response = await fetch("/api/gemini/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: candidate }),
      });
      const result = await response.json() as { ok?: boolean; error?: string; model?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Gemini could not confirm this key.");

      saveGeminiApiKey(candidate);
      setHasSavedKey(true);
      setDraft("");
      setStatus({ kind: "success", text: `Confirmed. BhashaBuddy can reach ${result.model ?? "Gemini"} with this key.` });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gemini could not confirm this key.";
      setStatus({ kind: "error", text: hasSavedKey ? `${message} Your previously checked key is still active.` : message });
    } finally {
      setChecking(false);
    }
  }

  function forgetKey() {
    clearGeminiApiKey();
    setHasSavedKey(false);
    setDraft("");
    setStatus({ kind: "info", text: "Gemini key removed from this tab. Speaking practice will use the sample tutor." });
  }

  return (
    <div className="gemini-settings">
      <div className="gemini-settings__status">
        <span className={"gemini-status-dot" + (hasSavedKey ? " is-connected" : "")} />
        <span>{hasSavedKey ? "KEY CHECKED FOR THIS TAB" : "OPTIONAL · BYO GEMINI KEY"}</span>
      </div>
      <p className="gemini-settings__intro">Use your own Gemini API key for live, scenario-based replies. BhashaBuddy checks access before saving the key for this browser tab.</p>
      <form onSubmit={checkKey} className="gemini-key-form">
        <label htmlFor="gemini-api-key">GEMINI API KEY</label>
        <div className="gemini-key-controls">
          <div className="gemini-key-input-wrap"><KeyRound size={15} aria-hidden="true" /><input id="gemini-api-key" type="password" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={hasSavedKey ? "Enter a new key to replace the checked one" : "Paste your Gemini API key"} autoComplete="off" autoCapitalize="none" spellCheck={false} /></div>
          <Button className="btn-primary" type="submit" disabled={checking || (!draft.trim() && !hasSavedKey)}>{checking ? <LoaderCircle size={14} className="spin-icon" /> : <Check size={14} />}{draft.trim() ? "Check & save" : "Check saved key"}</Button>
          {hasSavedKey && <Button className="btn-line gemini-forget" type="button" onClick={forgetKey} disabled={checking}><Trash2 size={14} /> Forget</Button>}
        </div>
      </form>
      {status && <p className={"gemini-status-message is-" + status.kind} role="status" aria-live="polite">{status.text}</p>}
      <div className="gemini-settings__foot">
        <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get a key from Google AI Studio <ExternalLink size={12} /></a>
        <span>Use a Gemini API-restricted key.</span>
      </div>
      <div className="gemini-key-privacy"><ShieldCheck size={16} /><p>Saved in this tab's session storage only. The key is sent to BhashaBuddy's server route for requests and forwarded to Google in its API-key header; this app does not save it on a server. Clear it before leaving a shared device.</p></div>
    </div>
  );
}

export function SettingsPage({ actions }: { actions: RouteActions }) {
  const profile = actions.state.profile!;
  const language = getLanguage(profile.targetLanguage);
  const [confirmReset, setConfirmReset] = useState(false);

  function updateProfile<K extends keyof typeof profile>(key: K, value: (typeof profile)[K]) {
    actions.setState((previous) => previous.profile
      ? { ...previous, profile: { ...previous.profile, [key]: value } }
      : previous);
  }

  return (
    <div className="settings-page">
      <div className="page-overline"><span>06 / YOUR PREFERENCES</span><span>PRIVATE LEARNING JOURNAL</span></div>
      <header className="screen-heading screen-heading--settings">
        <div><span className="eyebrow">MAKE THIS YOURS</span><h1>A few things<br /><em>to set your way.</em></h1></div>
        <p>Choose the support that makes it easier to start a conversation. You can change any of these choices whenever you need to.</p>
      </header>

      <section className="settings-section">
        <div className="settings-section__intro"><span className="settings-section__number">01</span><div><h2>Your languages</h2><p>Pick a language to learn and the language you prefer for instruction.</p></div></div>
        <div className="settings-fields settings-language-fields">
          <div className="settings-field settings-language-selection"><span>LANGUAGE YOU'RE LEARNING</span><LanguagePicker compact value={profile.targetLanguage} onChange={(value) => updateProfile("targetLanguage", value)} /><small>Sample content is available in five languages.</small></div>
          <label className="settings-field"><span>INSTRUCTION LANGUAGE</span><select value={profile.preferredLanguage} onChange={(event) => updateProfile("preferredLanguage", event.target.value as "English" | "Hindi")}><option>English</option><option>Hindi</option></select><small>Meaning notes currently appear in English in the demo.</small></label>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__intro"><span className="settings-section__number">02</span><div><h2>Your everyday goal</h2><p>Set the situations you want to feel more ready for.</p></div></div>
        <div className="preference-choice-list">
          {goals.map((goal) => <button key={goal.id} className={"preference-choice" + (profile.goal === goal.id ? " is-selected" : "")} onClick={() => updateProfile("goal", goal.id)} aria-pressed={profile.goal === goal.id}>{goal.label}{profile.goal === goal.id && <Check size={15} />}</button>)}
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__intro"><span className="settings-section__number">03</span><div><h2>Your daily rhythm</h2><p>A small, repeatable commitment is easier to carry into a busy week.</p></div></div>
        <div className="commitment-row" role="group" aria-label="Daily practice commitment">
          {[5, 10, 15, 20].map((minutes) => <button key={minutes} className={profile.minutesPerDay === minutes ? "is-selected" : ""} onClick={() => updateProfile("minutesPerDay", minutes as 5 | 10 | 15 | 20)} aria-pressed={profile.minutesPerDay === minutes}><strong>{minutes}</strong><span>minutes / day</span></button>)}
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__intro"><span className="settings-section__number">04</span><div><h2>Make script comfortable</h2><p>Choose how target-language phrases appear as you learn.</p></div></div>
        <div className="preference-choice-list">
          <button className={"preference-choice" + (profile.scriptPreference === "both" ? " is-selected" : "")} onClick={() => updateProfile("scriptPreference", "both")} aria-pressed={profile.scriptPreference === "both"}>Script + transliteration {profile.scriptPreference === "both" && <Check size={15} />}</button>
          <button className={"preference-choice" + (profile.scriptPreference === "transliteration" ? " is-selected" : "")} onClick={() => updateProfile("scriptPreference", "transliteration")} aria-pressed={profile.scriptPreference === "transliteration"}>Transliteration first {profile.scriptPreference === "transliteration" && <Check size={15} />}</button>
          <button className={"preference-choice" + (profile.scriptPreference === "native-first" ? " is-selected" : "")} onClick={() => updateProfile("scriptPreference", "native-first")} aria-pressed={profile.scriptPreference === "native-first"}>Native script first {profile.scriptPreference === "native-first" && <Check size={15} />}</button>
        </div>
      </section>

      <section className="settings-section">
        <div className="settings-section__intro"><span className="settings-section__number">05</span><div><h2>Gemini speaking tutor</h2><p>Connect your own key for live role-play and keep control of it.</p></div></div>
        <GeminiKeySettings />
      </section>

      <section className="settings-section settings-section--privacy">
        <div className="settings-section__intro"><span className="settings-section__number">06</span><div><h2>Privacy & local data</h2><p>Your sample journal stays in this browser.</p></div></div>
        <div className="privacy-info"><ShieldCheck size={20} /><div><strong>No raw audio is saved.</strong><p>Microphone access starts only after you press the button. Browser speech recognition may process your voice according to your browser provider. Conversation text is kept for this tab only and sent to Gemini only when your key is connected; use Clear memory in the conversation to remove it. Lessons, preferences, completion history, and saved phrases remain in your browser's local storage.</p></div></div>
      </section>

      <section className="settings-reset">
        <div><span className="eyebrow">START WITH A CLEAN PAGE</span><h2>{profile.isDemo ? "Replace the sample journal." : "Reset this learning journal."}</h2><p>{profile.isDemo ? "This removes the example progress and lets you set up your own 30-day path." : "This clears saved preferences, completed lessons, and bookmarked phrases from this browser."}</p></div>
        {!confirmReset ? <Button className="btn-line" onClick={() => setConfirmReset(true)}><RotateCcw size={14} /> Reset local data</Button> :
          <div className="reset-confirm" role="alert"><p>Clear this journal from the current browser?</p><button className="text-link" onClick={() => setConfirmReset(false)}>Keep it</button><Button className="btn-danger" onClick={actions.resetDemo}>Clear local journal</Button></div>}
      </section>
      <div className="settings-footnote"><Languages size={16} /><span>Currently learning {language.name} · {language.script} script.</span><button onClick={() => actions.go("/dashboard")}>Return to Learn <ArrowRight size={14} /></button></div>
    </div>
  );
}
