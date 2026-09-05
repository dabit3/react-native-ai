[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/dabit3/react-native-ai)

# React Native AI

A quiet workspace for conversations and images. Built with Expo, React Native, and a TypeScript server. Runs on iOS, Android, and the web.

## The experience

- **One conversation, many models.** Switch providers without losing the conversation context. Search models by name, provider, speed, or vision support.
- **A focused interface.** A desktop sidebar, mobile navigation, readable typography, light and dark modes, and three subtle color variants.
- **Responsive chat.** Batched streaming updates, virtualized messages, stop and retry controls, Markdown, copy, read aloud, and transcript export.
- **An image studio.** Generate images, use up to four references, choose a frame and visual style, and refine a result with a new prompt.
- **Local history.** Rename, search, and remove conversations. Browse generated images, inspect them, and save or share them.
- **Clear connection status.** Configure the server address in Settings. The model picker shows which providers have server keys.

Provider status reflects key configuration, not successful authentication, billing, or model access. The provider account must permit the selected model.

## Run locally

Use Node.js 22.6 or later. CI uses Node.js 22 and pnpm 10. The checked-in pnpm lockfiles define the dependency versions.

### Server

```sh
cd server
pnpm install --frozen-lockfile
cp .env.example .env
```

Add at least one provider key to `server/.env`. Then start the server:

```sh
pnpm build
pnpm dev
```

The server listens on port `3050` by default. `GET /health` returns its status. `GET /models` returns the public model registry.

### App

In a separate terminal:

```sh
cd app
pnpm install --frozen-lockfile
pnpm web
```

Open **Settings → Your AI connection**. Enter `http://localhost:3050` and select **Save connection**.

You can also configure the default address through `app/.env`, using the variables in `app/.env.example`.

For native development builds:

```sh
pnpm ios
pnpm android
```

Use your computer’s network address or an HTTPS tunnel on a physical phone. `localhost` on a phone refers to the phone itself. The Android emulator uses `http://10.0.2.2:3050` to reach the host.

Camera access, photo saving, and native sharing require device permissions. Use a development build to verify native media features. Expo Go can restrict photo library access.

If your package manager blocks dependency build scripts, review its approval prompt. Do not disable your dependency security policy.

## Model choices

The server registry is the source of truth. The app includes an offline catalog so model discovery remains available before connection.

| Provider | Conversation models | Server variable |
| --- | --- | --- |
| Anthropic | Claude Sonnet 5, Opus 5, Fable 5, Haiku 4.5 | `ANTHROPIC_API_KEY` |
| OpenAI | GPT-5.5, GPT-5.4 mini | `OPENAI_API_KEY` |
| Google | Gemini 3.5 Flash, Gemini 3.1 Pro (preview) | `GEMINI_API_KEY` |
| Z.ai | GLM 5.2 | `ZAI_API_KEY` |
| Moonshot | Kimi K2.6 | `MOONSHOT_API_KEY` |

GLM 5.2 is text-only in this app. The other catalog entries support images. Kimi K2.6 uses non-thinking mode for this conversational interface.

| Image model | Provider | Features |
| --- | --- | --- |
| Nano Banana 2 | Google | Generation and reference-based edits |
| Nano Banana Pro | Google | Detailed compositions and reference-based edits |
| GPT Image 2 | OpenAI | Generation, typography, and reference-based edits |

Image frames: `1:1`, `3:2`, `2:3`, `16:9`, and `9:16`. OpenAI image output uses medium quality. Image models can require separate account access or organization verification.

Model identifiers were checked against provider documentation during this rewrite. Provider catalogs and retirement dates can change. Update `server/src/models.ts` to change the live catalog. Update `app/constants.ts` to keep its offline catalog aligned.

Existing provider-specific chat routes remain available. The previous Gemini image route also remains available for compatible clients.

## Images and storage

- Attach JPEG, PNG, or WebP images. Large source images resize to a maximum edge of 2,048 pixels before upload.
- Each optimized image must fit within 4 MB. Image types are detected from their bytes, not just file names.
- A chat request supports up to four images across its conversation context.
- The image studio supports up to four reference images per request.
- Native image files use the app’s document directory. Web images use IndexedDB blobs.
- Conversation and gallery metadata use AsyncStorage. Image bytes are not serialized into conversation metadata.
- Previous `rnai-chats-v1` histories migrate without removing the original data. Old temporary image files can be unavailable after migration.
- Malformed saved histories are not overwritten. Storage errors appear in the app.
- Removing a creation removes it from the collection. Its underlying image can remain in local storage for existing references.

Chat context is bounded to the most recent 80 messages and 100,000 text characters. Older messages remain in local history. The app shows a notice when older context is omitted.

Drafts remain available while you switch screens or conversations during the current session. Drafts do not survive an app restart.

## Privacy and deployment

Provider keys stay on the server. Never put provider keys in `EXPO_PUBLIC_*` variables.

For a deployed server:

1. Set `API_AUTH_TOKEN` or replace the auth middleware with your identity provider.
2. Set `CORS_ORIGIN` to your web app origin.
3. Use HTTPS.
4. Set a suitable `RATE_LIMIT_PER_MINUTE` and enforce provider spending limits.
5. Configure proxy timeouts for streaming requests.

Enter the server token in the app’s Settings. This token stays in memory and is not persisted. The built-in shared token is suitable for a private deployment, not a complete multi-user authentication system.

Conversations and images are local and unencrypted. Requests pass through your server to the selected provider. Provider retention policies apply. No cross-device synchronization is included.

The proxy validates request sizes, image types, and image signatures. It cancels upstream requests on client disconnect and limits request duration. Cancellation cannot guarantee that the provider stops billing work already started.

## Verification

### App

```sh
cd app
pnpm typecheck
pnpm lint
pnpm test
pnpm build:web
pnpm exec playwright install chromium
pnpm test:e2e
```

Browser tests use mocked provider responses. They cover desktop and mobile layouts, model changes, persistence, retries, cancellation, vision uploads, and image editing. They do not incur provider charges.

Native JavaScript bundle checks:

```sh
pnpm exec expo export --platform ios --platform android --output-dir dist-native
```

A successful bundle export does not replace native device tests or live provider tests.

### Server

```sh
cd server
pnpm typecheck
pnpm test
pnpm build
```

Server tests cover provider normalization, stream framing, disconnect cancellation, request validation, model availability, and image generation and editing.

## Project layout

```text
app/
  App.tsx                   Settings, fonts, registry, and theme providers
  constants.ts              Offline model catalog
  src/main.tsx              Responsive navigation and conversation history
  src/screens/              Chat, image studio, and settings
  src/hooks/                Streaming and local persistence
  src/mediaStore.ts         Native image files
  src/mediaStore.web.ts     Browser image blobs
  tests/                    Unit and browser tests
server/
  src/models.ts             Provider models and capabilities
  src/provider.ts           Request lifetimes and normalized streaming
  src/chat/                 Provider request adapters
  src/images/               Generation and editing adapters
  src/types.ts              Request schemas and image validation
cli/
  cli.js                    Project scaffolding
```

The client uses native React Native controls and one shared theme system. It does not require a navigation framework, bottom-sheet runtime, or animation engine.
