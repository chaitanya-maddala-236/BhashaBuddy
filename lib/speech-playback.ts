"use client";

import type { Language } from "@/lib/bhashabuddy-data";

export type SpeechCallbacks = {
  onLoading?: () => void;
  onStart?: () => void;
  onEnd?: () => void;
  onFallback?: (reason: string) => void;
  onError?: (reason: string) => void;
};

let activeAudio: HTMLAudioElement | null = null;
let activeAudioUrl = "";
let activeRequest: AbortController | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function stopSpeechPlayback() {
  activeRequest?.abort();
  activeRequest = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    if (activeUtterance) {
      activeUtterance.onstart = null;
      activeUtterance.onend = null;
      activeUtterance.onerror = null;
      activeUtterance = null;
    }
    window.speechSynthesis.cancel();
  }
  if (activeAudio) {
    activeAudio.onplay = null;
    activeAudio.onended = null;
    activeAudio.onerror = null;
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
  if (activeAudioUrl) {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = "";
  }
}

async function getBrowserVoice(locale: string) {
  const synthesis = window.speechSynthesis;
  let voices = synthesis.getVoices();
  if (!voices.length) {
    await new Promise<void>((resolve) => {
      const timeout = window.setTimeout(resolve, 700);
      synthesis.addEventListener("voiceschanged", () => {
        window.clearTimeout(timeout);
        resolve();
      }, { once: true });
    });
    voices = synthesis.getVoices();
  }
  const prefix = locale.split("-")[0].toLowerCase();
  return voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(prefix));
}

async function playBrowserSpeech(text: string, language: Language, callbacks: SpeechCallbacks) {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") {
    callbacks.onError?.("Speech playback is unavailable here. Connect a Gemini key or try another browser.");
    return;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance;
    utterance.lang = language.locale;
    const voice = await getBrowserVoice(language.locale);
    if (activeUtterance !== utterance) return;
    if (voice) utterance.voice = voice;
    utterance.onstart = () => callbacks.onStart?.();
    utterance.onend = () => {
      if (activeUtterance === utterance) activeUtterance = null;
      callbacks.onEnd?.();
    };
    utterance.onerror = () => {
      if (activeUtterance === utterance) activeUtterance = null;
      callbacks.onError?.("Your browser could not play its speech voice. Connect a Gemini key or check device audio settings.");
    };
    window.speechSynthesis.speak(utterance);
  } catch {
    callbacks.onError?.("Your browser could not start speech playback.");
  }
}

export async function playLanguageSpeech({
  text,
  language,
  apiKey,
  callbacks = {},
  signal,
}: {
  text: string;
  language: Language;
  apiKey?: string;
  callbacks?: SpeechCallbacks;
  signal?: AbortSignal;
}) {
  stopSpeechPlayback();

  if (apiKey) {
    const controller = new AbortController();
    activeRequest = controller;
    const abortRequest = () => controller.abort();
    signal?.addEventListener("abort", abortRequest, { once: true });
    callbacks.onLoading?.();

    try {
      const response = await fetch("/api/gemini/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, targetLanguage: language.code, text }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || "Gemini speech audio is unavailable.");
      }

      const audioUrl = URL.createObjectURL(await response.blob());
      activeAudioUrl = audioUrl;
      const audio = new Audio(audioUrl);
      activeAudio = audio;
      audio.onplay = () => callbacks.onStart?.();
      audio.onended = () => {
        if (activeAudio === audio) {
          activeAudio = null;
          URL.revokeObjectURL(audioUrl);
          activeAudioUrl = "";
        }
        callbacks.onEnd?.();
      };
      audio.onerror = () => {
        if (activeAudio === audio) {
          activeAudio = null;
          URL.revokeObjectURL(audioUrl);
          activeAudioUrl = "";
          callbacks.onFallback?.("Gemini audio could not be played by this browser.");
          void playBrowserSpeech(text, language, callbacks);
        }
      };
      await audio.play();
      activeRequest = null;
      signal?.removeEventListener("abort", abortRequest);
      return;
    } catch (error) {
      signal?.removeEventListener("abort", abortRequest);
      if (controller.signal.aborted) return;
      if (activeRequest === controller) activeRequest = null;
      if (activeAudio) {
        activeAudio.onplay = null;
        activeAudio.onended = null;
        activeAudio.onerror = null;
        activeAudio.pause();
        activeAudio.src = "";
        activeAudio = null;
      }
      if (activeAudioUrl) {
        URL.revokeObjectURL(activeAudioUrl);
        activeAudioUrl = "";
      }
      callbacks.onFallback?.(error instanceof Error ? error.message : "Gemini voice is unavailable.");
    }
  }

  await playBrowserSpeech(text, language, callbacks);
}
