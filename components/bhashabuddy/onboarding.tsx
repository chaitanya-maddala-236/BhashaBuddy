"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RouteActions } from "@/components/bhashabuddy/app";
import { getLanguage, PHRASES, type LanguageCode } from "@/lib/bhashabuddy-data";
import { EMPTY_STATE, type Profile } from "@/lib/demo-store";
import { LanguagePicker } from "@/components/bhashabuddy/language-picker";

const levels = [
  { id: "beginner", title: "Brand new", note: "Start with greetings and the basics." },
  { id: "some-words", title: "Know a few words", note: "I can recognise some phrases already." },
  { id: "understand", title: "I understand, but pause when speaking", note: "Help me find the words faster." },
] as const;

const goals = [
  { id: "college", title: "College", note: "Classmates, campus, and everyday errands." },
  { id: "work", title: "Work", note: "Colleagues, requests, and shared plans." },
  { id: "travel", title: "Travel", note: "Food, transport, and finding your way." },
  { id: "everyday", title: "Everyday life", note: "A little of whatever the day brings." },
  { id: "family", title: "Family & friends", note: "Warm conversations with people close to you." },
] as const;

type FormState = {
  preferredLanguage: "English" | "Hindi";
  targetLanguage: LanguageCode;
  level: "beginner" | "some-words" | "understand";
  goal: "college" | "work" | "travel" | "everyday" | "family";
  minutes: 5 | 10 | 15 | 20;
  scriptPreference: "transliteration" | "native-first" | "both";
};

const stepNames = ["Languages", "Starting point", "Optional check", "Your goal", "Daily rhythm", "Script support"];

export function Onboarding({ actions }: { actions: RouteActions }) {
  const [step, setStep] = useState(0);
  const [baselineAnswer, setBaselineAnswer] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    preferredLanguage: "English",
    targetLanguage: "te",
    level: "beginner",
    goal: "everyday",
    minutes: 10,
    scriptPreference: "both",
  });
  const language = getLanguage(form.targetLanguage);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  function finish() {
    const profile: Profile = {
      name: "you",
      preferredLanguage: form.preferredLanguage,
      targetLanguage: form.targetLanguage,
      level: form.level,
      goal: form.goal,
      minutesPerDay: form.minutes,
      scriptPreference: form.scriptPreference,
      isDemo: false,
    };
    actions.setState({ ...EMPTY_STATE, profile });
    actions.go("/dashboard");
  }

  return (
    <div className="onboarding-page">
      <header className="onboarding-header">
        <button className="wordmark" onClick={() => actions.go("/")}><span className="brand-mark">b.</span><span className="wordmark-name">bhasha<span>buddy</span></span></button>
        <div className="onboarding-header__label">A PATH THAT FITS YOUR DAY</div>
        <button className="text-link" onClick={actions.startDemo}>Explore a sample journal <ArrowRight size={14} /></button>
      </header>
      <main className="onboarding-main">
        <div className="onboarding-progress">
          <span>STEP {String(step + 1).padStart(2, "0")} / 06</span>
          <div aria-label={"Step " + (step + 1) + " of 6"}>{stepNames.map((name, index) => <span key={name} className={index <= step ? "is-current" : ""} />)}</div>
          <span>{stepNames[step].toUpperCase()}</span>
        </div>

        {step === 0 && <section className="onboarding-step">
          <span className="eyebrow">FIRST, A LANGUAGE</span><h1>Where are you<br /><em>starting from?</em></h1><p>Choose the language you want to learn and the one you prefer for explanations.</p>
          <div className="onboarding-language-selection">
            <span className="language-selection-label">CHOOSE YOUR LANGUAGE</span>
            <LanguagePicker value={form.targetLanguage} onChange={(value) => update("targetLanguage", value)} />
          </div>
          <div className="onboarding-selects">
            <label className="onboarding-select"><span>LANGUAGE I KNOW BEST</span><select value={form.preferredLanguage} onChange={(event) => update("preferredLanguage", event.target.value as "English" | "Hindi")}><option>English</option><option>Hindi</option></select><small>Demo explanations currently appear in English.</small></label>
          </div>
        </section>}

        {step === 1 && <section className="onboarding-step">
          <span className="eyebrow">YOUR STARTING POINT</span><h1>What feels<br /><em>familiar so far?</em></h1><p>No placement test needed. This helps shape the pace of your practice.</p>
          <div className="onboarding-option-list">
            {levels.map((level) => <button key={level.id} className={"onboarding-option" + (form.level === level.id ? " is-selected" : "")} onClick={() => update("level", level.id)}>
              <span className="option-radio">{form.level === level.id && <i />}</span><span><strong>{level.title}</strong><small>{level.note}</small></span>{form.level === level.id && <Check size={16} />}
            </button>)}
          </div>
        </section>}

        {step === 2 && <section className="onboarding-step">
          <span className="eyebrow">A QUICK STARTING CHECK</span><h1>A small first<br /><em>read of the room.</em></h1><p>This optional question helps you notice what you already recognise. It is only a starting estimate, not a proficiency assessment.</p>
          <div className="baseline-check">
            <span className="baseline-check__label">WHICH MEANING FITS THIS GREETING?</span>
            <strong lang={language.locale}>{PHRASES[form.targetLanguage][0].nativeText}</strong>
            <span>{PHRASES[form.targetLanguage][0].transliteration}</span>
            <div>{["Hello", "How much is this?", "Where is the bus station?"].map((answer) => <button key={answer} className={(baselineAnswer === answer ? answer === "Hello" ? "is-correct" : "is-wrong" : "")} onClick={() => setBaselineAnswer(answer)}>{answer}</button>)}</div>
            {baselineAnswer && <p className="baseline-feedback">{baselineAnswer === "Hello" ? "Yes — you already recognise a useful greeting." : "A greeting is a way to say hello. No score is saved from this check."}</p>}
          </div>
          <button className="skip-check" onClick={() => setStep(step + 1)}>Skip the check for now <ArrowRight size={14} /></button>
        </section>}

        {step === 3 && <section className="onboarding-step">
          <span className="eyebrow">A CONVERSATION THAT MATTERS</span><h1>Where would you<br /><em>like to begin?</em></h1><p>Your daily scenarios will reflect the places and people that are part of your life.</p>
          <div className="onboarding-goals">
            {goals.map((goal, index) => <button key={goal.id} className={"goal-card" + (form.goal === goal.id ? " is-selected" : "")} onClick={() => update("goal", goal.id)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{goal.title}</strong><small>{goal.note}</small>{form.goal === goal.id && <Check size={16} />}</button>)}
          </div>
        </section>}

        {step === 4 && <section className="onboarding-step">
          <span className="eyebrow">MAKE IT REPEATABLE</span><h1>How much time<br /><em>feels right?</em></h1><p>We recommend 10 minutes a day. Choose a pace that still feels doable on a busy day.</p>
          <div className="daily-time-options">
            {[5, 10, 15, 20].map((minutes) => <button key={minutes} className={form.minutes === minutes ? "is-selected" : ""} onClick={() => update("minutes", minutes as FormState["minutes"])}><strong>{minutes}</strong><span>minutes / day</span>{form.minutes === minutes && <Check size={15} />}</button>)}
          </div>
          <div className="commitment-note"><span>↳</span><p>A lesson can be paused and resumed. Your practice does not have to happen all at once.</p></div>
        </section>}

        {step === 5 && <section className="onboarding-step">
          <span className="eyebrow">MAKE THE SCRIPT COMFORTABLE</span><h1>Choose how you<br /><em>like to read.</em></h1><p>Transliteration is available from the first phrase. Change this preference later in Settings.</p>
          <div className="script-options">
            <button className={form.scriptPreference === "both" ? "is-selected" : ""} onClick={() => update("scriptPreference", "both")}><span className="script-sample">{language.nativeName.slice(0, 1)}<small>ab</small></span><strong>Both together</strong><small>Native script and transliteration</small>{form.scriptPreference === "both" && <Check size={15} />}</button>
            <button className={form.scriptPreference === "transliteration" ? "is-selected" : ""} onClick={() => update("scriptPreference", "transliteration")}><span className="script-sample script-sample--roman">ab</span><strong>Transliteration first</strong><small>Start with familiar letters</small>{form.scriptPreference === "transliteration" && <Check size={15} />}</button>
            <button className={form.scriptPreference === "native-first" ? "is-selected" : ""} onClick={() => update("scriptPreference", "native-first")}><span className="script-sample">{language.nativeName.slice(0, 1)}</span><strong>Native script first</strong><small>Keep the original writing in view</small>{form.scriptPreference === "native-first" && <Check size={15} />}</button>
          </div>
          <div className="onboarding-summary"><span>YOUR FIRST PATH</span><strong>{language.name} · {form.minutes} minutes a day</strong><small>{goals.find((goal) => goal.id === form.goal)?.title} · Start with Day 01</small></div>
        </section>}

        <div className="onboarding-actions">
          <Button className="btn-line" onClick={() => step === 0 ? actions.go("/") : setStep(step - 1)}><ArrowLeft size={15} /> {step === 0 ? "Back to welcome" : "Back"}</Button>
          <Button className="btn-primary" onClick={step === 5 ? finish : () => setStep(step + 1)}>{step === 5 ? "Start with Day 01" : "Continue"} <ArrowRight size={15} /></Button>
        </div>
        <div className="onboarding-privacy">YOUR CHOICES ARE STORED IN THIS BROWSER <span>·</span> CHANGE THEM ANYTIME</div>
      </main>
    </div>
  );
}
