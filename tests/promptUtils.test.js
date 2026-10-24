import test from 'node:test';
import assert from 'node:assert';
import { buildNanoBananaPrompt } from '../src/lib/promptUtils.js';

test('buildNanoBananaPrompt works with known mapping values', () => {
    const result = buildNanoBananaPrompt(
        "A cute cat",
        "Modular 8K Digital",
        "Classic Anamorphic",
        35,
        "f/1.4"
    );
    assert.strictEqual(
        result,
        "A cute cat, shot on a modular 8K digital cinema camera, using a classic anamorphic lens at 35mm (natural cinematic perspective), aperture f/1.4, shallow depth of field, creamy bokeh, cinematic lighting, natural color science, high dynamic range, professional photography, ultra-detailed, 8K resolution"
    );
});

test('buildNanoBananaPrompt falls back to raw values for unknown inputs', () => {
    const result = buildNanoBananaPrompt(
        "A scary dog",
        "Unknown Camera",
        "Unknown Lens",
        999,
        "f/2.8"
    );
    assert.strictEqual(
        result,
        "A scary dog, shot on a Unknown Camera, using a Unknown Lens at 999mm , aperture f/2.8, cinematic lighting, natural color science, high dynamic range, professional photography, ultra-detailed, 8K resolution"
    );
});

test('buildNanoBananaPrompt handles empty base prompt and parameters gracefully', () => {
    const result = buildNanoBananaPrompt(
        "",
        "",
        "",
        0,
        ""
    );
    // When inputs are empty, the mapping will fall back to "" (falsy) for perspective and depthEffect.
    // The camera and lens will fallback to "" (the input), so it will render as `shot on a ` and `using a  at 0mm `
    // and `aperture `

    // Let's test the exact output format string produced when passing empty strings
    // "shot on a ", "using a  at 0mm ", "aperture "
    assert.ok(result.includes("shot on a "));
    assert.ok(result.includes("using a  at 0mm"));
    assert.ok(result.includes("aperture "));
    assert.ok(result.includes("cinematic lighting"));
    assert.ok(result.includes("8K resolution"));
});
