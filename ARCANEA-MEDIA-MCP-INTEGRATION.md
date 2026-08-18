# Arcanea Studio + Media MCP Integration

The new `arcanea-media-mcp` repo (C:\Users\frank\repos\arcanea-media-mcp) provides the **agentic control plane** for all the image/video capabilities already prototyped in this studio.

## Current State in Studio
- Strong multi-model router (Nano Banana, Flux, Veo, Kling, Seedance, etc.)
- Image Studio UI
- Plans for Video / Cinema / LipSync

## How the MCP Fits
- Use the MCP as the **backend intelligence** when agents (Claude, Hermes, etc.) drive creation.
- Studio becomes the beautiful human surface + preview.
- MCP handles:
  - World context injection
  - Character consistency (Soul-style)
  - Async video jobs
  - Vault storage of results
  - Cost estimation + BYOK

## Recommended Next Integration Steps
1. Add "Agent Mode" button in studio that launches or connects to the MCP.
2. Wire generated assets from MCP calls back into the studio history / creation cards.
3. Share the OpenRouter client and router logic between studio and the MCP.
4. Use MCP `create_character` to feed the studio's character system.

See the full strategy in the media-mcp repo:
- README.md
- STRATEGY.md (business + ICP)
- IMPLEMENTATION.md (stack, code structure, rationale)
- QUICKSTART.md

This completes the "replicate the best of Higgsfield MCP + make it magical for world-builders" vision.
