/**
 * @file Muapi provider — extracted verbatim from the original MuapiClient.
 * The router delegates to this by default. Do not edit logic here without
 * cross-checking the original upstream behavior in git history.
 */

import {
    getModelById,
    getVideoModelById,
    getI2IModelById,
    getI2VModelById,
    getV2VModelById,
    getLipSyncModelById,
} from '../../models.js';

export class MuapiProvider {
    constructor() {
        this.id = 'muapi';
        this.baseUrl = import.meta.env.DEV ? '' : 'https://api.muapi.ai';
    }

    getKey() {
        const key = window.__MUAPI_KEY__ || localStorage.getItem('muapi_key');
        if (!key) throw new Error('Muapi API key missing. Please set it in Settings.');
        return key;
    }

    async pollForResult(requestId, key, maxAttempts = 60, interval = 2000) {
        const pollUrl = `${this.baseUrl}/api/v1/predictions/${requestId}/result`;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await new Promise((r) => setTimeout(r, interval));
            try {
                const response = await fetch(pollUrl, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': key },
                });
                if (!response.ok) {
                    if (response.status >= 500) continue;
                    const errText = await response.text();
                    throw new Error(`Poll Failed: ${response.status} - ${errText.slice(0, 100)}`);
                }
                const data = await response.json();
                const status = data.status?.toLowerCase();
                if (['completed', 'succeeded', 'success'].includes(status)) return data;
                if (['failed', 'error'].includes(status)) {
                    throw new Error(`Generation failed: ${data.error || 'Unknown error'}`);
                }
            } catch (error) {
                if (attempt === maxAttempts) throw error;
            }
        }
        throw new Error('Generation timed out after polling.');
    }

    async _submit(url, payload, key, pollTimeout) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': key },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(
                `API Request Failed: ${response.status} ${response.statusText} - ${errText.slice(0, 100)}`,
            );
        }
        const submitData = await response.json();
        const requestId = submitData.request_id || submitData.id;
        return { submitData, requestId };
    }

    async generateImage(params) {
        const key = this.getKey();
        const modelInfo = getModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;

        const finalPayload = { prompt: params.prompt };
        if (params.aspect_ratio) finalPayload.aspect_ratio = params.aspect_ratio;
        if (params.resolution) finalPayload.resolution = params.resolution;
        if (params.quality) finalPayload.quality = params.quality;
        if (params.image_url) {
            finalPayload.image_url = params.image_url;
            finalPayload.strength = params.strength || 0.6;
        } else {
            finalPayload.image_url = null;
        }
        if (params.seed && params.seed !== -1) finalPayload.seed = params.seed;

        const { submitData, requestId } = await this._submit(url, finalPayload, key);
        if (!requestId) return submitData;
        if (params.onRequestId) params.onRequestId(requestId);
        const result = await this.pollForResult(requestId, key);
        const imageUrl = result.outputs?.[0] || result.url || result.output?.url;
        return { ...result, url: imageUrl };
    }

    async generateVideo(params) {
        const key = this.getKey();
        const modelInfo = getVideoModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;
        const finalPayload = {};
        [
            'prompt',
            'request_id',
            'aspect_ratio',
            'duration',
            'resolution',
            'quality',
            'mode',
            'image_url',
        ].forEach((k) => {
            if (params[k] !== undefined) finalPayload[k] = params[k];
        });

        const { submitData, requestId } = await this._submit(url, finalPayload, key);
        if (!requestId) return submitData;
        if (params.onRequestId) params.onRequestId(requestId);
        const result = await this.pollForResult(requestId, key, 900, 2000);
        const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
        return { ...result, url: videoUrl };
    }

    async generateI2I(params) {
        const key = this.getKey();
        const modelInfo = getI2IModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;
        const finalPayload = { prompt: params.prompt || '' };
        const imageField = modelInfo?.imageField || 'image_url';
        const imagesList =
            params.images_list?.length > 0
                ? params.images_list
                : params.image_url
                  ? [params.image_url]
                  : null;
        if (imagesList) {
            if (imageField === 'images_list') finalPayload.images_list = imagesList;
            else finalPayload[imageField] = imagesList[0];
        }
        ['aspect_ratio', 'resolution', 'quality'].forEach((k) => {
            if (params[k]) finalPayload[k] = params[k];
        });

        const { submitData, requestId } = await this._submit(url, finalPayload, key);
        if (!requestId) return submitData;
        if (params.onRequestId) params.onRequestId(requestId);
        const result = await this.pollForResult(requestId, key);
        const imageUrl = result.outputs?.[0] || result.url || result.output?.url;
        return { ...result, url: imageUrl };
    }

    async generateI2V(params) {
        const key = this.getKey();
        const modelInfo = getI2VModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;
        const finalPayload = {};
        if (params.prompt) finalPayload.prompt = params.prompt;
        const imageField = modelInfo?.imageField || 'image_url';
        if (params.image_url) {
            if (imageField === 'images_list') finalPayload.images_list = [params.image_url];
            else finalPayload[imageField] = params.image_url;
        }
        ['aspect_ratio', 'duration', 'resolution', 'quality', 'mode', 'name'].forEach((k) => {
            if (params[k] !== undefined) finalPayload[k] = params[k];
        });

        const { submitData, requestId } = await this._submit(url, finalPayload, key);
        if (!requestId) return submitData;
        if (params.onRequestId) params.onRequestId(requestId);
        const result = await this.pollForResult(requestId, key, 900, 2000);
        const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
        return { ...result, url: videoUrl };
    }

    async processV2V(params) {
        const key = this.getKey();
        const modelInfo = getV2VModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;
        const videoField = modelInfo?.videoField || 'video_url';
        const finalPayload = { [videoField]: params.video_url };

        const { submitData, requestId } = await this._submit(url, finalPayload, key);
        if (!requestId) return submitData;
        if (params.onRequestId) params.onRequestId(requestId);
        const result = await this.pollForResult(requestId, key, 900, 2000);
        const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
        return { ...result, url: videoUrl };
    }

    async processLipSync(params) {
        const key = this.getKey();
        const modelInfo = getLipSyncModelById(params.model);
        const endpoint = modelInfo?.endpoint || params.model;
        const url = `${this.baseUrl}/api/v1/${endpoint}`;
        const finalPayload = {};
        ['audio_url', 'image_url', 'video_url', 'prompt', 'resolution'].forEach((k) => {
            if (params[k]) finalPayload[k] = params[k];
        });
        if (params.seed !== undefined && params.seed !== -1) finalPayload.seed = params.seed;

        const { submitData, requestId } = await this._submit(url, finalPayload, key);
        if (!requestId) return submitData;
        if (params.onRequestId) params.onRequestId(requestId);
        const result = await this.pollForResult(requestId, key, 900, 2000);
        const videoUrl = result.outputs?.[0] || result.url || result.output?.url;
        return { ...result, url: videoUrl };
    }

    async uploadFile(file) {
        const key = this.getKey();
        const url = `${this.baseUrl}/api/v1/upload_file`;
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'x-api-key': key },
            body: formData,
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`File upload failed: ${response.status} - ${errText.slice(0, 100)}`);
        }
        const data = await response.json();
        const fileUrl = data.url || data.file_url || data.data?.url;
        if (!fileUrl) throw new Error('No URL returned from file upload');
        return fileUrl;
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
