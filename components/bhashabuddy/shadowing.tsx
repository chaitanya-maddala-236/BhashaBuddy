"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, LoaderCircle, Mic2, RotateCcw, Volume2, X } from "lucide-react";
import type { RouteActions } from "@/components/bhashabuddy/app";
import { Button } from "@/components/ui/button";
import { getGeminiApiKey } from "@/lib/gemini-session";
import { getLanguage } from "@/lib/bhashabuddy-data";
import { getShadowingItems, type ShadowingMode } from "@/lib/shadowing-data";
import { playLanguageSpeech, stopSpeechPlayback } from "@/lib/speech-playback";

type CheckResult = {
  heardText: string;
  match: "close" | "nearly" | "practice" | "unclear";
  feedback: string;
  tip: string;
};
type RecordingMime = "audio/webm" | "audio/mp4" | "audio/ogg" | "audio/wav";

const resultLabels: Record<CheckResult["match"], string> = {
  close: "Sounds close",
  nearly: "Nearly there",
  practice: "Keep practising",
  unclear: "Try one more time",
};

export function ShadowingPractice({ actions }: { actions: RouteActions }) {
  const profile = actions.state.profile!;
  const language = getLanguage(profile.targetLanguage);
  const [mode, setMode] = useState<ShadowingMode>("sentence");
  const [selectedId, setSelectedId] = useState("");
  const [apiKeyAvailable, setApiKeyAvailable] = useState(false);
  const [recording, setRecording] = useState(false);
  const [checking, setChecking] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioMimeType, setAudioMimeType] = useState<RecordingMime>("audio/webm");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");
  const [voiceNotice, setVoiceNotice] = useState("");
  const [countedPractice, setCountedPractice] = useState(false);
  const items = useMemo(() => getShadowingItems(profile.targetLanguage, mode), [mode, profile.targetLanguage]);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<number | null>(null);
  const audioUrlRef = useRef("");

  useEffect(() => {
    // The learner's Gemini key is per tab and is read after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKeyAvailable(Boolean(getGeminiApiKey()));
  }, []);

  useEffect(() => () => {
    if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    stopSpeechPlayback();
  }, []);

  function clearRecording() {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = "";
    setRecordedAudio(null);
    setAudioUrl("");
    setResult(null);
  }

  function selectMode(nextMode: ShadowingMode) {
    setMode(nextMode);
    setSelectedId("");
    clearRecording();
    setError("");
  }

  function selectItem(id: string) {
    setSelectedId(id);
    clearRecording();
    setError("");
  }

  async function playReference(text: string) {
    setVoiceNotice("");
    await playLanguageSpeech({
      text,
      language,
      apiKey: getGeminiApiKey(),
      callbacks: {
        onFallback: () => setVoiceNotice("Gemini voice is unavailable, so this is using your browser's speech voice."),
        onError: setVoiceNotice,
      },
    });
  }

  async function startRecording() {
    setError("");
    setVoiceNotice("");
    clearRecording();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Audio recording is unavailable in this browser. Try a recent version of Chrome, Edge, or Safari.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const preferredType = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = preferredType ? new MediaRecorder(stream, { mimeType: preferredType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => setError("The recording stopped unexpectedly. Please try again.");
      recorder.onstop = () => {
        if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const mimeType = (recorder.mimeType.split(";")[0].toLowerCase() || "audio/webm") as RecordingMime;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || mimeType });
        setRecording(false);
        if (!blob.size) {
          setError("No sound was captured. Check your microphone and try again.");
        } else if (blob.size > 2_000_000) {
          setError("That recording is too large. Try a shorter take.");
        } else if (!["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"].includes(mimeType)) {
          setError("This browser created an audio format the coach cannot review. Try Chrome, Edge, or Safari.");
        } else {
          setAudioMimeType(mimeType);
          setRecordedAudio(blob);
          const nextUrl = URL.createObjectURL(blob);
          audioUrlRef.current = nextUrl;
          setAudioUrl(nextUrl);
        }
      };
      recorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
      stopTimerRef.current = window.setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, 15_000);
    } catch (caught) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setError(caught instanceof Error && caught.name === "NotAllowedError"
        ? "Microphone access is blocked. Allow microphone access in your browser, then try again."
        : "The microphone could not start. Check your device settings and try again.");
    }
  }

  function stopRecording() {
    if (stopTimerRef.current !== null) window.clearTimeout(stopTimerRef.current);
    stopTimerRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  async function checkRecording() {
    if (!selected || !recordedAudio || checking) return;
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      setApiKeyAvailable(false);
      setError("Connect your Gemini key in Settings to get an AI listening note.");
      return;
    }
    setChecking(true);
    setError("");
    setResult(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("The recording could not be read."));
        reader.onerror = () => reject(new Error("The recording could not be read."));
        reader.readAsDataURL(recordedAudio);
      });
      const comma = dataUrl.indexOf(",");
      if (comma < 0) throw new Error("The recording could not be prepared. Please record it again.");
      const response = await fetch("/api/gemini/shadowing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          targetLanguage: profile.targetLanguage,
          mode,
          itemId: selected.id,
          audioMimeType,
          audioData: dataUrl.slice(comma + 1),
        }),
      });
      const responseData = await response.json() as CheckResult & { error?: string };
      if (!response.ok || !responseData.feedback || !responseData.tip) throw new Error(responseData.error || "Gemini could not review that recording.");
      setResult(responseData);
      if (!countedPractice) {
        actions.recordPractice(2);
        setCountedPractice(true);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Gemini could not review that recording. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  if (!selected) return null;

  return <div className="shadowing-page">
    <div className="page-overline"><button className="back-link" type="button" onClick={() => actions.go("/practice")}><ArrowLeft size={14} /> ALL PRACTICE</button><span>SHADOWING <i>·</i> {language.name.toUpperCase()}</span></div>
    <header className="screen-heading shadowing-heading">
      <div><span className="eyebrow">LISTEN · REPEAT · REFINE</span><h1>Let the phrase<br /><em>find its rhythm.</em></h1></div>
      <p>Shadow a sentence or a short everyday dialogue. Listen first, say it aloud, then ask Gemini for an approximate note on what it heard.</p>
    </header>

    <div className="shadowing-layout">
      <aside className="shadowing-index">
        <div className="shadowing-mode" role="group" aria-label="Shadowing material">
          <button type="button" className={mode === "sentence" ? "is-active" : ""} onClick={() => selectMode("sentence")} aria-pressed={mode === "sentence"}>Sentences</button>
          <button type="button" className={mode === "dialogue" ? "is-active" : ""} onClick={() => selectMode("dialogue")} aria-pressed={mode === "dialogue"}>Common dialogues</button>
        </div>
        <div className="shadowing-index__label"><span>{mode === "sentence" ? "PRACTICE LINES" : "SHORT EXCHANGES"}</span><span>{String(items.length).padStart(2, "0")}</span></div>
        <div className="shadowing-index__list">
          {items.map((item, index) => <button type="button" key={item.id} className={`shadowing-index__row${selected.id === item.id ? " is-selected" : ""}`} onClick={() => selectItem(item.id)} aria-current={selected.id === item.id ? "true" : undefined}>
            <span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><ArrowRight size={14} />
          </button>)}
        </div>
        <p className="shadowing-index__note">These sample lines are practice material. Regional wording and pronunciation can vary.</p>
      </aside>

      <main className="shadowing-workspace">
        <div className="shadowing-workspace__meta"><span>{mode === "sentence" ? "ONE SENTENCE" : "A SHORT DIALOGUE"}</span><span>{language.nativeName}</span></div>
        <h2>{selected.title}</h2>
        <p className="shadowing-workspace__instruction">Listen to each line once. Then shadow the full {mode === "sentence" ? "sentence" : "exchange"} in order.</p>
        <div className="shadowing-lines">
          {selected.lines.map((line, index) => <article className="shadowing-line" key={line.id + index}>
            <div className="shadowing-line__meta"><span>LINE {String(index + 1).padStart(2, "0")}</span>{line.speaker && <span>{line.speaker}</span>}</div>
            <p lang={language.locale}>{line.nativeText}</p>
            <small>{line.transliteration}</small>
            <div className="shadowing-line__bottom"><span>{line.meaning}</span><button type="button" onClick={() => void playReference(line.nativeText)} aria-label={`Hear ${line.meaning} in ${language.name}`}><Volume2 size={14} /> Hear line</button></div>
          </article>)}
        </div>
        {voiceNotice && <p className="shadowing-notice" role="status">{voiceNotice}</p>}

        <section className={`shadowing-recorder${recording ? " is-recording" : ""}`} aria-label="Record your shadowing practice">
          <div className="shadowing-recorder__intro"><span className="eyebrow">YOUR TURN</span><h3>{recording ? "I'm listening." : recordedAudio ? "Take recorded." : "Say it in your own voice."}</h3><p>{recording ? "Speak at a comfortable pace. Recording stops after 15 seconds." : recordedAudio ? "Play it back, then ask Gemini to listen when you're ready." : "Your recording stays here until you leave or choose another line."}</p></div>
          <button type="button" className="shadowing-recorder__button" onClick={recording ? stopRecording : startRecording} aria-label={recording ? "Stop recording" : "Start recording"} aria-pressed={recording} disabled={checking}>
            {recording ? <X size={24} /> : <Mic2 size={24} />}
          </button>
          <span className="shadowing-recorder__label">{recording ? "Stop recording" : recordedAudio ? "Record again" : "Start recording"}</span>
          {audioUrl && <audio className="shadowing-recorder__playback" controls src={audioUrl} aria-label="Play your shadowing recording" />}
          {recordedAudio && <button type="button" className="shadowing-recorder__clear" onClick={() => { clearRecording(); setError(""); }}><RotateCcw size={13} /> Clear recording</button>}
        </section>

        {apiKeyAvailable ? <Button className="btn-primary shadowing-check" onClick={() => void checkRecording()} disabled={!recordedAudio || checking || recording}>
          {checking ? <><LoaderCircle size={15} className="spin-icon" /> Listening to your take…</> : <><Check size={15} /> Ask Gemini to listen</>}
        </Button> : <button className="shadowing-connect" type="button" onClick={() => actions.go("/settings")}>Connect Gemini in Settings to get listening feedback <ArrowRight size={14} /></button>}

        {error && <p className="shadowing-error" role="alert">{error}</p>}
        {result && <section className={`shadowing-result shadowing-result--${result.match}`} aria-live="polite" aria-labelledby="shadowing-result-title">
          <div className="shadowing-result__head"><span className="eyebrow">APPROXIMATE AI LISTENING NOTE</span><strong id="shadowing-result-title">{resultLabels[result.match]}</strong></div>
          {result.heardText && <div className="shadowing-result__heard"><small>WHAT GEMINI HEARD</small><p lang={language.locale}>{result.heardText}</p></div>}
          <p>{result.feedback}</p><div className="shadowing-result__tip"><span>ONE THING TO TRY</span><p>{result.tip}</p></div>
        </section>}
        <p className="shadowing-privacy">When you ask Gemini to listen, this short recording is sent with the selected reference for feedback. It is not saved in BhashaBuddy. The note is approximate and is not a formal pronunciation score.</p>
      </main>
    </div>
  </div>;
}
