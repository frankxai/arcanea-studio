/**
 * @file Arcanea Studio Router — provider-agnostic types.
 *
 * The router mirrors MuapiClient's method surface so the four studios
 * (Image / Video / LipSync / Cinema) can swap providers at runtime
 * without UI changes. Muapi stays the default; Fal / Gemini (NB2) /
 * Replicate slots plug in behind the same interface.
 */

/**
 * @typedef {'muapi' | 'fal' | 'gemini' | 'replicate'} ProviderId
 *
 * @typedef {Object} RouterSettings
 * @property {ProviderId} activeProvider           Provider used for the next call.
 * @property {Record<ProviderId,string>} keys      API keys keyed by provider.
 * @property {Record<string,ProviderId>} taskMap   Override: taskClass -> provider.
 *
 * @typedef {'image.t2i' | 'image.i2i' | 'video.t2v' | 'video.i2v'
 *          | 'video.v2v' | 'video.lipsync' | 'file.upload'} TaskClass
 *
 * @typedef {Object} ProviderInterface
 * @property {(p:Object)=>Promise<any>} generateImage
 * @property {(p:Object)=>Promise<any>} generateVideo
 * @property {(p:Object)=>Promise<any>} generateI2I
 * @property {(p:Object)=>Promise<any>} generateI2V
 * @property {(p:Object)=>Promise<any>} processV2V
 * @property {(p:Object)=>Promise<any>} processLipSync
 * @property {(f:File)=>Promise<string>} uploadFile
 */

export const DEFAULT_PROVIDER = 'muapi';

export const PROVIDER_LABELS = {
    muapi: 'Muapi.ai (200+ models)',
    fal: 'Fal.ai (editorial + FLUX Pro)',
    gemini: 'Google Nano Banana 2 (fast iteration)',
    replicate: 'Replicate (fine-tuned + Wan video)',
};

export const TASK_CLASSES = {
    IMAGE_T2I: 'image.t2i',
    IMAGE_I2I: 'image.i2i',
    VIDEO_T2V: 'video.t2v',
    VIDEO_I2V: 'video.i2v',
    VIDEO_V2V: 'video.v2v',
    VIDEO_LIPSYNC: 'video.lipsync',
    FILE_UPLOAD: 'file.upload',
};
