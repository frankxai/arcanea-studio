/**
 * @file ArcaneaStudioRouter — provider-agnostic dispatcher.
 *
 *  Goal: keep MuapiClient's method surface so the four studios
 *  (Image / Video / LipSync / Cinema) work unchanged, while we layer
 *  Arcanea's multi-provider stack in behind them.
 *
 *  Selection order:
 *    1. explicit `params.provider` argument (per-call override)
 *    2. localStorage `arcanea.router.taskMap[<taskClass>]`
 *    3. localStorage `arcanea.router.activeProvider`
 *    4. DEFAULT_PROVIDER (muapi)
 *
 *  The router never silently swaps providers; every call logs
 *  `[Router] <taskClass> -> <provider>` so the studio dashboard can
 *  visualize routing in real time.
 */

import { DEFAULT_PROVIDER, TASK_CLASSES } from './types.js';
import { MuapiProvider } from './providers/muapi.js';
import { StubProvider } from './providers/stub.js';

const SETTINGS_KEY = 'arcanea.router';

function readSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return { activeProvider: DEFAULT_PROVIDER, taskMap: {} };
        const parsed = JSON.parse(raw);
        return {
            activeProvider: parsed.activeProvider || DEFAULT_PROVIDER,
            taskMap: parsed.taskMap || {},
        };
    } catch {
        return { activeProvider: DEFAULT_PROVIDER, taskMap: {} };
    }
}

export class ArcaneaStudioRouter {
    constructor() {
        this.providers = {
            muapi: new MuapiProvider(),
            fal: new StubProvider('fal', 'Fal.ai'),
            gemini: new StubProvider('gemini', 'Google Nano Banana 2'),
            replicate: new StubProvider('replicate', 'Replicate'),
        };
    }

    _pick(taskClass, override) {
        if (override && this.providers[override]) return this.providers[override];
        const settings = readSettings();
        const mapped = settings.taskMap[taskClass];
        if (mapped && this.providers[mapped]) return this.providers[mapped];
        const active = settings.activeProvider;
        return this.providers[active] || this.providers[DEFAULT_PROVIDER];
    }

    async _dispatch(taskClass, method, params = {}) {
        const provider = this._pick(taskClass, params.provider);
        console.log(`[Router] ${taskClass} -> ${provider.id}`);
        return provider[method](params);
    }

    generateImage(params) { return this._dispatch(TASK_CLASSES.IMAGE_T2I, 'generateImage', params); }
    generateVideo(params) { return this._dispatch(TASK_CLASSES.VIDEO_T2V, 'generateVideo', params); }
    generateI2I(params) { return this._dispatch(TASK_CLASSES.IMAGE_I2I, 'generateI2I', params); }
    generateI2V(params) { return this._dispatch(TASK_CLASSES.VIDEO_I2V, 'generateI2V', params); }
    processV2V(params) { return this._dispatch(TASK_CLASSES.VIDEO_V2V, 'processV2V', params); }
    processLipSync(params) { return this._dispatch(TASK_CLASSES.VIDEO_LIPSYNC, 'processLipSync', params); }

    async uploadFile(file, providerOverride) {
        const provider = this._pick(TASK_CLASSES.FILE_UPLOAD, providerOverride);
        console.log(`[Router] file.upload -> ${provider.id}`);
        try {
            return await provider.uploadFile(file);
        } catch (err) {
            if (provider.id !== DEFAULT_PROVIDER) {
                console.warn(`[Router] ${provider.id} upload failed, falling back to muapi:`, err.message);
                return this.providers[DEFAULT_PROVIDER].uploadFile(file);
            }
            throw err;
        }
    }

    pollForResult(requestId, key, maxAttempts, interval) {
        return this.providers[DEFAULT_PROVIDER].pollForResult(requestId, key, maxAttempts, interval);
    }

    getDimensionsFromAR(ar) { return this.providers[DEFAULT_PROVIDER].getDimensionsFromAR(ar); }
}

export const router = new ArcaneaStudioRouter();
