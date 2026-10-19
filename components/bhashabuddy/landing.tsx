"use client";

import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Headphones, MessageCircle, Mic2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JourneyIllustration } from "@/components/bhashabuddy/illustrations";
import type { RouteActions } from "@/components/bhashabuddy/app";
import { LANGUAGES, STAGES } from "@/lib/bhashabuddy-data";

export function LandingPage({ actions }: { actions: RouteActions }) {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <button className="wordmark" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="BhashaBuddy home">
          <span className="brand-mark">b.</span>
          <span className="wordmark-name">bhasha<span>buddy</span></span>
        </button>
        <nav className="landing-nav" aria-label="Page navigation">
          <a href="#method">The method</a>
          <a href="#journey">30-day journal</a>
          <a href="#speaking">Speaking practice</a>
        </nav>
        <div className="landing-header__actions">
          <button className="text-link" onClick={actions.startDemo}>Explore sample <ArrowUpRight size={15} /></button>
          <Button className="btn-primary btn-small" onClick={() => actions.go("/onboarding")}>Start learning <ArrowRight size={15} /></Button>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> INDIAN LANGUAGES, REAL CONVERSATIONS</div>
            <h1>A new language.<br /><em>A more connected life.</em></h1>
            <p className="hero-description">A thoughtful 30-day path to more confidence in everyday conversations. Learn a useful phrase, say it out loud, then try it in a real-life situation.</p>
            <div className="hero-actions">
              <Button className="btn-primary" onClick={() => actions.go("/onboarding")}>Start your 30-day journey <ArrowRight size={17} /></Button>
              <a className="quiet-link" href="#method">See how it works <ArrowDown size={15} /></a>
            </div>
            <div className="hero-footnote"><span className="small-seal">30</span><span>Short daily lessons · Your pace, your purpose</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-visual__issue"><span>ISSUE Nº 01</span><span>THE EVERYDAY EDITION</span></div>
            <JourneyIllustration />
            <div className="hero-day-note"><span>DAY 08</span><strong>Find your way around</strong><small>12 min · Moving around</small></div>
          </div>
          <div className="hero-index"><span>01</span><span>START WITH A CONVERSATION</span><span>SCROLL TO EXPLORE ↓</span></div>
        </section>

        <section className="language-strip">
          <span>FIVE LANGUAGES, ONE USEFUL FIRST STEP</span>
          <div>{LANGUAGES.map((language) => <span key={language.code}><b>{language.nativeName}</b> {language.name}</span>)}</div>
        </section>

        <section id="method" className="method-section editorial-section">
          <div className="section-kicker"><span>01 / THE METHOD</span><span>USE IT TODAY</span></div>
          <div className="section-heading-row">
            <h2>Learn the moment.<br /><em>Not just the words.</em></h2>
            <p>Build a small, useful vocabulary around the places and people in your life. Practice starts with speaking, and mistakes stay private.</p>
          </div>
          <div className="method-grid">
            <article className="method-item">
              <span className="large-index">01</span><BookOpen size={22} strokeWidth={1.4} />
              <h3>Read the room</h3><p>Meet a phrase in its natural setting, with script, transliteration, and a note on when to use it.</p>
            </article>
            <article className="method-item method-item--accent">
              <span className="large-index">02</span><Headphones size={22} strokeWidth={1.4} />
              <h3>Hear its rhythm</h3><p>Listen, repeat, and notice the parts that help a sentence sound clear and considerate.</p>
            </article>
            <article className="method-item">
              <span className="large-index">03</span><MessageCircle size={22} strokeWidth={1.4} />
              <h3>Try the exchange</h3><p>Practice a short role-play, get a manageable language note, and have another go.</p>
            </article>
          </div>
        </section>

        <section id="journey" className="journey-section editorial-section">
          <div className="section-kicker"><span>02 / THE JOURNAL</span><span>30 DAYS, A PRACTICAL PATH</span></div>
          <div className="journey-layout">
            <div className="journey-intro">
              <span className="journey-number">30</span>
              <h2>Small steps.<br /><em>More room to speak.</em></h2>
              <p>Each day pairs a handful of useful phrases with active recall and a short scenario. The aim is basic conversational confidence in familiar situations, with plenty of room to keep learning.</p>
              <Button className="btn-ink" onClick={() => actions.go("/onboarding")}>Build my learning path <ArrowRight size={16} /></Button>
            </div>
            <div className="stage-index">
              {STAGES.map((stage) => (
                <article className="stage-index__row" key={stage.number}>
                  <span className="stage-index__number">{String(stage.number).padStart(2, "0")}</span>
                  <div><h3>{stage.title}</h3><p>{stage.days} · real-world situations</p></div>
                  <span className="stage-index__range">{stage.range}</span>
                </article>
              ))}
              <div className="stage-index__note"><span>↳</span> Your path adapts to your level and what you want to do.</div>
            </div>
          </div>
        </section>

        <section id="speaking" className="speaking-section editorial-section">
          <div className="section-kicker section-kicker--light"><span>03 / SAY IT OUT LOUD</span><span>A QUIETER KIND OF PRACTICE</span></div>
          <div className="speaking-layout">
            <div className="speaking-copy">
              <span className="speaking-label"><Mic2 size={15} /> PRIVATE PRACTICE, YOUR WAY</span>
              <h2>Conversation gets easier<br />when you can <em>try twice.</em></h2>
              <p>Practice with voice or text. See what the app heard before you continue, then get a short language suggestion when it can help.</p>
              <div className="speaking-points"><span><b>01</b> A simple everyday scenario</span><span><b>02</b> Space to pause or ask for a hint</span><span><b>03</b> Feedback tied to your transcript</span></div>
              <Button className="btn-paper" onClick={() => actions.go("/onboarding")}>Choose a language <ArrowRight size={16} /></Button>
            </div>
            <div className="tutor-preview">
              <div className="tutor-preview__top"><span>ROLE-PLAY / AT THE BUS STOP</span><span>● READY</span></div>
              <div className="tutor-preview__scene"><span className="scene-stamp">TODAY&apos;S SCENE</span><p>You need to find the bus station. Ask someone nearby for directions.</p></div>
              <div className="preview-message"><small>LOCAL GUIDE</small><p>What are you looking for?</p><span>మీరు ఏమి వెతుకుతున్నారు?</span></div>
              <div className="preview-message preview-message--you"><small>YOU · TRY A RESPONSE</small><p>బస్ స్టేషన్ ఎక్కడ ఉంది?</p><span>Where is the bus station?</span></div>
              <div className="preview-feedback"><span className="feedback-mark">↗</span><p><b>Language note</b><br />A clear question. Try the station name slowly once more.</p><small>TEXT TRANSCRIPT FEEDBACK · NO ACCENT SCORE</small></div>
              <div className="preview-mic"><span className="mic-ring"><Mic2 size={21} /></span><span>Hold a thought. Take your time.</span><span>↻</span></div>
            </div>
          </div>
        </section>

        <section className="promise-section editorial-section">
          <div className="section-kicker"><span>04 / STEADY PROGRESS</span><span>MEASURE WHAT YOU CAN DO</span></div>
          <div className="promise-layout">
            <div><h2>Real progress sounds<br /><em>like being understood.</em></h2><p>Track the situations you have practiced, phrases you want to revisit, and the parts of speaking that are getting easier.</p></div>
            <div className="promise-note"><span>A NOTE ON THE 30-DAY PROMISE</span><p>This is a structured practice goal, not a promise of fluency or a formal proficiency result. Progress depends on your starting point, practice, language variety, and speech technology.</p><a href="#faq">Read the honest FAQ <ArrowRight size={14} /></a></div>
          </div>
        </section>

        <section id="faq" className="faq-section editorial-section">
          <div className="section-kicker"><span>05 / A FEW CLEAR ANSWERS</span><span>BEFORE YOU BEGIN</span></div>
          <div className="faq-grid">
            <div><h2>Good to know.</h2><p>Clear expectations make practice feel safer.</p></div>
            <div className="faq-list">
              <details><summary>Will I be fluent in 30 days?</summary><p>No. The path is designed to help you practice basic conversations in familiar situations. It does not guarantee fluency or a formal language level.</p></details>
              <details><summary>How does speech feedback work?</summary><p>Browser speech recognition can show a transcript when your device supports it. Text-based suggestions use that transcript. They do not measure accent or pronunciation quality.</p></details>
              <details><summary>Are all phrases reviewed by native speakers?</summary><p>The first version contains sample phrases for learning and demonstration. Regional wording can vary, and the examples are not presented as independently verified.</p></details>
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div><span className="eyebrow">A SMALL START IS A GOOD START</span><h2>Say your first<br /><em>useful phrase.</em></h2></div>
          <div><p>Choose a language and make a practice path that fits your day.</p><Button className="btn-primary" onClick={() => actions.go("/onboarding")}>Start your journey <ArrowRight size={16} /></Button></div>
          <span className="landing-cta__seal">BB<br />01</span>
        </section>
      </main>

      <footer className="landing-footer">
        <button className="wordmark" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><span className="brand-mark">b.</span><span className="wordmark-name">bhasha<span>buddy</span></span></button>
        <span>Made for everyday conversations.</span>
        <button className="text-link" onClick={actions.startDemo}>Open a sample journal <ArrowUpRight size={14} /></button>
      </footer>
    </div>
  );
}
