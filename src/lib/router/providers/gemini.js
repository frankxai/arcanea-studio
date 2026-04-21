/**
 * @file Gemini NB2 provider — real implementation.
 *
 *  Model: `gemini-3.1-flash-image-preview` (Google's Nano Banana 2 / AI Studio
 *  image generation surface, Arcanea's default for t2i + i2i per product memory
 *  nb2_default.md). Endpoint is the public generativelanguage.googleapis.com
 *  v1beta REST API so we don't pull the @google/genai SDK into the Electron
 *  renderer.
 *
 *  Supports:
 *    • generateImage   (text → image)
 *    • generateI2I     (image + text → image, multi-reference)
 *
 *  Unsupported (throws with a hint to switch back to muapi for that task):
 *    • video.* and lipsync — Gemini image API does not do video.
 *    • V2V / file uploads — no equivalent surface.
 */

const GEMINI_MODEL = 'gemini-3.1-flash-image-preview';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function aspectToGemini(ar) {
    const map = {
        '1:1': '1:1',
        '16:9': '16:9',
        '9:16': '9:16',
        '4:3': '4:3',
        '3:4': '3:4',
        '3:2': '3:2',
        '2:3': '2:3',
        '21:9': '21:9',
    };
    return map[ar] || '1:1';
}

async function urlToInlinePart(imageUrl) {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Gemini: failed to fetch reference image (${res.status})`);
    const blob = await res.blob();
    const mimeType = blob.type || 'image/png';
    const buf = await blob.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);
    return { inline_data: { mime_type: mimeType, data: base64 } };
}

function extractImageUrl(data) {
    const candidates = data?.candidates || [];
    for (const c of candidates) {
        const parts = c?.content?.parts || [];
        for (const p of parts) {
            const inline = p.inline_data || p.inlineData;
            if (inline?.data) {
                const mime = inline.mime_type || inline.mimeType || 'image/png';
                return `data:${mime};base64,${inline.data}`;
            }
        }
    }
    return null;
}

export class GeminiProvider {
    constructor() {
        this.id = 'gemini';
        this.label = 'Google Nano Banana 2';
    }

    getKey() {
        const key = window.__GEMINI_KEY__ || localStorage.getItem('gemini_key');
        if (!key) throw new Error('Gemini API key missing. Add it in Settings (localStorage.gemini_key).');
        return key;
    }

    async _callGenerate(parts, aspectRatio) {
        const key = this.getKey();
        const body = {
            contents: [{ parts }],
            generationConfig: {
                responseModalities: ['IMAGE'],
                imageConfig: { aspectRatio: aspectToGemini(aspectRatio) },
            },
        };
        console.log('[Gemini] ->', GEMINI_ENDPOINT, body);
        const res = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': key,
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`Gemini request failed: ${res.status} ${res.statusText} — ${errText.slice(0, 200)}`);
        }
        const data = await res.json();
        const url = extractImageUrl(data);
        if (!url) throw new Error('Gemini returned no image data in candidates[*].content.parts[*].inline_data.');
        return { url, raw: data };
    }

    async generateImage(params) {
        const prompt = params?.prompt || '';
        if (!prompt.trim()) throw new Error('Gemini generateImage: prompt is required.');
        const parts = [{ text: prompt }];
        if (params.image_url) parts.push(await urlToInlinePart(params.image_url));
        return this._callGenerate(parts, params.aspect_ratio);
    }

    async generateI2I(params) {
        const prompt = params?.prompt || '';
        const refs =
            params.images_list?.length > 0 ? params.images_list : params.image_url ? [params.image_url] : [];
        if (refs.length === 0) throw new Error('Gemini generateI2I: at least one reference image is required.');
        const parts = [{ text: prompt || 'Edit this image.' }];
        for (const url of refs) parts.push(await urlToInlinePart(url));
        return this._callGenerate(parts, params.aspect_ratio);
    }

    _notSupported(kind) {
        return () =>
            Promise.reject(
                new Error(
                    `Gemini provider does not support ${kind}. Switch Active Provider to 'muapi' in ` +
                        `Settings for ${kind} workflows, or add the per-task override ` +
                        `localStorage.arcanea.router.taskMap['${kind}'] = 'muapi'.`,
                ),
            );
    }

    generateVideo = this._notSupported('video.t2v');
    generateI2V = this._notSupported('video.i2v');
    processV2V = this._notSupported('video.v2v');
    processLipSync = this._notSupported('video.lipsync');

    uploadFile() {
        return Promise.reject(
            new Error(
                'Gemini provider has no file-upload endpoint — the router auto-falls-back to muapi for file.upload.',
            ),
        );
    }

    getDimensionsFromAR(ar) {
        switch (ar) {
            case '1:1': return [1024, 1024];
            case '16:9': return [1280, 720];
            case '9:16': return [720, 1280];
            case '4:3': return [1152, 864];
            case '3:2': return [1216, 832];
            case '21:9': return [1536, 640];
            default: return [1024, 1024];
        }
    }
}
