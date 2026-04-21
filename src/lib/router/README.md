# Arcanea Studio Router

Provider-agnostic dispatcher for the four studios (Image / Video / LipSync / Cinema). Muapi is the default; Gemini NB2 is live for image workflows; Fal and Replicate are stubs.

## Files

| Path | Role |
|---|---|
| `types.js` | `ProviderId`, `TaskClass`, settings shape, labels |
| `index.js` | `ArcaneaStudioRouter`, provider dispatch, logging, fallback |
| `providers/muapi.js` | Muapi transport — extracted verbatim from the original `MuapiClient`. Default for every task. |
| `providers/gemini.js` | Google `gemini-3.1-flash-image-preview` (NB2). Real t2i + i2i; throws `NotSupported` on video. |
| `providers/stub.js` | Template for Fal / Replicate (NotImplemented until wired). |

## How dispatch resolves

```
params.provider                              1. per-call override
  ↓
localStorage 'arcanea.router' .taskMap[x]    2. per-task override
  ↓
localStorage 'arcanea.router' .activeProvider 3. current global pick
  ↓
DEFAULT_PROVIDER = 'muapi'                   4. safety net
```

Every dispatch logs `[Router] <task> -> <provider>` so the console shows routing in real time.

## Activating Gemini NB2

```js
// 1) Set the key
localStorage.setItem('gemini_key', 'AIza...your key...');

// 2a) Globally prefer Gemini for image tasks:
localStorage.setItem(
  'arcanea.router',
  JSON.stringify({
    activeProvider: 'muapi', // keep muapi as fallback for video
    taskMap: {
      'image.t2i': 'gemini',
      'image.i2i': 'gemini',
    },
  }),
);

// 2b) Or flip globally (video calls will throw — see below):
localStorage.setItem(
  'arcanea.router',
  JSON.stringify({ activeProvider: 'gemini', taskMap: {} }),
);

// 3) Reload the page. Next image generation prints:
//    [Router] image.t2i -> gemini
//    [Gemini] -> https://generativelanguage.googleapis.com/...
```

## Provider capability matrix

| Task | muapi | gemini | fal | replicate |
|---|---|---|---|---|
| image.t2i | ✅ | ✅ | stub | stub |
| image.i2i | ✅ | ✅ | stub | stub |
| video.t2v | ✅ | ❌ throws | stub | stub |
| video.i2v | ✅ | ❌ throws | stub | stub |
| video.v2v | ✅ | ❌ throws | stub | stub |
| video.lipsync | ✅ | ❌ throws | stub | stub |
| file.upload | ✅ | → falls back to muapi | stub | stub |

Routing rule: set `taskMap['video.*'] = 'muapi'` whenever `activeProvider` is `gemini`, or leave `activeProvider = 'muapi'` and override only the image tasks (recommended).

## Per-call override

Studios can force a provider for a single call without touching settings:

```js
muapi.generateImage({ prompt: 'cosmic octopus', provider: 'gemini' });
```

## Adding a provider

1. Implement a class with the interface: `generateImage`, `generateVideo`, `generateI2I`, `generateI2V`, `processV2V`, `processLipSync`, `uploadFile`, `getDimensionsFromAR`.
2. Register it in `index.js` inside `this.providers = {...}`.
3. Add a label to `PROVIDER_LABELS` in `types.js`.
4. Document activation in this README.
