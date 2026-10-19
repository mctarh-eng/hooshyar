# Worklog - Hooshyar (هوش‌یار) AI Hub App

Project: Unified Persian AI hub (Next.js 16, App Router, RTL, PWA-ready, single-page at `/`).

---

Task ID: 1
Agent: main (Z.ai Code)
Task: Build the foundation: Persian font, RTL cheerful theme, database schema, PWA files, app icon, providers data, zustand store, hooks, query provider.

Work Log:
- Read project files (package.json, layout, globals.css, prisma schema) and confirmed deps: zustand, framer-motion, react-markdown, @tanstack/react-query, sharp, sonner, next-themes all preinstalled.
- Tested z-ai-web-dev-sdk capabilities with temp scripts:
  - `zai.chat.completions.create({stream:true})` WORKS: async iterable of Uint8Array chunks containing raw SSE text lines `data: {json}`; delta text at `json.choices[0].delta.content`.
  - TTS `zai.audio.tts.create({input, voice:'tongtong', response_format:'wav', stream:false})` WORKS with Persian text (returned 143KB wav).
  - Image gen CLI works.
- Downloaded Vazirmatn variable woff2 -> `src/fonts/Vazirmatn-Variable.woff2` (112KB).
- Generated app icon via z-ai CLI -> `public/icons/icon-1024.png`, resized with sharp to 512/192.
- Prisma schema: Conversation, Message (cascade delete), GeneratedImage; pushed to SQLite.
- `src/lib/providers.ts`: 10 AI providers (5 Iranian: hooshyar/aio/dorna/hoosha/maral + 5 global: chatgpt/claude/gemini/deepseek/grok) with id, name, emoji, gradient, tagline, specialties, persona (used in system prompt).
- `src/lib/store.ts`: zustand persisted store (view, activeConversationId, providerId, draftMessage, simulatedOffline, fontScale).
- `src/lib/offline-queue.ts`: localStorage-backed offline message queue (getQueue/enqueue/dequeue).
- `src/lib/types.ts`: ConversationSummary, ChatMessageData, ConversationDetail, ImageRecord.
- `src/lib/utils.ts`: added timeAgo/faTime/faDate/greetingByHour (fa-IR Intl).
- `src/hooks/use-online.ts`: useOnline + useIsConnected (respects simulatedOffline).
- `src/hooks/use-conversations.ts`: TanStack Query hooks: useConversationList, useConversationDetail, useDeleteConversation, useRenameConversation, useImageList, useDeleteImage, useClearConversations. Keys: ['conversations'], ['conversations', id], ['images'].
- `src/components/query-provider.tsx`, `src/components/sw-register.tsx` (SW only in production).
- `src/app/layout.tsx`: lang=fa dir=rtl, Vazirmatn local font (--font-vazir), ThemeProvider, QueryProvider, sonner Toaster, PWA metadata + viewport (themeColor #f59e0b, viewportFit cover).
- `src/app/globals.css`: warm cheerful light + dark theme (no blue/indigo), utilities: gradient-hero, text-gradient-warm, no-scrollbar, nice-scrollbar, typing-dot, soft-float, .md-answer markdown styles (RTL-aware), font-scale-sm/md/lg (sets --app-font-size on html).
- `public/manifest.json` (fa, rtl, standalone) + `public/sw.js` (precache shell, network-first navigation, cache-first static, never caches /api).

Stage Summary:
- Foundation complete. Next agents MUST reuse: getProvider(id) from lib/providers, useUIStore from lib/store, hooks from use-conversations, cn/timeAgo/faDate/greetingByHour from lib/utils, useIsConnected from use-online.
- API contract (being built in 2-b): POST /api/chat {conversationId?, content, providerId} -> SSE stream (lines `data: {...}` with {meta:{conversationId,providerId}} first, then {delta:"..."} chunks, then {done:true,title?,conversationId}); GET /api/conversations; GET/PATCH/DELETE /api/conversations/[id]; DELETE /api/conversations (clear all); POST/GET /api/image; GET/DELETE /api/image/[id] (GET returns image bytes); POST /api/tts {text} -> audio/wav bytes.

---

Task ID: 2-a
Agent: frontend-styling-expert
Task: Build shell UI components (header, bottom nav, offline banner, home view, history view, settings view)

Work Log:
- Read worklog (Task 1) and reused foundation EXACTLY: useUIStore (lib/store), PROVIDERS/getProvider (lib/providers), useIsConnected/useOnline (hooks/use-online), conversation hooks (hooks/use-conversations), cn/timeAgo/faDate/greetingByHour (lib/utils), types (lib/types), utilities from globals.css (gradient-hero, soft-float, no-scrollbar, font-scale-*).
- Created `src/components/app-header.tsx`: sticky top-0 z-40 header, backdrop-blur bg-background/80 border-b, max-w-3xl; logo (next/image /icons/icon-192.png 36px rounded-xl) + «هوش‌یار» + subtitle (hidden below sm); end side: connection Badge «آنلاین» (emerald ping dot) / «آفلاین» (rose + WifiOff), gear IconButton -> setView('settings') aria-label «تنظیمات», theme toggle (next-themes, sun/moon) with hydration-safe mounted guard.
- Created `src/components/bottom-nav.tsx`: fixed bottom-0 inset-x-0 z-40, max-w-3xl, bg-background/85 backdrop-blur border-t, safe-area paddingBottom max(0.5rem, env(safe-area-inset-bottom)); 4 tabs (خانه/گفتگو/تصویر/تاریخچه) with motion layoutId="nav-pill" gradient pill (from-primary/15 to-accent), Persian aria-labels, setView on click.
- Created `src/components/offline-banner.tsx`: AnimatePresence height-animated banner when !useIsConnected(); amber-400→orange-400 gradient, dark amber-950 text, WifiOff + «آفلاین هستی! پیام‌هات ذخیره می‌شن و به‌محض اتصال ارسال می‌شن», session-dismiss «بستن» X button (local state).
- Created `src/components/home-view.tsx`: (1) gradient-hero rounded-3xl hero with soft-float greeting emoji, greetingByHour text, faDate subtitle, one-liner, 2 white/20 backdrop CTAs («شروع گفتگو» startNewChat, «ساخت تصویر» setView('image')); (2) snap horizontal no-scrollbar capability row (گفتگوی هوشمند 💬 / تصویرسازی 🎨 / گفتار صوتی 🔊 / به‌زودی: جستجوی وب 🔍 with Badge + opacity-60); (3) shadcn Tabs «همه/ایرانی 🇮🇷/بین‌المللی 🌍» + grid-cols-2 sm:grid-cols-3 provider cards (gradient emoji avatar h-12 w-12, name, ltr latinName, tagline line-clamp-2, 2 specialty chips, motion whileHover y:-3) -> setProviderId + startNewChat + toast.success(`با «name» شروع کردی!`); (4) 6 suggestion cards -> askSuggestion; footer «ساخته شده با ❤️ برای کاربران فارسی‌زبان».
- Created `src/components/history-view.tsx`: title + fa-IR count Badge; rounded-full search Input (Search icon at start) filtering title+lastMessage; useConversationList with 4 Skeletons loading; empty/error cute state (🗂️ / 🔍 + «شروع اولین گفتگو» button); rows: gradient provider avatar, title/lastMessage line-clamp-1, timeAgo(updatedAt), ChevronLeft, row click -> openConversation(id), DropdownMenu (MoreVertical, stopPropagation) with «تغییر نام» (Dialog + Input + useRenameConversation + toast «نام عوض شد ✅») and destructive «حذف» (AlertDialog + useDeleteConversation + toast «حذف شد 🗑️»).
- Created `src/components/settings-view.tsx`: card sections (rounded-2xl border bg-card p-6): a) «ظاهر» theme segmented control (روشن ☀️/تاریخی 🌙/سیستم 💻, motion layoutId="theme-pill", next-themes setTheme) + font-size segmented (کوچک/متوسط/بزرگ -> setFontScale, layoutId="font-pill", useEffect applies font-scale-sm/md/lg to documentElement); b) «اتصال» real device status (useOnline) + app status (useIsConnected) Badges + Switch «شبیه‌سازی قطع اینترنت» -> setSimulatedOffline with toast.info; c) «نصب برنامه» beforeinstallprompt capture in useEffect + prompt()/userChoice, disabled fallback hint; d) «داده‌ها» local-storage info row + destructive «پاک کردن همه گفتگوها» AlertDialog -> useClearConversations; e) «درباره هوش‌یار» icon 56px, «نسخه ۱٫۰٫۰» Badge, description, «آماده بازار»/«آماده مایکت» Badges. Back button (ArrowRight) -> setView('home').
- Hydration safety: time-dependent hero (greeting/faDate) and theme/mounted guards use a useSyncExternalStore-based useMounted() (server=false → client=true) instead of setState-in-effect, satisfying the new react-hooks/set-state-in-effect lint rule.
- Verified with `bun run lint` (clean exit, 0 problems) and `bunx tsc --noEmit` (no errors in src/; only pre-existing errors in examples/ + skills/).

Stage Summary:
- Created exactly 6 files: src/components/{app-header,bottom-nav,offline-banner,home-view,history-view,settings-view}.tsx. No other files touched (layout.tsx, page.tsx, globals.css, api/, chat-view, image-studio, provider-picker untouched).
- All are named exports: <AppHeader/>, <BottomNav/>, <OfflineBanner/>, <HomeView/>, <HistoryView/>, <SettingsView/>, each self-contained 'use client' components needing no props.
- Integration notes for page.tsx (2-c): render <AppHeader/> at top, then <OfflineBanner/> directly under it (it animates height in-flow), then a <main className="mx-auto max-w-3xl pb-28"> that switches on useUIStore view: 'home'-><HomeView/>, 'chat'->ChatView (2-b), 'image'->ImageStudio (2-b), 'history'-><HistoryView/>, 'settings'-><SettingsView/> (wrap in AnimatePresence mode="wait" if desired), and finally <BottomNav/> fixed at bottom. Page must own the pb-28 bottom padding so content never hides under the fixed nav. Views already include their own max-w-3xl px-4 containers; settings is reachable only via header gear (has its own back button).
- Bottom-nav/chat/image interplay: clicking a home provider card calls setProviderId + startNewChat (draft null) and suggestions call askSuggestion(text) which sets draftMessage — ChatView (2-b) should read draftMessage once on mount then clearDraft().


---
Task ID: 2-b
Agent: main (Z.ai Code)
Task: Backend API routes (streaming chat, conversations CRUD, image gen, TTS) + ChatView + ImageStudio + queue flusher

Work Log:
- Built /api/chat: validates input, creates/fetches conversation, saves user message, builds persona system prompt (fa), streams from z-ai SDK (stream:true yields Uint8Array SSE chunks), re-parses upstream SSE and re-emits clean SSE to client: meta -> delta* -> done (with auto-generated Persian title for first exchange, saved to DB). CRITICAL FIX: pump logic must be fire-and-forget inside start(controller) (NOT awaited) - awaiting start() prevents chunk flushing.
- /api/conversations GET (list w/ lastMessage + count) and DELETE (clear all); /api/conversations/[id] GET/PATCH/DELETE with params as Promise (Next 16).
- /api/image POST (validates size; translates Persian prompts to English via LLM first because the image service content-filter rejects Persian text; saves base64 to DB) + GET metadata list; /api/image/[id] GET returns PNG bytes (immutable cache) + DELETE.
- /api/tts POST: zai.audio.tts.create voice tongtong, wav bytes (works with Persian, clips at 1000 chars).
- ChatView: streaming fetch reader with SSE parse, offline queueing via lib/offline-queue, stop button (AbortController), retry, auto-scroll with stick-to-bottom, ProviderPicker sheet, draft-message flow from home suggestions, history load guarded by streamingRef + refreshTick.
- ChatMessage: RTL bubbles (user left, assistant right with gradient avatar), react-markdown + remark-gfm with .md-answer styles, copy + TTS speak buttons, queued/error states, fa-IR timestamps.
- ImageStudio: prompt + size (3 options) + style chips (English suffix map), rotating fun loading texts, gallery grid with zoom dialog, download, delete, "re-generate with same idea".
- QueueFlusher (global, in page.tsx): flushes offline queue on connectivity transition OR app-load catch-up, drains SSE, invalidates conversations query, bumps refreshTick if active conversation touched.
- page.tsx: RTL app shell - AppHeader, OfflineBanner (hidden in chat), AnimatePresence view switch, BottomNav (hidden in chat - focused mode), font-scale effect.

Stage Summary:
- Bugfixes: undeclared sawConversationId/hadError vars crashed the stream handler (lint missed it, tsc caught it); faTime crash on invalid dates (now defensive); ChatMessageVM got createdAt. remark-gfm installed.

---
Task ID: 3
Agent: main (Z.ai Code)
Task: Final integration + lint

Work Log:
- page.tsx assembly with all 5 views; QueueFlusher global mount.
- Fixed tsc errors: chat route conversation typing (select id only), image route size union type (SUPPORTED_SIZES as const + find).
- bun run lint -> 0 problems; bunx tsc --noEmit -> 0 errors in src/.

Stage Summary:
- App fully integrated: single page, 5 views, 8 API routes, RTL Persian everywhere.

---
Task ID: 4
Agent: main (Z.ai Code)
Task: End-to-end browser verification with agent-browser + fixes

Work Log:
- Home renders (hero gradient, Persian date/greeting, capability cards, provider tabs/grid, suggestions). Verified desktop + iPhone 14 viewport.
- Golden path: suggestion click -> auto-send -> STREAMING assistant reply rendered with markdown, provider avatar, copy/speaker buttons. Conversation continuity verified (follow-up English sentence) + auto Persian titles.
- Provider switch mid-chat (Grok) works - joke response with new persona.
- TTS button plays Persian wav (state toggles to stop icon).
- Image studio: content-filter initially rejected ALL Persian prompts (error toast worked correctly); FIXED via automatic LLM Persian->English prompt translation; verified 3 images generated incl. one from UI.
- Dark theme verified (warm stone). Offline simulator: header badge flips, banner shows, message queues with "منتظر اتصال" badge, reconnect flushes queue globally (2 POSTs verified in server log, queue emptied, AI reply saved).
- History view: search, auto-titles, counts, relative times. Final dev.log check: no runtime errors.

Stage Summary:
- All golden paths verified in real browser (desktop + mobile, light + dark). App is production-ready for PWA wrapping (TWA/Capacitor) for Bazaar/Myket distribution.

---
Task ID: 5
Agent: main (Z.ai Code)
Task: Post-continuation final verification (new session - "اضافه کن برام")

Work Log:
- Confirmed dev server running on :3000 (200 OK) and `bun run lint` clean (0 problems).
- Read dev.log: chat SSE, image generation, TTS and conversations flows all logging 200s, no runtime errors.
- Agent-browser end-to-end re-verification:
  - Home view: RTL hero, greeting «صبح بخیر!», fa-IR date, capability cards, 10 provider cards, tabs, suggestions all render.
  - Golden path: «شروع گفتگو» -> typed «سلام! خودت رو در دو جمله معرفی کن» -> streamed Persian reply with copy/speaker buttons and fa timestamps.
  - History: 14 conversations listed with auto Persian titles, avatars, relative times.
  - Image studio: prompt/size/style controls + gallery with 3 saved images.
  - Settings: theme + font scale segmented controls, connection section.
  - Zero console errors / zero page errors. iPhone 14 viewport renders correctly (RTL, bottom nav, safe layout).

Stage Summary:
- App re-verified end-to-end after session continuation; no regressions found. هوش‌یار is complete and production-ready for PWA/TWA wrapping toward Bazaar/Myket publishing.

---
Task ID: 6
Agent: main (Z.ai Code)
Task: Android APK pipeline (Capacitor) + GitHub Actions CI + Persian APK guide

Work Log:
- Verified environment: git 2.47.3 + existing .git repo, github.com reachable (api.github.com 403 was shared-IP rate limit only), Java 21 present locally (no Android SDK -> CI build is the right path).
- Installed @capacitor/cli@8.5.3, @capacitor/core, @capacitor/android, @capacitor/assets (dev deps).
- capacitor.config.ts: appId ir.hooshyar.app, appName هوش‌یار, webDir public, server.url from CAP_SERVER_URL env (fallback placeholder), cleartext:false, errorPath offline.html, SplashScreen plugin warm colors.
- bunx cap add android -> full Gradle project (JDK 17 compatible, compileSdk 36, Gradle 8.14.3).
- Generated adaptive icons + splash (light/dark, all densities, 38 files) from public/icons/icon-1024.png via @capacitor/assets + sharp-made 2732x2732 splash sources in assets/.
- public/offline.html: RTL Persian offline fallback (matches app theme, reload button) used by server.errorPath.
- android/app/build.gradle: conditional release signing via android/keystore.properties (storeFile/storePassword/keyAlias/keyPassword) - only active when file exists.
- android/.gitignore: added keystore.properties, *.keystore, *.jks (never commit secrets).
- .github/workflows/build-apk.yml (12 steps, YAML-validated): push(main)/tags/workflow_dispatch -> JDK17 + Bun -> bun install --frozen-lockfile -> cap sync (CAP_SERVER_URL from repo Variables) -> gradlew assembleDebug -> optional signed assembleRelease+bundleRelease when secrets present -> artifacts "hooshyar-apk" (retention 30d) -> GitHub Release on v* tags. Warns in step summary if CAP_SERVER_URL unset.
- public/offline.html + package.json scripts (cap:sync, cap:android) + docs/APK-GUIDE.md (full Persian guide: fine-grained PAT steps, artifact download, CAP_SERVER_URL variable, keystore signing for stores, Bazaar/Myket notes).
- bun run lint: 0 problems. Committed everything: 05ce096.

Stage Summary:
- Repo is 100% ready to push to GitHub. Once user provides a fine-grained PAT (admin:repo create + contents write + actions write), I: create repo -> push -> workflow auto-builds APK -> user downloads artifact. Signing works when they add the 4 keystore secrets. Web app still needs deployment (CAP_SERVER_URL) for the APK to reach its AI backend.

---
Task ID: 7
Agent: main (Z.ai Code)
Task: GitHub connection, repo creation, live APK build & release

Work Log:
- User provided classic PAT (scopes: repo, workflow) -> authenticated as mctarh-eng. No existing repos found (user mentioned a different name but had created nothing yet).
- Safety pass before push: untracked .env + db/custom.db (user data/secrets), added *.db + db/custom.db to .gitignore, committed.
- Created PUBLIC repo mctarh-eng/hooshyar (offered instant rename), pushed main (193 files) -> workflow auto-triggered.
- Run#1 failed at parse (secrets context not allowed in step-level if) -> FIXED via job-level env HAS_KEYSTORE + permissions:contents:write.
- Run#2 failed at gradle: "invalid source release: 21" (Capacitor 8 needs JDK 21) -> FIXED: setup-java 21.
- Run#3 SUCCESS: artifact hooshyar-apk 6.0MB (30d retention). Downloaded & verified: valid APK w/ signing block, 19 icons, 30 splash resources, 465 entries.
- Tagged v1.0.0 -> run#4 SUCCESS -> GitHub Release v1.0.0 with hooshyar-debug.apk (6.7MB, public direct download).
- Remote/token not persisted in git config (pushed via inline credential URL).

Stage Summary:
- Live deliverables: repo https://github.com/mctarh-eng/hooshyar ; Release APK https://github.com/mctarh-eng/hooshyar/releases/download/v1.0.0/hooshyar-debug.apk
- Remaining for production: deploy web app -> set repo Variable CAP_SERVER_URL -> re-run workflow; add 4 keystore secrets for signed release/AAB; rename repo on request.

---
Task ID: 8
Agent: main (Z.ai Code)
Task: Fix launcher icon + rich Persian GitHub README + Release v1.0.1

Work Log:
- Root-caused "app has no icon": android adaptive icon foreground/background were still the default Capacitor blue logo on white (capacitor-assets had only replaced legacy PNGs). On modern Android launchers the adaptive icon wins -> generic look.
- Built scripts/make-icons.ts: programmatic brand SVG (warm gradient #FBBF24->#F97316->#EC4899 + white 4-point sparkle marks, all inside adaptive safe zone r<=338/1024). Outputs icon-only/foreground/background + 2732 splash (light/dark, rounded tile) + web icons + public/logo.svg.
- Ran make-icons + capacitor-assets -> 74 android resources regenerated; verified adaptive XML now insets @mipmap/ic_launcher_background (gradient PNG) + sparkle foreground.
- Web icon cache saga: Next.js .next/cache/images purge + dev-server restart were NOT enough (browser kept stale decoded bitmap keyed by URL). Fix: cache-busted all icon refs to ?v=2 (app-header, layout metadata, manifest.json, sw.js) and bumped SW cache to hooshyar-v2. next/image rejects local query strings -> switched header logo to plain <img> (36px decorative).
- Dev server restart learned: only `setsid nohup bash .zscripts/dev.sh` survives tool-call boundaries (bare nohup bun run dev gets reaped).
- Retook 5 README screenshots (home, home-dark, chat with live streamed reply, image studio, iPhone 14 mobile) with fresh branding.
- README.md: full Persian docs (badges, screenshots, features, 10-provider table, APK download, dev quickstart, CAP_SERVER_URL + signing secrets tables, architecture ASCII, structure tree, roadmap, FAQ). LICENSE: MIT. Repo topics (ai, android, persian, ...) + homepage set via API.
- Pushed main -> run#5 SUCCESS. Downloaded artifact and VERIFIED inside APK: mipmap-xxxhdpi ic_launcher.png + adaptive foreground/background are the new sparkle brand.
- Tagged v1.0.1 -> run#6 SUCCESS -> Release published.

Stage Summary:
- Live: https://github.com/mctarh-eng/hooshyar/releases/download/v1.0.1/hooshyar-debug.apk (4.9MB, correct branded launcher icon incl. adaptive layers).
- Icon pipeline now reproducible: bun scripts/make-icons.ts && bunx capacitor-assets generate --android.
