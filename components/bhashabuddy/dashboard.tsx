"use client";

import { ArrowRight, ArrowUpRight, Bookmark, Check, Clock3, Flame, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { RouteActions } from "@/components/bhashabuddy/app";
import { LearningCoach } from "@/components/bhashabuddy/learning-coach";
import { CURRICULUM, getLanguage, getLessonPhrases, getNextDay } from "@/lib/bhashabuddy-data";

function getWeekData(state: RouteActions["state"]) {
  const now = new Date();
  const names: string[] = [];
  const values: number[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
    names.push(date.toLocaleDateString("en", { weekday: "short" }).slice(0, 1));
    values.push(state.minutesByDate[key] ?? state.minutesByDate["d-" + offset] ?? 0);
  }
  return { names, values };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function Dashboard({ actions }: { actions: RouteActions }) {
  const profile = actions.state.profile!;
  const language = getLanguage(profile.targetLanguage);
  const day = getNextDay(actions.state.completedDays);
  const lesson = CURRICULUM[day - 1];
  const completed = actions.state.completedDays.length;
  const progress = Math.round((completed / 30) * 100);
  const { names, values } = getWeekData(actions.state);
  const weeklyMinutes = values.reduce((sum, value) => sum + value, 0);
  const practiceDays = actions.state.profile?.isDemo ? 5 : actions.state.practiceDates.length;
  const phrase = getLessonPhrases(profile.targetLanguage, day)[0];
  const visibleLessons = CURRICULUM.slice(day - 1, Math.min(day + 3, 30));

  return (
    <div className="dashboard-page">
      <div className="page-overline">
        <span>{new Date().toLocaleDateString("en", { weekday: "long" }).toUpperCase()} JOURNAL <i>·</i> {language.name.toUpperCase()}</span>
        {profile.isDemo && <span className="sample-flag">SAMPLE LEARNER JOURNAL</span>}
      </div>
      <header className="dashboard-heading">
        <div>
          <span className="eyebrow">A GOOD DAY TO SAY SOMETHING NEW</span>
          <h1>{getGreeting()},<br /><em>{profile.name || "language learner"}.</em></h1>
        </div>
        <p>Keep your next conversation close.<br />Today, we will practice {lesson.title.toLowerCase()}.</p>
      </header>

      <section className="feature-lesson" aria-labelledby="today-lesson-title">
        <div className="feature-lesson__main">
          <div className="feature-meta"><span>YOUR NEXT LESSON</span><span>DAY {String(day).padStart(2, "0")} <b>/ 30</b></span></div>
          <div className="feature-content">
            <span className="feature-day-number">{String(day).padStart(2, "0")}</span>
            <div className="feature-copy">
              <span className="stage-label">STAGE {String(lesson.stage).padStart(2, "0")} · {lesson.stageTitle.toUpperCase()}</span>
              <h2 id="today-lesson-title">{lesson.title}</h2>
              <p>{lesson.objective}</p>
              <div className="feature-details"><span><Clock3 size={14} /> {lesson.duration} min</span><span><span className="target-script">{language.nativeName.slice(0, 1)}</span> {language.name}</span></div>
              <Button className="btn-paper feature-cta" onClick={() => actions.go("/learn/" + day)}>Continue learning <ArrowRight size={16} /></Button>
            </div>
          </div>
          <div className="feature-progress">
            <div><span>YOUR 30-DAY PATH</span><span>{completed} OF 30 LESSONS</span></div>
            <Progress value={progress} className="journal-progress" />
          </div>
        </div>
        <div className="feature-lesson__art" aria-label="Route through a neighbourhood to the bus station">
          <div className="feature-art__label"><span>FIELD NOTE / 08</span><span>HYDERABAD</span></div>
          <div className="mini-map">
            <div className="mini-map__street mini-map__street--horizontal one" />
            <div className="mini-map__street mini-map__street--horizontal two" />
            <div className="mini-map__street mini-map__street--vertical one" />
            <div className="mini-map__street mini-map__street--vertical two" />
            <svg className="mini-map__path" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true">
              <path d="M42 253h82c20 0 30-12 30-32v-92c0-24 11-37 36-37h60c25 0 35-14 35-37V29" fill="none" stroke="#e9684b" strokeWidth="4" strokeLinecap="round" />
            </svg>
            <span className="map-start"><i /> START HERE</span>
            <span className="map-dest">BUS STATION</span>
            <span className="map-script">{language.nativeName}</span>
          </div>
          <div className="feature-art__caption"><span>A SHORT WALK</span><span>ASK · LISTEN · FIND</span></div>
        </div>
      </section>

      <LearningCoach
        state={actions.state}
        onNavigate={actions.go}
        onStartScenario={(slug) => actions.go("/practice/" + slug)}
        onSavePhrase={actions.toggleSaved}
      />

      <div className="dashboard-overview">
        <section className="weekly-card">
          <div className="block-heading"><div><span className="eyebrow">YOUR WEEK, SO FAR</span><h3>A little, often.</h3></div><span className="weekly-total">{weeklyMinutes}<small>MIN</small></span></div>
          <div className="week-chart" aria-label={weeklyMinutes + " practice minutes over the last seven days"}>
            {values.map((value, index) => {
              const height = value ? Math.max(14, Math.min(100, value * 4.4)) : 5;
              return <div className="week-chart__item" key={index}>
                <div className="week-chart__bar-track"><span style={{ height: height + "%" }} className={value ? "has-value" : ""} /></div>
                <span className="week-chart__day">{names[index]}</span>
              </div>;
            })}
          </div>
          <div className="week-summary"><span><i className="summary-dot" /> {practiceDays} practice days</span><span>Goal · {profile.minutesPerDay} min a day</span></div>
        </section>
        <section className="streak-card">
          <div className="block-heading"><div><span className="eyebrow">THE PRACTICE</span><h3>Keep the thread.</h3></div><Flame size={21} className="terracotta-icon" /></div>
          <div className="streak-number">{profile.isDemo ? 3 : practiceDays}<span>days<br />in a row</span></div>
          <div className="streak-rule"><span style={{ width: Math.min(100, (practiceDays / 7) * 100) + "%" }} /></div>
          <p>Regular practice makes familiar phrases easier to reach for.</p>
        </section>
        <section className="phrase-card">
          <div className="block-heading"><div><span className="eyebrow">KEEP THIS ONE CLOSE</span><h3>Today&apos;s phrase.</h3></div><Bookmark size={18} strokeWidth={1.6} /></div>
          <p className="phrase-native" lang={language.locale}>{phrase.nativeText}</p>
          <p className="phrase-translit">{phrase.transliteration}</p>
          <div className="phrase-card__bottom"><span>{phrase.meaning}</span><button onClick={() => actions.toggleSaved(phrase.id)} aria-label="Save today's phrase"><Bookmark size={15} fill={actions.state.savedPhraseIds.includes(phrase.id) ? "currentColor" : "none"} /> {actions.state.savedPhraseIds.includes(phrase.id) ? "Saved" : "Save phrase"}</button></div>
        </section>
      </div>

      <section className="next-steps">
        <div className="section-title-row">
          <div><span className="eyebrow">THE NEXT FEW PAGES</span><h2>On the path.</h2></div>
          <button className="text-link" onClick={() => actions.go("/learn/" + day)}>View the full 30-day index <ArrowUpRight size={15} /></button>
        </div>
        <div className="lesson-index">
          {visibleLessons.map((item) => {
            const isCurrent = item.day === day;
            const isComplete = actions.state.completedDays.includes(item.day);
            return <button key={item.day} className={"lesson-index__row" + (isCurrent ? " is-current" : "")} onClick={() => actions.go("/learn/" + item.day)}>
              <span className={"lesson-index__number" + (isComplete ? " is-complete" : "")}>{isComplete ? <Check size={15} /> : String(item.day).padStart(2, "0")}</span>
              <span className="lesson-index__title"><strong>{item.title}</strong><small>{item.stageTitle}</small></span>
              <span className="lesson-index__duration">{item.duration} min</span>
              <ArrowRight size={16} className="lesson-index__arrow" />
            </button>;
          })}
          <div className="lesson-index__end"><span>30 / 30</span><span>A practical review, and a next plan that fits you.</span></div>
        </div>
      </section>

      <section className="speaking-prompt">
        <div className="speaking-prompt__icon"><Mic2 size={21} /></div>
        <div><span className="eyebrow">A SMALL SPEAKING CHALLENGE</span><h3>Ask someone where the bus station is.</h3><p>Try it in a short role-play first. The transcript stays editable before you continue.</p></div>
        <Button className="btn-ink" onClick={() => actions.go("/practice/bus-stop")}>Practice this <ArrowRight size={15} /></Button>
      </section>
    </div>
  );
}
