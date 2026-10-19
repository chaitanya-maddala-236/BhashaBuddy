import type { Language } from "@/lib/bhashabuddy-data";

export type AvatarState = "idle" | "listening" | "thinking" | "speaking";

export function LanguageAvatar({ language, state }: { language: Language; state: AvatarState }) {
  const activity = {
    idle: "ready to talk",
    listening: "listening to you",
    thinking: "thinking of a reply",
    speaking: "speaking",
  }[state];

  return (
    <div className={`language-avatar language-avatar--${language.code}`} data-state={state} role="img" aria-label={`Animated ${language.name} speaking partner, ${activity}`}>
      <span className="language-avatar__orbit language-avatar__orbit--outer" />
      <span className="language-avatar__orbit language-avatar__orbit--inner" />
      <svg className="language-avatar__portrait" viewBox="0 0 200 210" aria-hidden="true">
        <path className="language-avatar__body" d="M34 201c3-40 24-62 66-62s63 22 66 62H34Z" />
        <path className="language-avatar__neck" d="M81 132h38v32c-10 10-28 10-38 0v-32Z" />
        <ellipse className="language-avatar__ear" cx="59" cy="94" rx="10" ry="15" />
        <ellipse className="language-avatar__ear" cx="141" cy="94" rx="10" ry="15" />
        <path className="language-avatar__face" d="M100 32c-25 0-42 20-42 50v21c0 28 18 47 42 47s42-19 42-47V82c0-30-17-50-42-50Z" />
        <path className="language-avatar__hair" d="M57 93c-4-38 13-66 44-66 31 0 48 23 43 66-6-8-10-18-12-31-16 9-35 12-62 8-2 9-6 17-13 23Z" />
        <path className="language-avatar__brow" d="M75 91c5-4 11-4 16-1M109 90c5-3 11-3 16 1" />
        <ellipse className="language-avatar__eye" cx="83" cy="101" rx="2.5" ry="3" />
        <ellipse className="language-avatar__eye" cx="117" cy="101" rx="2.5" ry="3" />
        <path className="language-avatar__nose" d="M100 102c-1 8-4 14-3 17 2 2 5 2 7 0" />
        <ellipse className="language-avatar__mouth" cx="100" cy="128" rx="7" ry="2.4" />
        <path className="language-avatar__collar" d="m72 147 28 23 28-23 12 13-21 41H81l-21-41 12-13Z" />
      </svg>
      <span className="language-avatar__script" lang={language.locale}>{language.nativeName.slice(0, 1)}</span>
      <span className="language-avatar__spark language-avatar__spark--one">✳</span>
      <span className="language-avatar__spark language-avatar__spark--two">✦</span>
    </div>
  );
}
