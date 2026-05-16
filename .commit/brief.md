# Core Intent

PROBLEM: Korean learners get bored of textbook English apps; this gives them a 10-minute daily voice chat with an MZ-style character avatar that teaches trendy expressions in context.

FEATURES:
- Voice-only realtime conversation with a 3D talking avatar (STT → LLM → TTS → lip-sync)
- Character + topic picker (3 personas × multiple situational topics like cafe, shopping, friends-chat)
- Session logging of learned expressions with review/stats pages (attendance, learned_expressions, learning_sessions tables)

TARGET_USER: Korean English-beginner adults (likely 20s–30s) who want short, low-pressure daily speaking practice with a friend-like persona rather than a tutor.

# Stack Fingerprint

RUNTIME: Node 20 + TypeScript 5 (Vite dev server); Deno for edge functions

FRONTEND: React 18 + Vite 5 + Tailwind v3 + shadcn/ui + @tanstack/react-query

BACKEND: Lovable Cloud (Supabase) — Postgres + Deno edge functions (9 functions: simli-chat, simli-session, simli-avatar, elevenlabs-scribe-token, elevenlabs-stt-token, elevenlabs-tts, mz-chat, openai-realtime-token, whisper-transcribe)

DATABASE: Postgres · 3 observed tables (attendance, learned_expressions, learning_sessions) · RLS status not verified in this session (metadata fetch failed)

INFRA: Lovable preview hosting (Vite build) · edge functions auto-deployed by platform · no separate CI

AI_LAYER: LLM chat completion (OpenAI gpt-4o-mini via simli-chat) drives character persona + Korean/English teaching prompt; alternate path uses Lovable AI Gateway (Gemini) in mz-chat

EXTERNAL_API: Simli (realtime talking-avatar video + lip-sync), ElevenLabs (Scribe v2 realtime STT + multilingual_v2 TTS, PCM 16kHz), OpenAI (chat completions), Lovable AI Gateway (Gemini fallback)

AUTH: ? — no auth UI observed in pages; tables appear to be unscoped (no user_id columns in inspected types). Likely single-user/anonymous right now.

SPECIAL: Audio pipeline pipes ElevenLabs PCM_16000 base64 → Simli `sendAudioData` for server-driven lip-sync (no browser audio playback of TTS directly); duration is estimated from byte length to flip a speaking state.

# Failure Log

## Failure 1

SYMPTOM: Character avatar produced loud noise / distorted audio instead of speech after wiring ElevenLabs → Simli.

CAUSE: `output_format: 'pcm_16000'` was passed in the JSON body of the ElevenLabs TTS call. ElevenLabs ignores it there and defaults to MP3, so MP3 bytes were fed into Simli's raw-PCM input pipe — hence noise.

FIX: Moved `output_format=pcm_16000` to the URL query string and switched model to `eleven_multilingual_v2` in `supabase/functions/simli-chat/index.ts`.

PREVENTION: Treat ElevenLabs format as a transport-level concern (query param), and keep a comment at the fetch site stating "output_format MUST be query param, not body" — already added.

## Failure 2

SYMPTOM: ElevenLabs Scribe token endpoint kept returning 401 even after the user added their key; AI initially hid the real HTTP status behind a generic "failed" toast.

CAUSE: Two ElevenLabs keys existed — the connector-managed `ELEVENLABS_API_KEY` and a user-supplied `ELEVENLABS_API_KEY_OVERRIDE`. The function was reading the connector key, which lacked the needed scope.

FIX: Both `elevenlabs-scribe-token` and `simli-chat` now read `ELEVENLABS_API_KEY_OVERRIDE` first and fall back to `ELEVENLABS_API_KEY`; the scribe hook also surfaces the real error message instead of swallowing it.

PREVENTION: Convention adopted — user-editable secrets use `_OVERRIDE` suffix and always win over connector-managed ones in edge functions.

# Decision Archaeology

## Decision 1

ORIGINAL_PLAN: Use OpenAI Realtime API (`openai-realtime-token` function still in tree) as the single voice loop.

REASON_TO_CHANGE: Needed a visible talking-head avatar with lip-sync, not just voice. Realtime alone gave audio but no synced face.

FINAL_CHOICE: Split pipeline — ElevenLabs Scribe (STT) + OpenAI chat completions (LLM) + ElevenLabs TTS (PCM) → Simli (avatar + lip-sync).

OUTCOME: Got the avatar, but added 3 API dependencies, 2 secrets to juggle, and latency from serial hops. Dead code (`openai-realtime-token`, `whisper-transcribe`, `elevenlabs-stt-token`) still sits in `supabase/functions/`.

## Decision 2

ORIGINAL_PLAN: Mixed UI — text chat input at the bottom plus voice.

REASON_TO_CHANGE: User explicitly asked to remove the text input and go voice-only ("밑에 채팅창은 없애도 된다. 온리 음성대화로만 진행하게해").

FINAL_CHOICE: Voice-only ChatPage; character also auto-greets on connect via a new `triggerInitialGreeting` path that calls `simli-chat` with `isGreeting: true`.

OUTCOME: Cleaner UX but no text fallback when STT mishears, and no transcript-only mode for noisy environments.

# AI Delegation Map

| Domain | AI % | Human % | Notes |
|--------|------|---------|-------|
| React Components / shadcn UI | 85 | 15 | Lovable agent scaffolded pages, human nudged copy |
| Edge Function code (Deno) | 80 | 20 | AI wrote fetches; human caught the PCM-in-body bug conceptually |
| Prompt engineering (character personas, topic teaching format) | 70 | 30 | Human set MZ tone + Korean teaching constraints |
| Realtime audio / Simli + ElevenLabs integration | 60 | 40 | Multiple AI loops failed before human-directed format fix |
| DB Schema (attendance, learned_expressions, learning_sessions) | 65 | 35 | AI proposed shape; RLS/auth still unfinished |
| Security / RLS Policies | 30 | 70 | Mostly unverified — flagged as gap |
| Design system (dark + green theme, rounded buttons) | 50 | 50 | Human owns brand rules in project knowledge |
| Debugging / decision arbitration | 20 | 80 | Human picked the override-secret strategy and voice-only pivot |

# Live Proof

DEPLOYED_URL: https://id-preview--e30137ab-045c-4d36-b796-3f9ad082a157.lovable.app (preview only, not published)

GITHUB_URL: ?

API_ENDPOINTS: Supabase edge functions under `https://jzvpmunbhxrdutnheafa.functions.supabase.co/` (simli-chat, simli-session, elevenlabs-scribe-token, etc.) — auth-gated by anon key

CONTRACT_ADDRESSES: ? (no on-chain component)

OTHER_EVIDENCE: ? — no published URL, no user metrics, screenshots not collected here

# Next Blocker

CURRENT_BLOCKER: technical — end-to-end voice loop is wired but unverified working in this session; specifically, lip-sync timing is faked from byte length, and there is no auth/RLS so per-user progress tracking (attendance, learned_expressions) cannot ship safely.

FIRST_AI_TASK: Add Supabase email auth + `user_id uuid references auth.users` columns to `attendance`, `learned_expressions`, `learning_sessions`, with RLS policies `auth.uid() = user_id` for select/insert/update, and a login gate on `/chat`.

# Integrity Self-Check

PROMPT_VERSION: commit-brief/v1.3

VERIFIED_CLAIMS:
- 9 edge functions exist (listed `supabase/functions/`)
- `simli-chat/index.ts` uses gpt-4o-mini + ElevenLabs `eleven_multilingual_v2` with `output_format=pcm_16000` as query param
- `ELEVENLABS_API_KEY_OVERRIDE` is preferred over `ELEVENLABS_API_KEY` (read in `simli-chat/index.ts` and per chat history in `elevenlabs-scribe-token`)
- `useSimliChat.ts` calls `triggerInitialGreeting` after connect and pipes base64 PCM into `simliClient.sendAudioData`
- Tables `attendance`, `learned_expressions`, `learning_sessions` exist (seen in `src/integrations/supabase/types.ts`)
- Pages exist: LandingPage, ChatPage, ReviewPage, StatsPage, SummaryPage, Index, NotFound
- Stack: React 18, Vite, Tailwind, shadcn/ui, @supabase/supabase-js, @elevenlabs/react, simli-client (package.json)

UNVERIFIABLE_CLAIMS:
- Whether the voice loop currently produces clean audio end-to-end (last fix not retested by human in this session)
- RLS policies present/absent — Supabase metadata fetch failed with internal error
- Existence of a GitHub remote, published URL, or any real users
- Whether characters actually map to distinct Simli faceIds (chat history notes all still default to `tmp9i8bbq7c`)
- Auth flow — no auth pages inspected

DIVERGENCES: The "Korean/English MZ teaching format" is implemented as a prompt string only; there is no structured curriculum, expression-extraction, or DB write from `simli-chat` back to `learned_expressions` — so the "logs learned expressions" feature claim is aspirational at the edge-function layer. User did not bias the template; template was filled as-is.

CONFIDENCE_SCORE: 6
