# BhashaBuddy

BhashaBuddy is a local-first language learning journal for practising everyday conversations in Telugu, Hindi, Tamil, Kannada, and Malayalam. It uses an editorial layout with a 30-day course, short phrase lessons, a phrasebook, weekly progress, and a scenario-based speaking workspace.

## Run locally

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:3000`. To make a production build, run `npm run build`, then `npm start`.

## Try the app

- Choose **Explore the sample journal** on the landing page to open a seeded Telugu learner account at Day 08, or start onboarding to make a local learning plan.
- Complete a lesson, save phrases, and practise one of the included role-play scenarios. Progress and preferences are stored in this browser's local storage. Each phrase word has its own pronunciation control in lessons and the phrasebook.
- The speaking workspace accepts typed replies and browser speech recognition. Spoken turns are transcribed and sent when you finish; the language-themed tutor avatar animates as it listens and replies aloud with your browser's speech voice. The sample tutor uses deterministic responses and does not call a live AI service.
- To use live replies, open **Settings → Gemini speaking tutor**, paste a Gemini API key, and choose **Check & save**. BhashaBuddy checks the selected model's metadata before saving the key for this tab; it does not generate a paid/token-consuming sample prompt during the check.
- The checked key and the latest 12 transcript messages (six exchanges) stay in `sessionStorage` for the current tab. Use **Clear memory** in a conversation to reset its context, or **Forget** in Settings to remove the key. The server does not persist either item.
- Use the language selector in the app navigation to change the course language.

## Product scope

The app runs without credentials or a network backend. Lesson records cover 30 days, with interactive phrase and recall activities. Sample phrase data and role-play replies are demonstration content; material is labelled for native-speaker review and is not represented as independently verified. Browser speech recognition availability depends on the browser and device. Raw audio is not retained by the app.

The local demo needs no environment variables. Supabase sync is not connected. Gemini calls use the key you provide and are subject to the quota, billing, and data terms for that Google project. The server applies a small in-memory request limit for the local prototype; a multi-instance deployment needs a shared rate limiter and user/session identity.
