"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Bookmark, LoaderCircle, MessageCircle, Send, Sparkles } from "lucide-react";
import type { AppState } from "@/lib/demo-store";
import { getGeminiApiKey } from "@/lib/gemini-session";
import { getLanguage, type Phrase } from "@/lib/bhashabuddy-data";

type CoachScene = { slug: string; title: string; place: string; detail: string };
type CoachMessage = {
  role: "learner" | "assistant";
  text: string;
  scenario?: CoachScene | null;
  phrases?: Phrase[];
};

export function LearningCoach({
  state,
  currentScenario,
  practiceTranscript,
  onNavigate,
  onStartScenario,
  onSavePhrase,
  compact = false,
}: {
  state: AppState;
  currentScenario?: string;
  practiceTranscript?: Array<{ role: "tutor" | "learner"; text: string }>;
  onNavigate: (path: string) => void;
  onStartScenario: (slug: string) => void;
  onSavePhrase: (phraseId: string) => void;
  compact?: boolean;
}) {
  const profile = state.profile!;
  const language = getLanguage(profile.targetLanguage);
  const [apiKeyAvailable, setApiKeyAvailable] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // The API key is stored per tab and read after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKeyAvailable(Boolean(getGeminiApiKey()));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, loading]);

  async function askCoach(rawPrompt: string) {
    const message = rawPrompt.trim();
    const apiKey = getGeminiApiKey();
    if (!message || loading) return;
    if (!apiKey) {
      setApiKeyAvailable(false);
      setError("Connect your Gemini key in Settings to start an AI coach session.");
      return;
    }

    setError("");
    setPrompt("");
    setLoading(true);
    const history = messages.slice(-8).map((item) => ({ role: item.role, text: item.text }));
    setMessages((previous) => [...previous, { role: "learner", text: message }]);

    try {
      const response = await fetch("/api/gemini/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          targetLanguage: profile.targetLanguage,
          learner: {
            completedDays: state.completedDays,
            savedPhraseIds: state.savedPhraseIds,
            practiceDays: state.practiceDates.length,
            recentPractice: state.recentPractice,
            goal: profile.goal,
            level: profile.level,
            minutesPerDay: profile.minutesPerDay,
          },
          currentScenario,
          practiceTranscript: practiceTranscript?.slice(-12),
          history,
          message,
        }),
      });
      const result = await response.json() as { reply?: string; scenario?: CoachScene | null; phrases?: Phrase[]; error?: string };
      if (!response.ok || !result.reply) throw new Error(result.error || "The coach could not reply just now.");
      setMessages((previous) => [...previous, {
        role: "assistant",
        text: result.reply!,
        scenario: result.scenario,
        phrases: result.phrases?.slice(0, 3) ?? [],
      }]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The coach could not reply just now.");
    } finally {
      setLoading(false);
    }
  }

  function submitPrompt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askCoach(prompt);
  }

  return (
    <section className={`learning-coach${compact ? " learning-coach--compact" : ""}`} aria-labelledby={compact ? "coach-title-compact" : "coach-title"}>
      <div className="learning-coach__topline">
        <span className="learning-coach__mark"><Sparkles size={17} /></span>
        <span className="eyebrow">YOUR AI LEARNING COACH</span>
        <span className="learning-coach__language">{language.name}</span>
      </div>
      <div className="learning-coach__intro">
        <h2 id={compact ? "coach-title-compact" : "coach-title"}>{compact ? "A coach in your corner." : "A next step, shaped around you."}</h2>
        <p>{compact ? "Ask about this scene, find a phrase, or choose what to practise next." : `Your next lesson is ready. Ask for a phrase or a short ${language.name} practice idea.`}</p>
      </div>

      {messages.length === 0 && (
        <div className="learning-coach__suggestions" aria-label="Suggested coach questions">
          <button type="button" onClick={() => void askCoach(practiceTranscript?.length ? "Review my recent speaking practice and give me one encouraging, specific thing to try next." : "What should I practise next based on my progress?")} disabled={!apiKeyAvailable || loading}>
            <MessageCircle size={14} /> {practiceTranscript?.length ? "Recap this practice" : "What should I practise next?"}
          </button>
          <button type="button" onClick={() => void askCoach(practiceTranscript?.length ? "Find a real phrase from the phrasebook that I should revisit after this session." : currentScenario ? `Help me with the ${currentScenario} scene.` : "Find me a useful phrase for everyday conversation.")} disabled={!apiKeyAvailable || loading}>
            <Bookmark size={14} /> {practiceTranscript?.length ? "Find a phrase to revisit" : currentScenario ? "Help with this scene" : "Find a useful phrase"}
          </button>
        </div>
      )}

      {messages.length > 0 && (
        <div className="learning-coach__transcript" aria-live="polite" aria-label="Coach conversation">
          {messages.map((item, index) => (
            <article className={`learning-coach__message learning-coach__message--${item.role}`} key={`${item.role}-${index}`}>
              <small>{item.role === "learner" ? "YOU" : "COACH"}</small>
              <p>{item.text}</p>
              {item.scenario && <div className="learning-coach__action">
                <span className="eyebrow">A SCENE TO TRY</span>
                <strong>{item.scenario.title}</strong>
                <small>{item.scenario.place} · {item.scenario.detail}</small>
                <button type="button" onClick={() => onStartScenario(item.scenario!.slug)}>Start this practice <ArrowRight size={14} /></button>
              </div>}
              {item.phrases?.map((phrase) => {
                const saved = state.savedPhraseIds.includes(phrase.id);
                return <div className="learning-coach__phrase" key={phrase.id}>
                  <span lang={language.locale}>{phrase.nativeText}</span>
                  <small>{phrase.transliteration} · {phrase.meaning}</small>
                  <button type="button" onClick={() => onSavePhrase(phrase.id)} disabled={saved}>
                    <Bookmark size={13} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved to phrasebook" : "Save this phrase"}
                  </button>
                </div>;
              })}
            </article>
          ))}
          {loading && <div className="learning-coach__loading" role="status"><LoaderCircle size={14} className="spin-icon" /> Looking through your learning notes…</div>}
          <div ref={bottomRef} />
        </div>
      )}

      {error && <p className="learning-coach__error" role="alert">{error}</p>}
      {apiKeyAvailable ? <form className="learning-coach__form" onSubmit={submitPrompt}>
        <label className="sr-only" htmlFor={compact ? "coach-question-compact" : "coach-question"}>Ask your learning coach</label>
        <input id={compact ? "coach-question-compact" : "coach-question"} value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={600} placeholder="Ask your coach…" disabled={loading} />
        <button type="submit" aria-label="Send question to coach" disabled={!prompt.trim() || loading}><Send size={15} /></button>
      </form> : <button className="learning-coach__connect" type="button" onClick={() => onNavigate("/settings")}>
        Connect Gemini in Settings <ArrowRight size={14} />
      </button>}
      <p className="learning-coach__privacy">Coach chat is not saved. When a practice transcript is included, Gemini receives its recent text turns only. Saving a phrase is always your choice.</p>
    </section>
  );
}
