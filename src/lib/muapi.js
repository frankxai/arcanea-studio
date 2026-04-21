/**
 * Backward-compat shim.
 *
 * The Muapi-only client was replaced by the ArcaneaStudioRouter in Phase 1
 * of the fork (2026-04-21). All 10 studio components still import `muapi`
 * from this path; re-exporting the router keeps zero UI edits while the
 * four studios gain multi-provider routing.
 *
 * New code should import from './router/index.js' directly.
 */

export { router as muapi, ArcaneaStudioRouter } from './router/index.js';
export { MuapiProvider as MuapiClient } from './router/providers/muapi.js';
