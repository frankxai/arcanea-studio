/**
 * @file Stub provider template — Fal / Gemini (NB2) / Replicate land here.
 * Each stub throws NotImplemented until the provider ships. The router
 * refuses to dispatch to a stub unless the user explicitly opted in.
 */

export class StubProvider {
    constructor(id, label) {
        this.id = id;
        this.label = label;
    }
    _nope(method) {
        return () =>
            Promise.reject(
                new Error(
                    `[${this.id}] ${method}() not implemented yet. Active provider must be muapi ` +
                        `or you must wire ${this.label} in src/lib/router/providers/${this.id}.js`,
                ),
            );
    }
    generateImage = this._nope('generateImage');
    generateVideo = this._nope('generateVideo');
    generateI2I = this._nope('generateI2I');
    generateI2V = this._nope('generateI2V');
    processV2V = this._nope('processV2V');
    processLipSync = this._nope('processLipSync');
    uploadFile = () =>
        Promise.reject(new Error(`[${this.id}] uploadFile not implemented; falls back to muapi.`));
    getDimensionsFromAR(ar) {
        switch (ar) {
            case '1:1': return [1024, 1024];
            case '16:9': return [1280, 720];
            case '9:16': return [720, 1280];
            default: return [1024, 1024];
        }
    }
}
