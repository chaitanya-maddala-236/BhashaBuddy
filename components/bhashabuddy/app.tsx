"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Bookmark,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  Flame,
  Languages,
  Menu,
  MessageCircle,
  Settings,
} from "lucide-react";
import { LandingPage } from "@/components/bhashabuddy/landing";
import { Onboarding } from "@/components/bhashabuddy/onboarding";
import { Dashboard } from "@/components/bhashabuddy/dashboard";
import { LessonPage } from "@/components/bhashabuddy/lesson";
import { PracticePage } from "@/components/bhashabuddy/practice";
import { PhrasebookPage } from "@/components/bhashabuddy/phrasebook";
import { ProgressPage } from "@/components/bhashabuddy/progress";
import { SettingsPage } from "@/components/bhashabuddy/settings";
import { getLanguage, getNextDay, LANGUAGES, type LanguageCode } from "@/lib/bhashabuddy-data";
import { useAccountSync } from "@/lib/use-account-sync";
import {
  DEMO_STATE,
  EMPTY_STATE,
  loadState,
  saveState,
  type AppState,
  type Profile,
} from "@/lib/demo-store";

type RouteActions = {
  go: (path: string) => void;
  state: AppState;
  setState: (next: AppState | ((previous: AppState) => AppState)) => void;
  startDemo: () => void;
  resetDemo: () => void;
  toggleSaved: (phraseId: string) => void;
  completeLesson: (day: number) => void;
  recordPractice: (minutes?: number) => void;
  accountSync: ReturnType<typeof useAccountSync>;
};

const navigation = [
  { label: "Learn", path: "/dashboard", Icon: BookOpen },
  { label: "Practice", path: "/practice", Icon: MessageCircle },
  { label: "Phrasebook", path: "/phrasebook", Icon: Bookmark },
  { label: "Progress", path: "/progress", Icon: ChartNoAxesColumnIncreasing },
];

function todayKey() {
  const date = new Date();
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function getStreak(state: AppState) {
  if (state.profile?.isDemo) return 3;
  const dates = new Set(state.practiceDates);
  const date = new Date();
  let streak = 0;
  for (let offset = 0; offset < 60; offset += 1) {
    const check = new Date(date);
    check.setDate(date.getDate() - offset);
    const key = check.getFullYear() + "-" + String(check.getMonth() + 1).padStart(2, "0") + "-" + String(check.getDate()).padStart(2, "0");
    if (!dates.has(key)) {
      if (offset === 0) continue;
      break;
    }
    streak += 1;
  }
  return streak;
}

export function BhashaBuddyApp() {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setStateRaw] = useState<AppState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Restore browser-only guest state after hydration to avoid a server/client mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStateRaw(loadState());
    setHydrated(true);
  }, []);

  const setState = useCallback((next: AppState | ((previous: AppState) => AppState)) => {
    setStateRaw((previous) => {
      const resolved = typeof next === "function" ? next(previous) : next;
      saveState(resolved);
      return resolved;
    });
  }, []);

  const accountSync = useAccountSync(state, (next) => setState(next));

  const go = useCallback((path: string) => {
    router.push(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    if (state.profile && pathname === "/") router.replace("/dashboard");
    if (!state.profile && pathname !== "/" && pathname !== "/onboarding") router.replace("/");
  }, [hydrated, pathname, router, state.profile]);

  const startDemo = useCallback(() => {
    setState(DEMO_STATE);
    router.push("/dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [router, setState]);

  const resetDemo = useCallback(() => {
    setState(EMPTY_STATE);
    router.push("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [router, setState]);

  const toggleSaved = useCallback((phraseId: string) => {
    setState((previous) => ({
      ...previous,
      savedPhraseIds: previous.savedPhraseIds.includes(phraseId)
        ? previous.savedPhraseIds.filter((id) => id !== phraseId)
        : [...previous.savedPhraseIds, phraseId],
    }));
  }, [setState]);

  const recordPractice = useCallback((minutes = 3) => {
    const key = todayKey();
    setState((previous) => ({
      ...previous,
      practiceDates: previous.practiceDates.includes(key) ? previous.practiceDates : [...previous.practiceDates, key],
      minutesByDate: {
        ...previous.minutesByDate,
        [key]: (previous.minutesByDate[key] ?? 0) + minutes,
      },
      recentPractice: previous.recentPractice + 1,
    }));
  }, [setState]);

  const completeLesson = useCallback((day: number) => {
    setState((previous) => {
      const nextDay = getNextDay(previous.completedDays);
      if (day > nextDay || previous.completedDays.includes(day)) return previous;
      const date = todayKey();
      return {
        ...previous,
        completedDays: [...previous.completedDays, day].sort((a, b) => a - b),
        practiceDates: previous.practiceDates.includes(date) ? previous.practiceDates : [...previous.practiceDates, date],
        minutesByDate: {
          ...previous.minutesByDate,
          [date]: (previous.minutesByDate[date] ?? 0) + 10,
        },
      };
    });
    router.push("/dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [router, setState]);

  const actions: RouteActions = useMemo(() => ({
    go,
    state,
    setState,
    startDemo,
    resetDemo,
    toggleSaved,
    completeLesson,
    recordPractice,
    accountSync,
  }), [accountSync, completeLesson, go, recordPractice, resetDemo, setState, startDemo, state, toggleSaved]);

  if (!hydrated) {
    return <main className="preload-screen"><span className="brand-mark">b.</span></main>;
  }

  if (pathname === "/" || pathname === "/onboarding") {
    return pathname === "/onboarding"
      ? <Onboarding actions={actions} />
      : <LandingPage actions={actions} />;
  }

  if (!state.profile) return null;

  const activeDay = pathname.startsWith("/learn/")
    ? Number(pathname.slice("/learn/".length)) || getNextDay(state.completedDays)
    : getNextDay(state.completedDays);

  let screen: ReactNode;
  if (pathname === "/dashboard") {
    screen = <Dashboard actions={actions} />;
  } else if (pathname.startsWith("/learn")) {
    screen = <LessonPage actions={actions} day={activeDay} />;
  } else if (pathname.startsWith("/practice")) {
    screen = <PracticePage actions={actions} />;
  } else if (pathname === "/phrasebook") {
    screen = <PhrasebookPage actions={actions} />;
  } else if (pathname === "/progress") {
    screen = <ProgressPage actions={actions} />;
  } else if (pathname === "/settings") {
    screen = <SettingsPage actions={actions} />;
  } else {
    screen = <Dashboard actions={actions} />;
  }

  return <AppShell actions={actions} activePath={pathname} content={screen} />;
}

function AppShell({
  actions,
  activePath,
  content,
}: {
  actions: RouteActions;
  activePath: string;
  content: ReactNode;
}) {
  const profile = actions.state.profile as Profile;
  const language = getLanguage(profile.targetLanguage);
  const streak = getStreak(actions.state);

  function changeLanguage(code: LanguageCode) {
    actions.setState((previous) => ({
      ...previous,
      profile: previous.profile ? { ...previous.profile, targetLanguage: code } : null,
    }));
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <button className="wordmark" onClick={() => actions.go("/dashboard")} aria-label="BhashaBuddy home">
          <span className="brand-mark">b.</span>
          <span className="wordmark-name">bhasha<span>buddy</span></span>
        </button>
        <div className="app-header__center">YOUR LANGUAGE, IN EVERYDAY LIFE</div>
        <div className="app-header__tools">
          <label className="language-picker">
            <Languages size={15} aria-hidden="true" />
            <span className="sr-only">Target language</span>
            <select value={profile.targetLanguage} onChange={(event) => changeLanguage(event.target.value as LanguageCode)}>
              {LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
            <ChevronDown size={13} aria-hidden="true" />
          </label>
          <span className="streak-indicator" aria-label={streak + " day learning streak"}>
            <Flame size={15} aria-hidden="true" /><strong>{streak}</strong><span>day streak</span>
          </span>
          <button className="profile-stamp" onClick={() => actions.go("/settings")} aria-label="Open settings">
            {(profile.name || "Y").slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>

      <div className="app-frame">
        <aside className="app-sidebar" aria-label="Main navigation">
          <div className="sidebar-caption">YOUR JOURNAL</div>
          <nav className="sidebar-nav">
            {navigation.map(({ label, path, Icon }) => {
              const active = path === "/dashboard"
                ? activePath === "/dashboard" || activePath.startsWith("/learn")
                : activePath === path || (path === "/practice" && activePath.startsWith("/practice/"));
              return (
                <button key={path} className={"nav-link" + (active ? " is-active" : "")} onClick={() => actions.go(path)} aria-current={active ? "page" : undefined}>
                  <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                  <span>{label}</span>
                  {active && <span className="nav-mark" aria-hidden="true" />}
                </button>
              );
            })}
          </nav>
          <div className="sidebar-language">
            <div className="sidebar-caption">LEARNING</div>
            <div className="language-tile">
              <span className="language-monogram">{language.nativeName.slice(0, 1)}</span>
              <span><strong>{language.name}</strong><small>{language.script} script</small></span>
              <button onClick={() => actions.go("/settings")} aria-label="Change learning preferences"><ChevronDown size={14} /></button>
            </div>
          </div>
          <div className="sidebar-footer">
            <button className={"nav-link" + (activePath === "/settings" ? " is-active" : "")} onClick={() => actions.go("/settings")}>
              <Settings size={18} strokeWidth={1.7} aria-hidden="true" /><span>Settings</span>
            </button>
            <div className="edition-note"><span>BHASHABUDDY JOURNAL</span><span>EDITION 01 / 2026</span></div>
          </div>
        </aside>

        <main className="app-content">
          <div className="mobile-edition"><span>FIELD NOTES / {language.name.toUpperCase()}</span><Menu size={16} aria-hidden="true" /></div>
          {content}
          <footer className="app-footer">
            <span>One small conversation at a time.</span>
            <span>AI practice is a learning aid. Regional wording can vary.</span>
          </footer>
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Main navigation">
        {navigation.map(({ label, path, Icon }) => {
          const active = path === "/dashboard"
            ? activePath === "/dashboard" || activePath.startsWith("/learn")
            : activePath === path || (path === "/practice" && activePath.startsWith("/practice/"));
          return <button key={path} className={active ? "is-active" : ""} onClick={() => actions.go(path)} aria-current={active ? "page" : undefined}>
            <Icon size={19} strokeWidth={1.7} aria-hidden="true" /><span>{label}</span>
          </button>;
        })}
      </nav>
    </div>
  );
}

export type { RouteActions };
