# NutriLens

AI-powered dark-mode nutrition tracker that uses your camera to identify food, calculate macros, and coach you with personalized advice.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mobile run dev` — run the Expo app (port from $PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- Required env: `OPENAI_API_KEY` — OpenAI API key for food analysis, coaching, TTS

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54, React Native 0.81.5, Expo Router 6
- API: Express 5 + OpenAI SDK
- DB: None (AsyncStorage for offline-first diary data)
- State: NutritionContext (React Context + AsyncStorage)
- Charts: react-native-svg (custom SVG bar + ring components)
- Codegen: Orval from OpenAPI spec → React Query hooks

## Where things live

- `artifacts/mobile/` — Expo React Native app
  - `app/(tabs)/index.tsx` — Daily diary (macro rings, food log)
  - `app/(tabs)/camera.tsx` — AI food scanner + barcode lookup
  - `app/(tabs)/history.tsx` — Weekly bar charts + streak
  - `app/(tabs)/coach.tsx` — Voice AI coach + meal suggestions
  - `context/NutritionContext.tsx` — All nutrition state + AsyncStorage
  - `constants/colors.ts` — Dark navy/emerald theme tokens
  - `components/MacroRing.tsx` — Animated SVG progress ring
  - `components/WeeklyChart.tsx` — SVG 7-day bar chart
- `artifacts/api-server/` — Express 5 backend
  - `src/routes/nutrition.ts` — `/analyze`, `/barcode`, `/coach`, `/suggest`
- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-client-react/` — Generated React Query hooks

## Architecture decisions

- **Offline-first**: All diary data in AsyncStorage — no backend DB needed, works with no internet.
- **AI-only vision**: Food analysis via GPT-4o vision; barcode lookup tries Open Food Facts first, falls back to GPT-4o-mini.
- **Dark-only theme**: `useColors()` always returns the dark palette. `app.json` sets `userInterfaceStyle: "dark"`.
- **No expo-camera**: Photo capture uses expo-image-picker (camera + gallery); barcode mode uses a keypad UI sending to Open Food Facts / GPT.
- **Graceful AI fallback**: All AI routes return sane defaults on failure; frontend shows alert with retry option.

## Product

NutriLens helps users track daily nutrition by photographing meals (AI identifies food + macros), scanning barcodes, viewing macro progress rings and weekly history charts, getting AI coaching advice, and receiving personalized meal suggestions based on remaining macro targets.

## User preferences

- Dark navy + emerald green theme throughout
- App name: NutriLens, package: com.nutrilens.app
- No light mode — dark-only experience

## Gotchas

- Base64 image payloads can be large — Express body limit is set to 20mb.
- `useColors()` always returns dark theme (NutriLens is dark-only; OS color scheme is ignored).
- SVG progress ring uses `<G transform="rotate(-90, cx, cy)">` for web compatibility — do NOT use the `rotation`/`origin` props directly on `<Circle>` (breaks on web).
- `EXPO_PUBLIC_DOMAIN` env var must be set at workflow start for API calls to work (handled by the workflow config).
