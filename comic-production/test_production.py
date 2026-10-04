import copy
import json
from pathlib import Path
import unittest

from production import compile_packet, graph, impact, snapshot, validate


class ProductionTests(unittest.TestCase):
    def setUp(self):
        self.packet = json.loads(Path(__file__).with_name("example.json").read_text())

    def repin(self):
        self.packet["snapshot_sha256"] = snapshot(self.packet)

    def test_draft_pass_is_not_artistic_approval(self):
        result = validate(self.packet)
        self.assertEqual(result["panels"], 24)
        self.assertEqual(result["release_status"], "draft")
        self.assertEqual(result["artistic_status"], "not-evaluated")
        self.assertTrue(result["warnings"])

    def test_dialogue_change_invalidates_snapshot(self):
        self.packet["pages"][0]["panels"][0]["dialogue"] = [{"speaker": "char-iva", "text": "Changed"}]
        with self.assertRaisesRegex(ValueError, "stale snapshot"):
            validate(self.packet)

    def test_physical_continuity_failure(self):
        self.packet["pages"][5]["panels"][2]["requires"]["memory"] = "available"
        self.repin()
        with self.assertRaisesRegex(ValueError, "continuity failure"):
            validate(self.packet)

    def test_state_type_is_strict(self):
        self.packet["pages"][0]["panels"][0]["requires"] = {"iva_wet": 0}
        self.repin()
        with self.assertRaisesRegex(ValueError, "continuity failure"):
            validate(self.packet)

    def test_forward_dependency_rejected(self):
        self.packet["pages"][0]["panels"][0]["depends_on"].append("panel-024")
        self.repin()
        with self.assertRaisesRegex(ValueError, "forward dependency"):
            validate(self.packet)

    def test_duplicate_ids_rejected(self):
        self.packet["entities"].append(copy.deepcopy(self.packet["entities"][0]))
        self.repin()
        with self.assertRaisesRegex(ValueError, "duplicate id"):
            validate(self.packet)

    def test_absent_speaker_rejected(self):
        self.packet["pages"][0]["panels"][0]["dialogue"] = [{"speaker": "char-venn", "text": "Hello"}]
        self.repin()
        with self.assertRaisesRegex(ValueError, "absent speaker"):
            validate(self.packet)

    def test_overlap_rejected(self):
        self.packet["pages"][0]["panels"][1]["bbox"] = self.packet["pages"][0]["panels"][0]["bbox"]
        self.repin()
        with self.assertRaisesRegex(ValueError, "overlapping panels"):
            validate(self.packet)

    def test_out_of_bounds_rejected(self):
        self.packet["pages"][0]["panels"][0]["bbox"] = [0, 0, 2, 1]
        self.repin()
        with self.assertRaisesRegex(ValueError, "outside normalized page"):
            validate(self.packet)

    def test_identity_reference_required(self):
        self.packet["pages"][0]["panels"][0]["reference_ids"].remove("ref-iva")
        self.repin()
        with self.assertRaisesRegex(ValueError, "missing identity"):
            validate(self.packet)

    def test_compile_keeps_lettering_separate_and_generation_pending(self):
        result = compile_packet(self.packet)
        self.assertIn("lettering", result["panel_specs"][1])
        self.assertNotIn("She had forgotten", result["panel_specs"][1]["prompt"])
        self.assertTrue(all(p["generation_status"] == "pending" for p in result["panel_specs"]))

    def test_impact_reaches_exports(self):
        result = impact(self.packet, ["prop-memory"])
        self.assertIn("export-reader", result["requires_review"])
        self.assertIn("panel-024", result["requires_review"])

    def test_state_producer_edges_without_explicit_sequence(self):
        for page in self.packet["pages"]:
            for panel in page["panels"]:
                panel["depends_on"] = [d for d in panel["depends_on"] if not d.startswith("panel-")]
        self.repin()
        self.assertIn("panel-016", graph(self.packet)["panel-015"])
        self.assertIn("panel-018", impact(self.packet, ["panel-015"])["requires_review"])

    def test_official_canon_lane_fails_closed(self):
        self.packet["world"]["mode"] = "arcanea-official"
        self.repin()
        with self.assertRaisesRegex(ValueError, "authorized canon adapter"):
            validate(self.packet)


if __name__ == "__main__":
    unittest.main()
