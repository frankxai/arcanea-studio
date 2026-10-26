#!/usr/bin/env python3
"""Offline comic packet compiler. Structural checks are not artistic approval."""
import argparse
import copy
import hashlib
import json
import math
import re
import sys
from collections import defaultdict, deque

STATES = {"source", "accepted", "proposal", "inference", "conflict", "rejected", "deprecated"}
VISIBILITY = {"private", "restricted", "shareable", "public"}
ROLES = {"identity", "wardrobe", "prop", "environment", "composition", "palette", "material", "do_not_copy"}


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"),
                                     ensure_ascii=False, allow_nan=False).encode()).hexdigest()


def snapshot(packet):
    """Pin the complete production input, not only the lore subset."""
    value = copy.deepcopy(packet)
    value.pop("snapshot_sha256", None)
    return digest(value)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def indexed(items, label):
    require(isinstance(items, list) and bool(items), f"{label}: non-empty list required")
    result = {}
    for item in items:
        require(isinstance(item, dict), f"{label}: object required")
        ident = item.get("id")
        require(isinstance(ident, str) and bool(ident), f"{label}: id required")
        require(ident not in result, f"{label}: duplicate id {ident}")
        result[ident] = item
    return result


def rect(box):
    require(isinstance(box, list) and len(box) == 4, "bbox: four numbers required")
    require(all(type(v) in (int, float) and math.isfinite(v) for v in box), "bbox: finite numbers required")
    x, y, w, h = box
    require(x >= 0 and y >= 0 and w > 0 and h > 0 and x + w <= 1.000001 and y + h <= 1.000001,
            "bbox: outside normalized page")


def overlap(a, b):
    return (min(a[0] + a[2], b[0] + b[2]) > max(a[0], b[0]) + 1e-8 and
            min(a[1] + a[3], b[1] + b[3]) > max(a[1], b[1]) + 1e-8)


def validate(packet):
    require(packet.get("schema_version") == "arcanea.comic-packet.v0.1", "unsupported schema")
    world = packet["world"]
    require(world.get("mode") == "creator-owned", "official Arcanea requires an authorized canon adapter; unsupported here")
    require(world.get("state") in STATES and world.get("visibility") in VISIBILITY, "invalid world state or visibility")
    require(packet.get("snapshot_sha256") == snapshot(packet), "stale snapshot: production input changed")
    entities = indexed(packet["entities"], "entities")
    refs = indexed(packet["references"], "references")
    pages = indexed(packet["pages"], "pages")
    exports = indexed(packet["exports"], "exports")
    panels = {}
    for page in pages.values():
        local = indexed(page["panels"], "panels")
        for ident, panel in local.items():
            require(ident not in panels, f"duplicate panel id {ident}")
            panels[ident] = panel
    all_ids = list(entities) + list(refs) + list(pages) + list(panels) + list(exports)
    require(len(all_ids) == len(set(all_ids)), "all IDs must be globally unique")
    for entity in entities.values():
        require(entity.get("state") in STATES and entity.get("visibility") in VISIBILITY, "invalid entity state or visibility")
        require(entity.get("source") and entity.get("visual"), f"{entity['id']}: source and visual required")
    for ref in refs.values():
        require(ref.get("entity_id") in entities, f"{ref['id']}: unknown entity")
        require(ref.get("roles") and set(ref["roles"]) <= ROLES, f"{ref['id']}: invalid reference roles")
        require(ref.get("status") in {"pending", "available"}, f"{ref['id']}: invalid status")
        require(ref.get("rights") in {"creator-owned", "licensed", "public-domain", "unresolved"}, "invalid rights")
        if ref["status"] == "available":
            require(ref.get("uri") and re.fullmatch(r"[a-f0-9]{64}", ref.get("sha256", "")), "available reference needs URI and byte hash")
    state = copy.deepcopy(packet["initial_state"])
    require(isinstance(state, dict), "initial_state must be an object")
    warnings = []
    orders = []
    seen_panels = set()
    for page in pages.values():
        require(page.get("reading_direction") in {"ltr", "rtl"}, "page needs explicit reading direction")
        boxes = []
        for panel in page["panels"]:
            ident = panel["id"]
            require(type(panel.get("order")) is int, f"{ident}: integer order required")
            orders.append(panel["order"])
            rect(panel["bbox"])
            require(not any(overlap(panel["bbox"], b) for b in boxes), f"{ident}: overlapping panels")
            boxes.append(panel["bbox"])
            require(panel.get("intent") and panel.get("art") and panel.get("composition"), f"{ident}: missing direction")
            require(panel.get("location") in entities and entities[panel["location"]].get("kind") == "location", f"{ident}: unknown location")
            require(isinstance(panel.get("characters"), list), f"{ident}: characters required")
            for char in panel["characters"]:
                require(char in entities and entities[char].get("kind") == "character", f"{ident}: unknown character {char}")
            require(isinstance(panel.get("depends_on"), list), f"{ident}: dependencies required")
            for dep in panel["depends_on"]:
                require(dep in entities or dep in seen_panels, f"{ident}: unknown or forward dependency {dep}")
            for key, expected in panel.get("requires", {}).items():
                require(key in state and type(state[key]) is type(expected) and state[key] == expected,
                        f"{ident}: continuity failure for {key}")
            for key, value in panel.get("effects", {}).items():
                require(key in state, f"{ident}: undeclared state key {key}")
                state[key] = value
            require(isinstance(panel.get("reference_ids"), list), f"{ident}: reference_ids required")
            selected = []
            for rid in panel["reference_ids"]:
                require(rid in refs, f"{ident}: unknown reference {rid}")
                selected.append(refs[rid])
            for char in panel["characters"]:
                require(any(r["entity_id"] == char and "identity" in r["roles"] for r in selected),
                        f"{ident}: missing identity reference for {char}")
            if any(r["status"] != "available" or r["rights"] == "unresolved" for r in selected):
                warnings.append(f"{ident}: generation blocked until reference bytes and rights are reviewed")
            for char in panel["characters"]:
                require(entities[char]["state"] not in {"conflict", "rejected", "deprecated"}, f"{ident}: unusable entity state")
            for line in panel.get("dialogue", []):
                require(line.get("speaker") in panel["characters"] or line.get("speaker") == "narrator", f"{ident}: absent speaker")
                require(isinstance(line.get("text"), str), f"{ident}: dialogue text required")
                if len(line["text"].split()) > 28:
                    warnings.append(f"{ident}: balloon exceeds the draft 28-word budget; letterer review required")
            seen_panels.add(ident)
    require(orders == list(range(1, len(orders) + 1)), "panel order must be contiguous in declared reading sequence")
    for export in exports.values():
        require(export.get("format") in {"pdf", "cbz", "web-scroll", "epub-fixed"}, "unsupported export format")
        require(export.get("page_ids") and set(export["page_ids"]) <= set(pages), "export has unknown pages")
    return {"structural_status": "pass", "artistic_status": "not-evaluated", "release_status": "draft",
            "snapshot_sha256": snapshot(packet), "panels": len(panels), "pages": len(pages),
            "warnings": warnings, "final_state": state}


def graph(packet):
    edges = defaultdict(set)
    state_writer = {}
    for page in packet["pages"]:
        for panel in page["panels"]:
            pid = panel["id"]
            dependencies = set(panel["characters"] + [panel["location"]] + panel["depends_on"] + panel["reference_ids"])
            for key in panel.get("requires", {}):
                if key in state_writer:
                    dependencies.add(state_writer[key])
            for dep in dependencies:
                edges[dep].add(pid)
            for key in panel.get("effects", {}):
                state_writer[key] = pid
            edges[pid].add(page["id"])
    for ref in packet["references"]:
        edges[ref["entity_id"]].add(ref["id"])
    for export in packet["exports"]:
        for page in export["page_ids"]:
            edges[page].add(export["id"])
    return edges


def impact(packet, changed):
    validate(packet)
    edges = graph(packet)
    known = set(edges) | {v for values in edges.values() for v in values}
    require(bool(changed) and set(changed) <= known, "unknown changed ID")
    found = set(changed)
    queue = deque(changed)
    while queue:
        for node in edges.get(queue.popleft(), []):
            if node not in found:
                found.add(node)
                queue.append(node)
    return {"changed": changed, "requires_review": sorted(found - set(changed)),
            "note": "Declared dependencies only; this is not complete semantic retcon detection."}


def compile_packet(packet):
    report = validate(packet)
    entities = {e["id"]: e for e in packet["entities"]}
    refs = {r["id"]: r for r in packet["references"]}
    state = copy.deepcopy(packet["initial_state"])
    specs = []
    for page in packet["pages"]:
        for panel in page["panels"]:
            before = copy.deepcopy(state)
            state.update(panel.get("effects", {}))
            anchors = [{"id": c, "visual": entities[c]["visual"]} for c in panel["characters"]]
            prompt = "\n".join([
                f"PURPOSE: {panel['intent']}", f"WORLD RULE: {packet['world']['binding_rule']}", f"ART: {panel['art']}",
                f"LOCATION: {entities[panel['location']]['visual']}",
                f"COMPOSITION: {panel['composition']}", f"LOOK: {packet['look']}",
                "PRESERVE: " + json.dumps(anchors, ensure_ascii=False),
                "STORY BEFORE: " + json.dumps(before, ensure_ascii=False, sort_keys=True),
                "STORY AFTER: " + json.dumps(state, ensure_ascii=False, sort_keys=True),
                "EXCLUDE: lettering, speech balloons, captions, logos, watermarks; composite exact text separately.",
            ])
            selected = [refs[r] for r in panel["reference_ids"]]
            specs.append({"panel_id": panel["id"], "page_id": page["id"], "bbox": panel["bbox"],
                          "prompt": prompt, "references": selected, "lettering": panel.get("dialogue", []),
                          "generation_status": "pending", "provider": None, "model_id": None,
                          "source_snapshot_sha256": report["snapshot_sha256"]})
    return {"report": report, "panel_specs": specs,
            "dependencies": {k: sorted(v) for k, v in sorted(graph(packet).items())}}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["validate", "snapshot", "compile", "impact"])
    parser.add_argument("packet")
    parser.add_argument("--changed", nargs="+", default=[])
    args = parser.parse_args()
    try:
        with open(args.packet, encoding="utf-8") as handle:
            packet = json.load(handle)
        if args.command == "snapshot":
            result = {"snapshot_sha256": snapshot(packet)}
        elif args.command == "impact":
            result = impact(packet, args.changed)
        elif args.command == "compile":
            result = compile_packet(packet)
        else:
            result = validate(packet)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (ValueError, TypeError, KeyError, OSError) as error:
        print(json.dumps({"status": "invalid", "error": str(error)}), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
