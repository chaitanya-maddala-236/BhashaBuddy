"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bookmark, Check, ChevronRight, Clock3, Headphones, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { RouteActions } from "@/components/bhashabuddy/app";
import { CURRICULUM, getLanguage, getLessonPhrases, STAGES } from "@/lib/bhashabuddy-data";
import { WordSpeakLine } from "@/components/bhashabuddy/word-speak-line";

function speak(text: string, locale: string, slow = false) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  utterance.rate = slow ? 0.78 : 1;
  window.speechSynthesis.speak(utterance);
}

export function LessonPage({ actions, day }: { actions: RouteActions; day: number }) {
  const profile = actions.state.profile!;
  const language = getLanguage(profile.targetLanguage);
  const lesson = CURRICULUM[Math.max(0, Math.min(day, 30) - 1)];
  const phrases = getLessonPhrases(profile.targetLanguage, lesson.day);
  const [recallChoice, setRecallChoice] = useState<string | null>(null);
  const [scenarioChoice, setScenarioChoice] = useState<string | null>(null);
  const isComplete = actions.state.completedDays.includes(lesson.day);
  const nextDay = CURRICULUM.find((item) => !actions.state.completedDays.includes(item.day))?.day ?? 30;
  const canComplete = lesson.day <= nextDay;

  const recallOptions = useMemo(() => {
    const correct = phrases[0]?.meaning ?? "Hello";
    const alternatives = ["How much is this?", "Thank you", "Where is the bus station?", "Please say that again."]
      .filter((answer) => answer.toLowerCase() !== correct.toLowerCase());
    return [correct, ...alternatives.slice(0, 2)].sort((a, b) => (a.length + a.charCodeAt(0)) - (b.length + b.charCodeAt(0)));
  }, [phrases]);

  const scenarioOptions = phrases.slice(0, 3).map((phrase) => phrase.nativeText);
  const rightScenario = phrases[0]?.nativeText;

  function chooseRecall(answer: string) {
    setRecallChoice(answer);
  }

  function chooseScenario(answer: string) {
    setScenarioChoice(answer);
  }

  return (
    <div className="lesson-page">
      <div className="page-overline">
        <button className="back-link" onClick={() => actions.go("/dashboard")}><ArrowLeft size={14} /> BACK TO LEARN</button>
        <span>{language.name.toUpperCase()} <i>·</i> {lesson.stageTitle.toUpperCase()}</span>
      </div>

      <header className="lesson-hero">
        <div className="lesson-hero__meta"><span>DAY {String(lesson.day).padStart(2, "0")} / 30</span><span><Clock3 size={14} /> {lesson.duration} MIN</span></div>
        <div className="lesson-hero__title">
          <span className="lesson-hero__number">{String(lesson.day).padStart(2, "0")}</span>
          <div><span className="eyebrow">TODAY&apos;S PRACTICAL OBJECTIVE</span><h1>{lesson.title}.</h1><p>{lesson.objective}</p></div>
        </div>
        <div className="lesson-scenario"><span>THE SCENE</span><p>{lesson.scenario}</p><span className="lesson-scenario__script" lang={language.locale}>{language.nativeName}</span></div>
      </header>

      <div className="lesson-progress-line"><span>YOUR LESSON</span><Progress value={isComplete ? 100 : scenarioChoice === rightScenario ? 85 : recallChoice === phrases[0]?.meaning ? 55 : 16} className="journal-progress" /><span>{isComplete ? "COMPLETE" : "IN PROGRESS"}</span></div>

      <div className="lesson-layout">
        <main className="lesson-main">
          <section className="lesson-step">
            <div className="lesson-step__index"><span>01</span><i /></div>
            <div className="lesson-step__content">
              <span className="eyebrow">USEFUL PHRASES</span><h2>Words for this moment.</h2>
              <p className="section-intro">Read the phrase, then listen once for its rhythm. You can show either script or both in your preferences.</p>
              <div className="phrase-study-list">
                {phrases.map((phrase) => (
                  <article className="phrase-study" key={phrase.id}>
                    <div className="phrase-study__top"><span className="phrase-category">{phrase.category.toUpperCase()}</span><button className="icon-button" onClick={() => actions.toggleSaved(phrase.id)} aria-label={(actions.state.savedPhraseIds.includes(phrase.id) ? "Remove saved phrase" : "Save phrase") + ": " + phrase.meaning}><Bookmark size={17} fill={actions.state.savedPhraseIds.includes(phrase.id) ? "currentColor" : "none"} /></button></div>
                    <p className="phrase-study__native"><WordSpeakLine text={phrase.nativeText} languageCode={profile.targetLanguage} /></p>
                    <p className="phrase-study__translit">{phrase.transliteration}</p>
                    <p className="phrase-study__meaning">{phrase.meaning}</p>
                    <div className="phrase-study__bottom"><small>{phrase.note}</small><button onClick={() => speak(phrase.nativeText, language.locale)}><Volume2 size={15} /> Listen</button><button onClick={() => speak(phrase.nativeText, language.locale, true)}><Headphones size={15} /> Slowly</button></div>
                  </article>
                ))}
              </div>
              <div className="content-review-note"><span>CONTENT NOTE</span><p>Sample phrase for practice. Regional wording can vary; these examples are not marked as independently reviewed.</p></div>
            </div>
          </section>

          <section className="lesson-step">
            <div className="lesson-step__index"><span>02</span><i /></div>
            <div className="lesson-step__content">
              <span className="eyebrow">NOTICE THE PATTERN</span><h2>Start with the place.</h2>
              <p>In this question, the place comes first, followed by a word that asks where it is. You can use the same pattern with a nearby shop or a familiar landmark.</p>
              <div className="pattern-note"><span className="pattern-note__label">A SMALL REMINDER</span><strong lang={language.locale}>{phrases[0]?.nativeText}</strong><span>{phrases[0]?.meaning}</span></div>
            </div>
          </section>

          <section className="lesson-step">
            <div className="lesson-step__index"><span>03</span><i /></div>
            <div className="lesson-step__content">
              <span className="eyebrow">ACTIVE RECALL</span><h2>What does this phrase mean?</h2>
              <div className="recall-card"><p className="recall-card__phrase" lang={language.locale}>{phrases[0]?.nativeText}</p><p className="recall-card__translit">{phrases[0]?.transliteration}</p>
                <div className="recall-options">
                  {recallOptions.map((option) => {
                    const chosen = recallChoice === option;
                    const correct = option === phrases[0]?.meaning;
                    return <button key={option} className={"recall-option" + (chosen ? correct ? " is-correct" : " is-wrong" : "")} onClick={() => chooseRecall(option)} aria-pressed={chosen}>
                      <span>{chosen && correct ? <Check size={14} /> : String.fromCharCode(65 + recallOptions.indexOf(option))}</span>{option}
                    </button>;
                  })}
                </div>
                {recallChoice && <p className={"exercise-feedback" + (recallChoice === phrases[0]?.meaning ? " is-good" : "")}>{recallChoice === phrases[0]?.meaning ? "That’s it. You recognised the phrase in context." : "Not quite. Take another look at the meaning, then try again."}</p>}
              </div>
            </div>
          </section>

          <section className="lesson-step lesson-step--last">
            <div className="lesson-step__index"><span>04</span><i /></div>
            <div className="lesson-step__content">
              <span className="eyebrow">TRY THE SCENE</span><h2>Choose what you might say.</h2>
              <p>A person nearby is walking past the bus stop. Which phrase helps you ask for the station?</p>
              <div className="scenario-choices">
                {scenarioOptions.map((option) => <button key={option} className={"scenario-choice" + (scenarioChoice === option ? option === rightScenario ? " is-correct" : " is-wrong" : "")} onClick={() => chooseScenario(option)} lang={language.locale}>
                  <span>{option}</span>{scenarioChoice === option && option === rightScenario && <Check size={16} />}
                </button>)}
              </div>
              {scenarioChoice && <p className={"exercise-feedback" + (scenarioChoice === rightScenario ? " is-good" : "")}>{scenarioChoice === rightScenario ? "A useful question. You have completed today’s practice." : "Try the phrase that asks where the station is."}</p>}
            </div>
          </section>

          <div className="lesson-complete-bar">
            <div><span className="eyebrow">{isComplete ? "THIS PAGE IS IN YOUR JOURNAL" : "WHEN YOU'RE READY"}</span><p>{!canComplete ? "Finish the earlier days to keep your 30-day path in order." : isComplete ? "You can come back to review any phrase." : "Your progress is saved as you go."}</p></div>
            <Button className="btn-primary" onClick={() => actions.completeLesson(lesson.day)} disabled={!canComplete || isComplete}>
              {isComplete ? "Lesson complete" : canComplete ? "Complete lesson" : "Earlier lessons first"} {isComplete ? <Check size={16} /> : <ArrowRight size={16} />}
            </Button>
          </div>
        </main>

        <aside className="lesson-sidebar">
          <div className="lesson-sidebar__label">IN THIS LESSON</div>
          <a href="#top"><span>01</span> Useful phrases</a><a href="#top"><span>02</span> Notice the pattern</a><a href="#top"><span>03</span> Active recall</a><a href="#top"><span>04</span> Try the scene</a>
          <div className="lesson-sidebar__separator" />
          <div className="lesson-sidebar__label">THE 30-DAY PATH</div>
          {STAGES.map((stage) => <div key={stage.number} className="mini-stage"><span>{String(stage.number).padStart(2, "0")}</span><div><strong>{stage.title}</strong><small>{stage.days}</small></div></div>)}
          <button className="text-link" onClick={() => actions.go("/dashboard")}>Back to your index <ChevronRight size={14} /></button>
        </aside>
      </div>
    </div>
  );
}
