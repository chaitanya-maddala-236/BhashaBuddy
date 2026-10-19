"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, HelpCircle, Mic2, RotateCcw, Send, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RouteActions } from "@/components/bhashabuddy/app";
import { getLanguage, getLessonPhrases, type LanguageCode, PHRASES } from "@/lib/bhashabuddy-data";
import { LanguageAvatar, type AvatarState } from "@/components/bhashabuddy/language-avatar";
import { playLanguageSpeech, stopSpeechPlayback } from "@/lib/speech-playback";
import { usePathname } from "next/navigation";
import {
  clearConversationMemory,
  getCloudMemorySyncEnabled,
  getConversationMemoryKey,
  getGeminiApiKey,
  MAX_MEMORY_MESSAGES,
  readConversationMemory,
  saveConversationMemory,
  type ConversationMessage,
} from "@/lib/gemini-session";

type Message = ConversationMessage;
type Recognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

const scenarios = [
  { slug: "bus-stop", number: "01", title: "Find the bus station", place: "Out on the street", time: "3—5 min", detail: "Ask for the station and understand one simple direction.", kind: "DIRECTIONS", tone: "sage" },
  { slug: "cafe", number: "02", title: "Order something small", place: "At a neighbourhood café", time: "3—5 min", detail: "Ask for a drink, listen for a follow-up, and answer politely.", kind: "FOOD & DRINK", tone: "clay" },
  { slug: "market", number: "03", title: "Ask about the price", place: "At a market stall", time: "3—5 min", detail: "Ask what something costs and respond to a simple answer.", kind: "SHOPPING", tone: "ink" },
  { slug: "campus", number: "04", title: "Meet a new classmate", place: "On campus", time: "3—5 min", detail: "Introduce yourself and ask a friendly question.", kind: "SOCIAL", tone: "sand" },
];

const openingPrompts: Record<LanguageCode, { line: string; transliteration: string; meaning: string }> = {
  te: { line: "మీరు ఎక్కడికి వెళ్లాలి?", transliteration: "Mīru ekkaḍiki veḷḷāli?", meaning: "Where do you need to go?" },
  hi: { line: "आपको कहाँ जाना है?", transliteration: "Aapko kahaan jaana hai?", meaning: "Where do you need to go?" },
  ta: { line: "நீங்கள் எங்கே செல்ல வேண்டும்?", transliteration: "Nīṅkaḷ eṅkē cella vēṇṭum?", meaning: "Where do you need to go?" },
  kn: { line: "ನೀವು ಎಲ್ಲಿಗೆ ಹೋಗಬೇಕು?", transliteration: "Nīvu ellige hōgabēku?", meaning: "Where do you need to go?" },
  ml: { line: "നിങ്ങൾ എവിടേക്കാണ് പോകേണ്ടത്?", transliteration: "Niṅṅaḷ eviṭekkāṇ pōkēṇṭat?", meaning: "Where do you need to go?" },
};

const replyLines: Record<LanguageCode, { line: string; transliteration: string; meaning: string }> = {
  te: { line: "సూటిగా వెళ్లి ఎడమవైపు తిరగండి.", transliteration: "Sūṭigā veḷḷi eḍamavaipu tiragaṇḍi.", meaning: "Go straight and turn left." },
  hi: { line: "सीधे जाइए और बाएँ मुड़िए।", transliteration: "Seedhe jaiye aur baayen mudiye.", meaning: "Go straight and turn left." },
  ta: { line: "நேராகச் சென்று இடப்பக்கம் திரும்புங்கள்.", transliteration: "Nērāka cenṟu iṭappakkam tirumpuṅkaḷ.", meaning: "Go straight and turn left." },
  kn: { line: "ನೇರವಾಗಿ ಹೋಗಿ ಎಡಕ್ಕೆ ತಿರುಗಿ.", transliteration: "Nēravāgi hōgi eḍakke tirugi.", meaning: "Go straight and turn left." },
  ml: { line: "നേരെ പോയി ഇടത്തോട്ട് തിരിയുക.", transliteration: "Nēre pōyi iṭattōṭṭ tiriyuka.", meaning: "Go straight and turn left." },
};

export function PracticePage({ actions }: { actions: RouteActions }) {
  const pathname = usePathname();
  const profile = actions.state.profile!;
  const slug = pathname.split("/")[2];
  const scenario = scenarios.find((item) => item.slug === slug);

  if (!scenario) return <ScenarioIndex actions={actions} />;
  return <ConversationWorkspace key={scenario.slug + ":" + profile.targetLanguage} actions={actions} scenario={scenario} />;
}

function ScenarioIndex({ actions }: { actions: RouteActions }) {
  const profile = actions.state.profile!;
  const language = getLanguage(profile.targetLanguage);
  return (
    <div className="practice-index">
      <div className="page-overline"><span>03 / SPEAKING STUDIO</span><span>{language.name.toUpperCase()} <i>·</i> YOUR PRACTICE SPACE</span></div>
      <header className="screen-heading screen-heading--practice">
        <div><span className="eyebrow">PRIVATE PRACTICE, YOUR WAY</span><h1>Let&apos;s have a<br /><em>short conversation.</em></h1></div>
        <p>Choose a familiar situation, then respond by voice or text. You can pause, ask for a hint, or try your phrase again.</p>
      </header>
      <div className="practice-intro-strip"><span className="practice-intro-strip__icon"><Mic2 size={20} /></span><div><strong>Start with the words you have.</strong><p>There is no timer. The tutor stays in the situation and keeps replies short.</p></div><span className="practice-intro-strip__note">AUDIO OPTIONAL</span></div>
      <div className="scenario-list">
        {scenarios.map((item) => <button className="scenario-row" key={item.slug} onClick={() => actions.go("/practice/" + item.slug)}>
          <span className={"scenario-row__number tone-" + item.tone}>{item.number}</span>
          <span className="scenario-row__copy"><small>{item.kind} <i>·</i> {item.place}</small><strong>{item.title}</strong><span>{item.detail}</span></span>
          <span className="scenario-row__time">{item.time}</span><ArrowRight size={18} className="scenario-row__arrow" />
        </button>)}
      </div>
      <div className="practice-fineprint"><span>VOICE CHAT · GEMINI OPTIONAL</span><p>Speak a reply and hear the tutor aloud. Add a Gemini key in Settings for live role-play and native-language speech; browser speech is used as a fallback.</p></div>
      <section className="practice-saved-phrase"><div><span className="eyebrow">WARM UP</span><h3>Already saved a phrase?</h3><p>Review it once before your next conversation.</p></div><Button className="btn-line" onClick={() => actions.go("/phrasebook")}>Open phrasebook <ArrowRight size={15} /></Button></section>
    </div>
  );
}

function ConversationWorkspace({
  actions,
  scenario,
}: {
  actions: RouteActions;
  scenario: (typeof scenarios)[number];
}) {
  const profile = actions.state.profile!;
  const language = getLanguage(profile.targetLanguage);
  const opening = openingPrompts[profile.targetLanguage];
  const reply = replyLines[profile.targetLanguage];
  const memoryKey = getConversationMemoryKey(profile.targetLanguage, scenario.slug);
  const initialMessage = useMemo<Message>(() => ({ role: "tutor", text: opening.line, meaning: opening.meaning, transliteration: opening.transliteration }), [opening]);
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [lastLearnerText, setLastLearnerText] = useState("");
  const [heardText, setHeardText] = useState("");
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [replyIsLiveGemini, setReplyIsLiveGemini] = useState(false);
  const [finished, setFinished] = useState(false);
  const [listening, setListening] = useState(false);
  const [tutorSpeaking, setTutorSpeaking] = useState(false);
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [voiceNotice, setVoiceNotice] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [turn, setTurn] = useState(1);
  const [showHint, setShowHint] = useState(false);
  const [sending, setSending] = useState(false);
  const [memoryLoaded, setMemoryLoaded] = useState(false);
  const [cloudMemoryEnabled, setCloudMemoryEnabled] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [tutorNotice, setTutorNotice] = useState("");
  const suppressCloudMemoryWriteRef = useRef(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const voiceControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Browser storage is read after hydration so the privacy note matches on server and client.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCloudMemoryEnabled(getCloudMemorySyncEnabled());
  }, []);

  const avatarState: AvatarState = listening ? "listening" : sending || voiceLoading ? "thinking" : tutorSpeaking ? "speaking" : "idle";

  async function speakTutorReply(text: string) {
    if (!voiceEnabled) return;
    voiceControllerRef.current?.abort();
    const controller = new AbortController();
    voiceControllerRef.current = controller;
    setVoiceNotice("");
    await playLanguageSpeech({
      text,
      language,
      apiKey: getGeminiApiKey(),
      signal: controller.signal,
      callbacks: {
        onLoading: () => setVoiceLoading(true),
        onStart: () => { setVoiceLoading(false); setTutorSpeaking(true); },
        onEnd: () => { setVoiceLoading(false); setTutorSpeaking(false); },
        onFallback: (reason) => {
          setVoiceLoading(false);
          setVoiceNotice(`Gemini voice unavailable: ${reason} Trying your browser voice.`);
        },
        onError: (reason) => {
          setVoiceLoading(false);
          setTutorSpeaking(false);
          setVoiceNotice(reason);
        },
      },
    });
    if (voiceControllerRef.current === controller) voiceControllerRef.current = null;
  }

  useEffect(() => {
    let active = true;
    async function restoreMemory() {
      const stored = readConversationMemory(memoryKey);
      let restored = stored?.length ? stored : [initialMessage];
      const syncMemory = getCloudMemorySyncEnabled();

      if (syncMemory) {
        const query = `language=${encodeURIComponent(profile.targetLanguage)}&scenario=${encodeURIComponent(scenario.slug)}`;
        try {
          const response = await fetch(`/api/account/memory?${query}`, { cache: "no-store" });
          if (response.ok) {
            const result = await response.json() as { messages?: ConversationMessage[] | null };
            if (result.messages?.length) restored = result.messages;
            else if (stored?.length) {
              await fetch("/api/account/memory", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language: profile.targetLanguage, scenario: scenario.slug, messages: stored }),
              });
            }
          }
        } catch {
          // Local tutor memory continues to work when the account service is offline.
        }
      }

      if (!active) return;
      const lastLearner = [...restored].reverse().find((message) => message.role === "learner");
      const lastTutor = [...restored].reverse().find((message) => message.role === "tutor");
      setMessages(restored);
      setTurn(restored.filter((message) => message.role === "learner").length + 1);
      setLastLearnerText(lastLearner?.text ?? "");
      setFeedbackText(lastTutor?.feedback ?? "");
      setFeedbackVisible(Boolean(lastTutor?.feedback));
      setReplyIsLiveGemini(lastTutor?.provider === "gemini");
      setHasGeminiKey(Boolean(getGeminiApiKey()));
      setMemoryLoaded(true);
    }
    void restoreMemory();
    return () => { active = false; };
  }, [initialMessage, memoryKey, profile.targetLanguage, scenario.slug]);

  useEffect(() => {
    if (!memoryLoaded) return;
    saveConversationMemory(memoryKey, messages);
    if (suppressCloudMemoryWriteRef.current) {
      suppressCloudMemoryWriteRef.current = false;
      return;
    }
    if (!getCloudMemorySyncEnabled()) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetch("/api/account/memory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: profile.targetLanguage, scenario: scenario.slug, messages }),
        signal: controller.signal,
      }).catch(() => {
        // Cloud sync is optional; the tab memory remains available.
      });
    }, 500);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [memoryKey, memoryLoaded, messages, profile.targetLanguage, scenario.slug]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    voiceControllerRef.current?.abort();
    stopSpeechPlayback();
  }, []);

  const samplePhrase = getLessonPhrases(profile.targetLanguage, 8)[0];
  const matchedPhrase = PHRASES[profile.targetLanguage].find((phrase) =>
    lastLearnerText && (
      lastLearnerText.trim().toLowerCase() === phrase.nativeText.trim().toLowerCase()
      || lastLearnerText.toLowerCase().includes(phrase.transliteration.toLowerCase())
    ),
  );

  function startListening() {
    setSpeechError("");
    voiceControllerRef.current?.abort();
    setVoiceLoading(false);
    stopSpeechPlayback();
    setTutorSpeaking(false);
    const SpeechRecognition = (window as RecognitionWindow).SpeechRecognition ?? (window as RecognitionWindow).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError("Speech recognition is not available in this browser. You can type your response below.");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language.locale;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => {
        setListening(true);
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript ?? "";
        setInput(transcript);
        setHeardText(transcript);
        setListening(false);
        if (transcript.trim()) void handleSendMessage(transcript);
      };
      recognition.onerror = (event) => {
        setListening(false);
        setSpeechError(event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone permission was denied. You can type your response instead."
          : event.error === "no-speech"
            ? "No speech was detected. Take a breath and try again, or type your response."
            : "I could not turn that into a transcript. Please try again or type your response.");
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setListening(false);
      setSpeechError("The microphone could not start. You can type your response instead.");
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function handleSendMessage(rawText: string) {
    const text = rawText.trim();
    if (!text || sending) return;
    setSending(true);
    setLastLearnerText(text);
    const learnerMessage: Message = { role: "learner", text };
    setMessages((previous) => [...previous, learnerMessage].slice(-MAX_MEMORY_MESSAGES));
    setInput("");
    setFeedbackVisible(false);
    setTutorNotice("");

    let tutorMessage: Message = {
      role: "tutor",
      text: reply.line,
      meaning: reply.meaning,
      transliteration: reply.transliteration,
      feedback: "Try this useful phrase: " + samplePhrase.nativeText,
      provider: "sample",
    };
    const apiKey = getGeminiApiKey();
    let usedGemini = false;

    if (apiKey) {
      try {
        const response = await fetch("/api/gemini/turn", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            targetLanguage: profile.targetLanguage,
            scenarioTitle: scenario.title,
            scenarioContext: scenario.detail,
            history: messages.slice(-MAX_MEMORY_MESSAGES).map(({ role, text: messageText }) => ({ role, text: messageText })),
            message: text,
          }),
        });
        const result = await response.json() as { reply?: string; meaning?: string; transliteration?: string; feedback?: string; error?: string };
        if (!response.ok || !result.reply || !result.meaning || !result.transliteration || !result.feedback) {
          throw new Error(result.error || "Gemini could not complete this turn.");
        }
        tutorMessage = { role: "tutor", text: result.reply, meaning: result.meaning, transliteration: result.transliteration, feedback: result.feedback, provider: "gemini" };
        usedGemini = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gemini could not reply right now.";
        setTutorNotice(`${message} The sample tutor replied so you can keep practising.`);
      }
    }

    setMessages((previous) => [...previous, tutorMessage].slice(-MAX_MEMORY_MESSAGES));
    setFeedbackText(tutorMessage.feedback ?? "Try one short phrase at a time.");
    setFeedbackVisible(true);
    setReplyIsLiveGemini(usedGemini);
    setTurn((previous) => previous + 1);
    setSending(false);
    speakTutorReply(tutorMessage.text);
    actions.recordPractice(2);
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void handleSendMessage(input);
  }

  function clearMemory() {
    clearConversationMemory(memoryKey);
    if (getCloudMemorySyncEnabled() && actions.accountSync.email) {
      const query = `language=${encodeURIComponent(profile.targetLanguage)}&scenario=${encodeURIComponent(scenario.slug)}`;
      void fetch(`/api/account/memory?${query}`, { method: "DELETE" }).catch(() => undefined);
      suppressCloudMemoryWriteRef.current = true;
    }
    voiceControllerRef.current?.abort();
    setVoiceLoading(false);
    stopSpeechPlayback();
    setMessages([initialMessage]);
    setInput("");
    setLastLearnerText("");
    setHeardText("");
    setFeedbackText("");
    setFeedbackVisible(false);
    setReplyIsLiveGemini(false);
    setTutorSpeaking(false);
    setTurn(1);
    setShowHint(false);
    setTutorNotice("");
  }

  function retryPhrase() {
    setInput(samplePhrase.nativeText);
    setFeedbackVisible(false);
    setHeardText("");
    setFinished(false);
  }

  function endPractice() {
    setFinished(true);
    setListening(false);
    setTutorSpeaking(false);
    setVoiceLoading(false);
    recognitionRef.current?.stop();
    voiceControllerRef.current?.abort();
    stopSpeechPlayback();
  }

  if (finished) {
    return <div className="practice-finish">
      <div className="finish-stamp"><Check size={28} /></div><span className="eyebrow">PRACTICE COMPLETE · {scenario.kind}</span>
      <h1>That was a real<br /><em>first try.</em></h1>
      <p>You showed up and made space for a conversation. Choose one phrase to revisit, then come back when you are ready.</p>
      <div className="finish-highlight"><span className="eyebrow">KEEP THIS PHRASE</span><strong lang={language.locale}>{samplePhrase.nativeText}</strong><span>{samplePhrase.meaning}</span></div>
      <div className="finish-actions"><Button className="btn-primary" onClick={retryPhrase}><RotateCcw size={15} /> Try this phrase again</Button><Button className="btn-line" onClick={() => actions.go("/practice")}>Choose another scene <ArrowRight size={15} /></Button></div>
    </div>;
  }

  return <div className="conversation-page">
    <div className="page-overline"><button className="back-link" onClick={() => actions.go("/practice")}><ArrowLeft size={14} /> ALL PRACTICE</button><span>ROLE-PLAY <i>·</i> {scenario.kind}</span></div>
    <div className="conversation-title">
      <div><span className="eyebrow">YOUR SCENE / {scenario.place.toUpperCase()}</span><h1>{scenario.title}.</h1><p>{scenario.detail}</p></div>
      <Button className="btn-line" onClick={endPractice}>End conversation <X size={14} /></Button>
    </div>
    <div className="conversation-layout">
      <main className="conversation-main">
        <div className="conversation-context"><span className="context-number">{scenario.number}</span><div><small>THE SETTING</small><p>{scenario.slug === "bus-stop" ? "You are on a busy street. A local guide has stopped to help." : scenario.detail}</p></div><span className="context-time">{scenario.time}</span></div>
        <section className={`voice-stage voice-stage--${avatarState}`} aria-label={`${language.name} voice chat`}>
          <div className="voice-stage__copy">
            <span className="voice-stage__eyebrow">YOUR SPEAKING PARTNER <i>·</i> {language.name.toUpperCase()}</span>
            <h2>{avatarState === "listening" ? "I'm listening." : avatarState === "thinking" ? "Let me think." : avatarState === "speaking" ? "A reply for you." : "Let's find the words."}</h2>
            <p>{avatarState === "listening" ? "Say a short phrase in " + language.name + "." : avatarState === "thinking" ? "Your conversation is taking shape." : avatarState === "speaking" ? "Listen once, then try the phrase yourself." : "Take your time. Start with one phrase, then build from there."}</p>
            <div className="voice-stage__status" role="status" aria-live="polite"><span />{!memoryLoaded ? "Restoring your conversation" : avatarState === "listening" ? "Listening to your voice" : avatarState === "thinking" ? "Preparing a response" : avatarState === "speaking" ? "Speaking the reply" : "Ready when you are"}</div>
          </div>
          <div className="voice-stage__controls">
            <button className={`voice-stage__mic${listening ? " is-listening" : ""}`} type="button" onClick={listening ? stopListening : startListening} aria-label={listening ? "Stop speaking" : "Start voice conversation"} aria-pressed={listening} disabled={sending || !memoryLoaded}>
              {listening ? <span className="mic-pulse"><i /></span> : <Mic2 size={24} />}
            </button>
            <span className="voice-stage__mic-label">{listening ? "Tap to finish" : "Tap to speak"}</span>
            <button className="voice-stage__voice" type="button" onClick={() => {
              if (voiceEnabled) {
                voiceControllerRef.current?.abort();
                voiceControllerRef.current = null;
                setVoiceLoading(false);
                stopSpeechPlayback();
                setTutorSpeaking(false);
                setVoiceNotice("");
              }
              setVoiceEnabled((value) => !value);
            }} aria-pressed={voiceEnabled}>
              {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}{voiceEnabled ? "Voice on" : "Voice off"}
            </button>
          </div>
          <div className="voice-stage__portrait">
            <LanguageAvatar language={language} state={avatarState} />
            <span>{language.name} <i>·</i> speaking partner</span>
          </div>
          {voiceNotice && <p className="voice-stage__notice" role="status">{voiceNotice}</p>}
        </section>
        <div className="transcript-card">
          <div className="transcript-header">
            <span>SESSION MEMORY <i>·</i> LAST {Math.min(MAX_MEMORY_MESSAGES / 2, messages.filter((message) => message.role === "learner").length)} EXCHANGES</span>
            <div className="transcript-header__tools"><span>TURN {String(turn).padStart(2, "0")}</span><button className="memory-clear" type="button" onClick={clearMemory} disabled={sending || !memoryLoaded} aria-label="Clear this conversation memory"><RotateCcw size={12} /> Clear memory</button></div>
          </div>
          <div className="transcript-messages" aria-live="polite">
            {messages.map((message, index) => <article className={"transcript-message" + (message.role === "learner" ? " transcript-message--learner" : "")} key={index}>
              <small>{message.role === "tutor" ? "TUTOR" : "YOU"}</small>
              {message.role === "tutor" ? <><p className="transcript-native" lang={language.locale}>{message.text}</p>{message.transliteration && <p className="transcript-transliteration">{message.transliteration}</p>}<p className="transcript-meaning">{message.meaning}</p></> : <p className="transcript-native" lang={language.locale}>{message.text}</p>}
              {message.role === "tutor" && <button className="transcript-replay" onClick={() => speakTutorReply(message.text)}><Volume2 size={14} /> Replay</button>}
            </article>)}
            {sending && <div className="transcript-thinking"><span /><span /><span /> Thinking through a reply…</div>}
          </div>
          {showHint && <div className="hint-strip"><HelpCircle size={15} /><div><small>A USEFUL PHRASE</small><strong lang={language.locale}>{samplePhrase.nativeText}</strong><span>{samplePhrase.transliteration} · {samplePhrase.meaning}</span></div><button onClick={() => setShowHint(false)} aria-label="Dismiss hint"><X size={14} /></button></div>}
          {feedbackVisible && <div className="tutor-feedback">
            <div className="feedback-section"><span className="feedback-icon">↗</span><div><small>LANGUAGE FEEDBACK · TEXT ONLY</small>
              <strong>{replyIsLiveGemini ? "A suggestion for this turn." : matchedPhrase ? "This matches a sample phrase." : "One phrase you can borrow."}</strong>
              <p>{feedbackText || (matchedPhrase ? matchedPhrase.meaning : "Try asking for the station with this question:")}</p>
              {!replyIsLiveGemini && !matchedPhrase && <b lang={language.locale}>{samplePhrase.nativeText}</b>}
            </div></div>
            <div className="feedback-section feedback-section--quiet"><span className="feedback-icon feedback-icon--quiet">≈</span><div><small>PRONUNCIATION</small><strong>Not scored from text.</strong><p>When Gemini is connected, only transcript text is sent. The tutor does not receive audio or score your pronunciation.</p></div></div>
            {heardText && <div className="heard-note"><span>WHAT I HEARD</span><p lang={language.locale}>{heardText}</p><span>You can edit the transcript before sending.</span></div>}
            <button className="retry-inline" onClick={retryPhrase}><RotateCcw size={14} /> Retry with a phrase from the lesson</button>
          </div>}
          <form className="composer" onSubmit={sendMessage}>
            <label className="sr-only" htmlFor="practice-response">Type a response in {language.name}</label>
            <textarea id="practice-response" rows={2} value={input} onChange={(event) => setInput(event.target.value)} placeholder={`Type a response in ${language.name}…`} />
            <div className="composer__actions"><span>{listening ? <><i className="listening-dot" /> Listening in {language.name}</> : "Transcript is editable before sending."}</span>
              {listening ? <Button type="button" className="btn-line btn-cancel" onClick={stopListening}><X size={14} /> Stop</Button> : <Button className="btn-primary" type="submit" disabled={!input.trim() || sending || !memoryLoaded}><Send size={14} /> Send response</Button>}
            </div>
          </form>
          {speechError && <p className="speech-error" role="status">{speechError}</p>}
          {tutorNotice && <p className="tutor-fallback-note" role="status">{tutorNotice}</p>}
        </div>
        <div className="transcript-privacy"><span>{cloudMemoryEnabled && actions.accountSync.email ? "ACCOUNT MEMORY · OPTED IN" : cloudMemoryEnabled ? "TAB MEMORY · ACCOUNT SIGN-IN REQUIRED" : "TAB-ONLY MEMORY"}</span><p>{cloudMemoryEnabled && actions.accountSync.email ? "Recent conversation text is saved to your account so this scene can continue across devices. Choose Clear memory to remove this scene’s saved transcript. No audio is sent." : cloudMemoryEnabled ? "This device’s tab memory is active. Sign in to sync or remove any tutor memory already saved to your account." : "Recent conversation text is kept in this tab and cleared when you close it or choose Clear memory. When connected, only the last six exchanges are sent to Gemini for context; no audio is sent."}</p></div>
      </main>
      <aside className="conversation-aside">
        <div className="aside-card"><span className="eyebrow">A SMALL HINT</span><h3>Need a word?</h3><p>Ask for a hint at any point. It will not end the conversation.</p><button className="text-link" onClick={() => setShowHint((value) => !value)}><HelpCircle size={14} /> {showHint ? "Hide the hint" : "Show me a phrase"}</button></div>
        <div className="aside-card aside-card--sage"><span className="eyebrow">YOUR ROLE</span><h3>A learner, not a performer.</h3><p>Try one part of the sentence. You can use transliteration, type a response, or start over.</p></div>
        <div className="aside-disclaimer"><span>{hasGeminiKey ? "GEMINI ROLE-PLAY" : "SAMPLE ROLE-PLAY"}</span><p>{hasGeminiKey ? "Your connected tutor uses recent transcript turns for context. Replies may vary by regional language." : "Sample replies work offline. Connect your Gemini key in Settings for live role-play."}</p>{!hasGeminiKey && <button className="text-link" onClick={() => actions.go("/settings")}>Connect Gemini <ArrowRight size={13} /></button>}</div>
      </aside>
    </div>
  </div>;
}
