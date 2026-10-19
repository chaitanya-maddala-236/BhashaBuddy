"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Check, Cloud, ExternalLink, KeyRound, Languages, LoaderCircle, LogOut, Mail, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RouteActions } from "@/components/bhashabuddy/app";
import { getLanguage } from "@/lib/bhashabuddy-data";
import { clearGeminiApiKey, getGeminiApiKey, saveGeminiApiKey } from "@/lib/gemini-session";
import { getCloudMemorySyncEnabled, setCloudMemorySyncEnabled } from "@/lib/gemini-session";
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
    // This initializes UI from browser session storage after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <div className="gemini-key-privacy"><ShieldCheck size={16} /><p>Saved in this tab&apos;s session storage only. The key is sent to BhashaBuddy&apos;s server route for requests and forwarded to Google in its API-key header; this app does not save it on a server. Clear it before leaving a shared device.</p></div>
    </div>
  );
}

function AccountSyncSettings({ actions }: { actions: RouteActions }) {
  const sync = actions.accountSync;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [signingIn, setSigningIn] = useState(false);
  const [localNotice, setLocalNotice] = useState("");
  const [memorySync, setMemorySync] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Read the opt-in preference only after browser storage is available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMemorySync(getCloudMemorySyncEnabled());
  }, []);

  async function submitAccountForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSigningIn(true);
    setLocalNotice("");
    try {
      const result = await sync.requestSignIn(email, password, authMode);
      if (!result.ok) setLocalNotice(result.error || "Could not sign in.");
      else {
        setPassword("");
        setLocalNotice(result.created ? "Account created. Choose which journal to use on this device." : "Signed in. Choose which journal to use on this device.");
      }
    } catch {
      setLocalNotice("Could not reach your account server. Check your connection and try again.");
    } finally {
      setSigningIn(false);
    }
  }

  async function toggleMemorySync(enabled: boolean) {
    try {
      setCloudMemorySyncEnabled(enabled);
      setMemorySync(enabled);
      setLocalNotice(enabled
        ? "Tutor memory will sync for conversations you open on this device."
        : "Cloud tutor memory is being removed. This device keeps its tab memory until you clear it.");
      if (!enabled) {
        const response = await fetch("/api/account/memory?all=true", { method: "DELETE" });
        if (response.status === 401) setLocalNotice("This device will stop syncing tutor memory. Sign in to remove any tutor memory saved to your account.");
        else if (!response.ok) {
          const result = await response.json() as { error?: string };
          setLocalNotice(result.error || "The setting is off, but cloud memory could not be removed. Try again while signed in.");
        }
      }
    } catch (error) {
      setLocalNotice(error instanceof Error ? error.message : "Could not update the memory setting.");
    }
  }

  async function deleteCloudData() {
    setDeleting(true);
    try {
      const result = await sync.deleteCloudJournal();
      setConfirmDelete(false);
      if (result.ok) {
        setCloudMemorySyncEnabled(false);
        setMemorySync(false);
        setLocalNotice("Cloud journal and saved tutor memory deleted. Your local journal remains on this device.");
      } else {
        setLocalNotice(result.error || "Could not delete cloud data.");
      }
    } catch {
      setLocalNotice("Could not reach the account service. Your local journal is still available.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="account-sync">
      <div className="account-sync__status"><Cloud size={15} /><span>{sync.email ? "ACCOUNT JOURNAL" : "OPTIONAL · CLOUD SYNC"}</span><i className={"account-sync__dot is-" + sync.phase} /></div>
      {sync.phase === "unavailable" ? <>
        <p className="account-sync__copy">Guest mode works on this device. Set a PostgreSQL connection string on the server to enable accounts and sync.</p>
        <p className="account-sync__setup">DATABASE_URL=postgresql://…</p>
      </> : sync.phase === "checking" && !sync.email ? <p className="account-sync__copy" role="status"><LoaderCircle size={14} className="spin-icon" /> Checking account service…</p>
      : sync.email ? <>
        <div className="account-sync__identity"><div><small>SIGNED IN AS</small><strong>{sync.email}</strong></div><button className="text-link" type="button" onClick={() => void sync.signOut()}><LogOut size={14} /> Sign out</button></div>
        {sync.phase === "checking" && <p className="account-sync__copy" role="status">Checking the cloud journal…</p>}
        {sync.phase === "needs-choice" && <div className="account-sync__choice">
          <p>{sync.hasCloudJournal ? "A journal is already saved to this account. Choose which journal this device should use." : "This account has no cloud journal yet. You can move this device’s journal to it."}</p>
          <div className="account-sync__actions">
            {sync.hasCloudJournal && <Button className="btn-line" type="button" onClick={sync.useCloudJournal}>Use cloud journal</Button>}
            <Button className="btn-primary" type="button" onClick={() => void sync.uploadLocalJournal()}><Cloud size={14} />{sync.hasCloudJournal ? "Replace with this device" : "Upload this journal"}</Button>
          </div>
        </div>}
        {sync.phase === "syncing" && <p className="account-sync__copy" role="status"><LoaderCircle size={14} className="spin-icon" /> Syncing your journal…</p>}
        {sync.phase === "synced" && <p className="account-sync__copy" role="status"><Check size={14} /> Journal synced. Learning preferences and progress save automatically.</p>}
        {sync.phase === "local-only" && <div className="account-sync__choice"><p>Cloud data is deleted. This device’s local journal is still available.</p><Button className="btn-line" type="button" onClick={() => void sync.uploadLocalJournal()}><Cloud size={14} /> Upload this journal</Button></div>}
        {sync.error && <p className="account-sync__message is-error" role="alert">{sync.error}</p>}

        <label className="account-sync__memory">
          <input type="checkbox" checked={memorySync} onChange={(event) => void toggleMemorySync(event.target.checked)} />
          <span><strong>Save tutor memory to this account</strong><small>Stores recent conversation text for this device’s language and scene, so you can continue on another device. You can clear it in the conversation or turn this off to delete cloud copies.</small></span>
        </label>

        {!confirmDelete ? <button type="button" className="account-sync__delete" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> Delete cloud journal and tutor memory</button> :
          <div className="account-sync__delete-confirm" role="alert"><span>Delete saved account data? This keeps the account and this device’s local journal.</span><button type="button" className="text-link" onClick={() => setConfirmDelete(false)}>Cancel</button><Button type="button" className="btn-danger" onClick={() => void deleteCloudData()} disabled={deleting}>{deleting ? <LoaderCircle size={13} className="spin-icon" /> : <Trash2 size={13} />} Delete data</Button></div>}
      </> : <>
        <p className="account-sync__copy">Create an account or sign in with your email and password. Your guest journal stays on this device until you choose to upload it.</p>
        <form className="account-signin-form" onSubmit={submitAccountForm}>
          <div className="account-signin-form__modes" role="group" aria-label="Account action">
            <button type="button" aria-pressed={authMode === "register"} onClick={() => setAuthMode("register")}>Create account</button>
            <button type="button" aria-pressed={authMode === "login"} onClick={() => setAuthMode("login")}>Sign in</button>
          </div>
          <label htmlFor="account-email">EMAIL ADDRESS</label>
          <div className="account-signin-form__row"><div><Mail size={15} /><input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></div></div>
          <label htmlFor="account-password">PASSWORD</label>
          <div className="account-signin-form__row"><div><KeyRound size={15} /><input id="account-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={authMode === "register" ? "At least 10 characters" : "Your password"} autoComplete={authMode === "register" ? "new-password" : "current-password"} minLength={authMode === "register" ? 10 : 1} maxLength={128} required /></div><Button type="submit" className="btn-primary" disabled={signingIn || sync.phase === "checking"}>{signingIn ? <LoaderCircle size={14} className="spin-icon" /> : <ArrowRight size={14} />}{authMode === "register" ? "Create account" : "Sign in"}</Button></div>
        </form>
        {authMode === "register" && <p className="account-sync__message">Passwords are stored as one-way hashes. Account recovery is not available until an email delivery service is configured.</p>}
      </>}
      {(localNotice || sync.error) && !sync.email && <p className="account-sync__message is-error" role="status">{localNotice || sync.error}</p>}
      {sync.phase === "error" && sync.email && !sync.error && <p className="account-sync__message is-error" role="alert">The cloud sync step did not finish. Your local journal is still available.</p>}
      {localNotice && sync.email && <p className="account-sync__message" role="status">{localNotice}</p>}
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
          <div className="settings-field settings-language-selection"><span>LANGUAGE YOU&apos;RE LEARNING</span><LanguagePicker compact value={profile.targetLanguage} onChange={(value) => updateProfile("targetLanguage", value)} /><small>Sample content is available in five languages.</small></div>
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
        <div className="settings-section__intro"><span className="settings-section__number">05</span><div><h2>Account & journal sync</h2><p>Keep your progress across devices when you choose to sign in.</p></div></div>
        <AccountSyncSettings actions={actions} />
      </section>

      <section className="settings-section">
        <div className="settings-section__intro"><span className="settings-section__number">06</span><div><h2>Gemini speaking tutor</h2><p>Connect your own key for live role-play and keep control of it.</p></div></div>
        <GeminiKeySettings />
      </section>

      <section className="settings-section settings-section--privacy">
        <div className="settings-section__intro"><span className="settings-section__number">07</span><div><h2>Privacy & local data</h2><p>Choose what stays on this device and what syncs.</p></div></div>
        <div className="privacy-info"><ShieldCheck size={20} /><div><strong>No raw audio is saved.</strong><p>Microphone access starts only after you press the button. Browser speech recognition may process your voice according to your browser provider. Gemini receives transcript text only when your key is connected. Lessons, preferences, completion history, and saved phrases stay in local storage and sync only after you sign in and choose a journal. Tutor memory remains in this tab unless you turn on account memory sync.</p></div></div>
      </section>

      <section className="settings-reset">
        <div><span className="eyebrow">START WITH A CLEAN PAGE</span><h2>{profile.isDemo ? "Replace the sample journal." : "Reset this learning journal."}</h2><p>{profile.isDemo ? "This removes the example progress and lets you set up your own 30-day path." : actions.accountSync.email ? "This clears saved preferences, completed lessons, and bookmarks from this device and its synced account." : "This clears saved preferences, completed lessons, and bookmarked phrases from this browser."}</p></div>
        {!confirmReset ? <Button className="btn-line" onClick={() => setConfirmReset(true)}><RotateCcw size={14} /> Reset local data</Button> :
          <div className="reset-confirm" role="alert"><p>Clear this journal from the current browser?</p><button className="text-link" onClick={() => setConfirmReset(false)}>Keep it</button><Button className="btn-danger" onClick={actions.resetDemo}>Clear local journal</Button></div>}
      </section>
      <div className="settings-footnote"><Languages size={16} /><span>Currently learning {language.name} · {language.script} script.</span><button onClick={() => actions.go("/dashboard")}>Return to Learn <ArrowRight size={14} /></button></div>
    </div>
  );
}
