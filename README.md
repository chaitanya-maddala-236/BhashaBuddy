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
- The checked key stays in `sessionStorage` for the current tab. Tutor memory stays in that tab unless you sign in and opt into **Save tutor memory to this account** in Settings. Use **Clear memory** in a conversation to reset its context, or **Forget** in Settings to remove the key. The Gemini key is never included in cloud sync.
- Use the language selector in the app navigation to change the course language.

## Product scope

The app runs in guest mode without credentials or a database. Lesson records cover 30 days, with interactive phrase and recall activities. Sample phrase data and role-play replies are demonstration content; material is labelled for native-speaker review and is not represented as independently verified. Browser speech recognition availability depends on the browser and device. Raw audio is not retained by the app.

## Optional account and sync backend

The account backend is implemented in this Next.js app. It uses PostgreSQL for accounts, sessions, learner journals, and opted-in tutor memory. Passwords are stored as scrypt hashes; the browser receives an HTTP-only, same-site session cookie. Every account-data query is scoped to the signed-in user in the app's server routes. Guest mode still works when the database is not configured.

1. Run PostgreSQL locally or create a PostgreSQL database reachable by the app, then copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL` to the database connection string. The app creates its tables on first use; no Supabase account, email provider, or manual migration is needed.
3. Restart the app and open **Settings → Account & journal sync**. Create an account or sign in with an email and password. Passwords must be at least 10 characters.
4. After sign-in, choose whether to use an existing account journal or upload this device's journal.

Learning preferences, progress, and phrase bookmarks sync after you select a journal. Conversation transcripts sync only after you enable **Save tutor memory to this account**; turning that option off removes saved tutor memory. **Delete cloud journal and tutor memory** removes the synced data while leaving the account and this device's local journal intact. Conversation memory is limited to the most recent six exchanges for each language and scene.

For Render and Vercel deployments to share accounts, point both apps at the same PostgreSQL database using the provider's TLS-enabled connection string as the private `DATABASE_URL` environment variable. Do not prefix it with `NEXT_PUBLIC_`. The database must accept connections from both platforms. Use a pooled connection URL if your database provider offers one. The app's small in-process login throttle is suitable for a prototype; a multi-instance production service should move rate limiting to a shared store.

Password reset and email verification require a separate email-delivery service and are not included. Users can still sign in with the password they created. If the database is unavailable, local learning and tab-only tutor memory continue to work.

Gemini calls use the key you provide and are subject to the quota, billing, and data terms for that Google project. The server applies a small in-memory request limit for the local prototype; a multi-instance deployment needs a shared rate limiter and user/session identity.
