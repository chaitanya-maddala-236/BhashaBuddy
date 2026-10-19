"use client";

import { useMemo } from "react";
import { ArrowRight, Bookmark, Check, Clock3, Compass, Flame, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { RouteActions } from "@/components/bhashabuddy/app";
import { getLanguage, getLessonPhrases, getNextDay, PHRASES } from "@/lib/bhashabuddy-data";

function currentWeekMinutes(state: RouteActions["state"]) {
  const now = new Date();
  const dayLabels: string[] = [];
  const minutes: number[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
    dayLabels.push(date.toLocaleDateString("en", { weekday: "short" }).slice(0, 3));
    minutes.push(state.minutesByDate[key] ?? state.minutesByDate["d-" + offset] ?? 0);
  }
  return { dayLabels, minutes };
}

export function ProgressPage({ actions }: { actions: RouteActions }) {
  const profile = actions.state.profile!;
  const language = getLanguage(profile.targetLanguage);
  const completed = actions.state.completedDays.length;
  const nextDay = getNextDay(actions.state.completedDays);
  const totalMinutes = Object.values(actions.state.minutesByDate).reduce((sum, value) => sum + value, 0);
  const { dayLabels, minutes } = currentWeekMinutes(actions.state);
  const weekTotal = minutes.reduce((sum, value) => sum + value, 0);
  const phrasesLearned = useMemo(() => {
    const learned = new Set<string>();
    actions.state.completedDays.forEach((day) => getLessonPhrases(profile.targetLanguage, day).forEach((phrase) => learned.add(phrase.id)));
    return learned.size;
  }, [actions.state.completedDays, profile.targetLanguage]);
  const reviewItems = PHRASES[profile.targetLanguage].filter((phrase) => actions.state.savedPhraseIds.includes(phrase.id));
  const stages = [
    { name: "First interactions", range: "Days 1–3", max: 3, count: actions.state.completedDays.filter((day) => day <= 3).length },
    { name: "Everyday essentials", range: "Days 4–7", max: 4, count: actions.state.completedDays.filter((day) => day >= 4 && day <= 7).length },
    { name: "Moving around", range: "Days 8–14", max: 7, count: actions.state.completedDays.filter((day) => day >= 8 && day <= 14).length },
    { name: "Social communication", range: "Days 15–21", max: 7, count: actions.state.completedDays.filter((day) => day >= 15 && day <= 21).length },
    { name: "Practical conversation", range: "Days 22–30", max: 9, count: actions.state.completedDays.filter((day) => day >= 22).length },
  ];

  return (
    <div className="progress-page">
      <div className="page-overline"><span>05 / THE LONG VIEW</span><span>{language.name.toUpperCase()} <i>·</i> LEARNING JOURNAL</span></div>
      <header className="screen-heading screen-heading--progress">
        <div><span className="eyebrow">PROGRESS YOU CAN FEEL</span><h1>More ready<br /><em>for the next hello.</em></h1></div>
        <p>Notice the scenarios you have practiced and the phrases you want to keep close. This page reflects activity saved in this browser.</p>
      </header>
      {profile.isDemo && <div className="sample-data-note"><span>SAMPLE JOURNAL DATA</span><p>These example practice days help you explore the progress view. Start your own path in Settings to replace this sample.</p></div>}
      <div className="progress-metrics">
        <article><span className="eyebrow">LESSONS IN YOUR JOURNAL</span><strong>{completed}<small> / 30</small></strong><span className="metric-foot">{Math.round((completed / 30) * 100)}% of the path</span></article>
        <article><span className="eyebrow">TIME SPENT PRACTICING</span><strong>{totalMinutes}<small> min</small></strong><span className="metric-foot"><Clock3 size={13} /> Saved lesson and practice time</span></article>
        <article><span className="eyebrow">PHRASES TO RECALL</span><strong>{phrasesLearned}<small> phrases</small></strong><span className="metric-foot"><Bookmark size={13} /> From completed lesson content</span></article>
        <article><span className="eyebrow">PRACTICE DAYS THIS WEEK</span><strong>{actions.state.profile?.isDemo ? 5 : actions.state.practiceDates.length}<small> / 7</small></strong><span className="metric-foot"><Flame size={13} /> A steady rhythm, at your pace</span></article>
      </div>
      <div className="progress-primary-grid">
        <section className="weekly-progress">
          <div className="section-title-row"><div><span className="eyebrow">THE LAST SEVEN DAYS</span><h2>Practice has a rhythm.</h2></div><span className="weekly-total">{weekTotal}<small>MIN</small></span></div>
          <div className="progress-chart">
            {minutes.map((value, index) => <div className="progress-chart__day" key={index}>
              <div className="progress-chart__track"><span style={{ height: value ? Math.max(10, Math.min(100, value * 4)) + "%" : "3px" }} className={value ? "has-value" : ""} /></div>
              <strong>{value || "—"}</strong><small>{dayLabels[index]}</small>
            </div>)}
          </div>
          <div className="chart-legend"><span><i /> Minutes practiced</span><span>{weekTotal} minutes logged</span></div>
        </section>
        <section className="assessment-card">
          <div className="assessment-card__seal"><Compass size={25} /></div><span className="eyebrow">DAY 29 / PRACTICAL CHECK</span>
          <h2>Try a few everyday situations.</h2>
          <p>The final check is an app-based estimate, not a certification. Work through it when the earlier conversations feel familiar.</p>
          <Button className="btn-ink" onClick={() => actions.go(nextDay >= 29 ? "/practice" : "/learn/" + nextDay)}>{nextDay >= 29 ? "Open practice assessment" : "Continue the path"} <ArrowRight size={15} /></Button>
          <span className="assessment-card__status">{nextDay >= 29 ? "READY WHEN YOU ARE" : "UNLOCKS AFTER DAY 28"}</span>
        </section>
      </div>

      <section className="stage-progress">
        <div className="section-title-row"><div><span className="eyebrow">FIVE PRACTICAL STAGES</span><h2>The way you are building.</h2></div><span className="stage-progress__total">{completed} / 30 complete</span></div>
        {stages.map((stage, index) => <article className="stage-progress__row" key={stage.name}>
          <span className="stage-progress__number">{String(index + 1).padStart(2, "0")}</span>
          <div className="stage-progress__label"><strong>{stage.name}</strong><small>{stage.range}</small></div>
          <Progress value={(stage.count / stage.max) * 100} className="journal-progress" />
          <span className="stage-progress__count">{stage.count}<small> / {stage.max}</small></span>
        </article>)}
      </section>

      <section className="review-section">
        <div className="section-title-row"><div><span className="eyebrow">KEEP THESE IN REACH</span><h2>Your saved phrases.</h2></div><button className="text-link" onClick={() => actions.go("/phrasebook")}>Open phrasebook <ArrowRight size={14} /></button></div>
        {reviewItems.length ? <div className="review-list">{reviewItems.slice(0, 3).map((phrase) => <article className="review-item" key={phrase.id}>
          <span className="review-item__mark"><Bookmark size={15} fill="currentColor" /></span><div><strong lang={language.locale}>{phrase.nativeText}</strong><small>{phrase.transliteration}</small></div><span className="review-item__meaning">{phrase.meaning}</span><button onClick={() => actions.toggleSaved(phrase.id)} aria-label={"Remove " + phrase.meaning + " from saved phrases"}><Check size={15} /></button>
        </article>)}</div> : <div className="review-empty"><span className="review-empty__icon"><Bookmark size={17} /></span><div><strong>Your phrase review starts here.</strong><p>Save a phrase from a lesson or the phrasebook to keep it close.</p></div><Button className="btn-line" onClick={() => actions.go("/phrasebook")}>Browse phrases <ArrowRight size={14} /></Button></div>}
      </section>

      <section className="progress-challenge"><Mic2 size={22} /><div><span className="eyebrow">NEXT PRACTICAL STEP</span><h3>Try one short role-play in {language.name}.</h3><p>A few turns are enough to notice what is becoming familiar.</p></div><Button className="btn-paper" onClick={() => actions.go("/practice")}>Practice speaking <ArrowRight size={15} /></Button></section>
      <div className="progress-method-note"><Check size={15} /><p>Progress is calculated from completed lessons, saved phrases, and practice sessions recorded on this device. No accent score is shown.</p></div>
    </div>
  );
}
