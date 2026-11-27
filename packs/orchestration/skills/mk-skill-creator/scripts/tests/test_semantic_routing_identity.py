"""Offline contracts for max-kit routing cases and restructured-roster comparisons."""
import copy
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from semantic_routing_contract import PROTOCOL, authoritative, catalog_from_snapshot, fingerprint, load, validate_cases
from semantic_routing_eval import main
from semantic_routing_identity import compare_restructure, remap_cases, remap_document

SKILL = Path(__file__).resolve().parents[2]
ASSETS = SKILL / "assets" / "semantic-routing"
SNAPSHOTS = SKILL.parents[3] / "docs" / "conformance" / "skill-catalog"
IDENTITY_EXAMPLE = ASSETS / "max-kit-engineer-identity-example.json"


def setUpModule():
    # The frozen snapshots live in the max-kit repository, not in an installed skill.
    if not (SNAPSHOTS / "engineer.json").is_file():
        raise unittest.SkipTest("max-kit catalog snapshots are only available in the source repository")


def snapshot_catalog(kit):
    return catalog_from_snapshot(load(SNAPSHOTS / f"{kit}.json"))


def kit_cases(kit):
    return load(ASSETS / f"max-kit-{kit}-cases.json")


def restructured(catalog):
    """Candidate roster matching the identity example: two merges and one rename."""
    result = copy.deepcopy(catalog)
    gone = {"mk-watzup", "mk-sowat", "mk-mermaidjs-v11"}
    result["skills"] = [s for s in result["skills"] if s["id"] not in gone]
    result["skills"].append({"id": "mk-mermaid", "description": "Create Mermaid v11 diagrams.", "path": "skills/mk-mermaid/SKILL.md"})
    result["skills"].sort(key=lambda s: s["id"])
    return result


def report(catalog, cases, split="train"):
    selected = sorted((c for c in cases["cases"] if c["split"] == split), key=lambda c: c["id"])
    return {"protocol": PROTOCOL, "status": "completed", "holdout_id": cases["holdout_id"], "split": split,
            "runtime": catalog["runtime"], "scope": catalog["scope"], "roster": sorted(s["id"] for s in catalog["skills"]),
            "batch_schedule": [[c["id"]] for c in selected], "provider": {"provider": "fixture", "resolved_model": "fixture-v1", "profile_version": PROTOCOL},
            "cases_hash": fingerprint(cases), "catalog_hash": fingerprint(catalog)}


def records(run, cases, choose):
    return [{"case_id": c["id"], "expected": c["expected"], "predicted": choose(c), "catalog_hash": run["catalog_hash"]}
            for c in cases["cases"] if c["split"] == run["split"]]


class MaxKitRoutingCaseTests(unittest.TestCase):
    def test_kit_cases_validate_against_source_snapshot_catalogs(self):
        for kit in ("engineer", "marketing"):
            with self.subTest(kit=kit):
                catalog, cases = snapshot_catalog(kit), kit_cases(kit)
                validate_cases(cases, catalog)
                self.assertFalse(authoritative(catalog), "a source snapshot must never count as a runtime export")
                for split in ("train", "holdout"):
                    classes = {c["class"] for c in cases["cases"] if c["split"] == split}
                    self.assertTrue({"positive", "indirect", "near-miss", "no-skill"} <= classes, (kit, split, classes))

    def test_snapshot_catalog_lists_only_model_invocable_skills(self):
        snapshot = load(SNAPSHOTS / "engineer.json")
        catalog = catalog_from_snapshot(snapshot)
        self.assertEqual(len(catalog["skills"]), snapshot["summary"]["modelInvocable"])
        hidden = {s["name"] for s in snapshot["skills"] if not s["modelInvocable"]}
        self.assertTrue(hidden)
        self.assertFalse(hidden & {s["id"] for s in catalog["skills"]})

    def test_snapshot_catalog_rejects_other_evidence_layers(self):
        snapshot = load(SNAPSHOTS / "engineer.json")
        snapshot["evidenceLayer"] = "runtime-observed"
        with self.assertRaises(ValueError):
            catalog_from_snapshot(snapshot)

    def test_no_skill_case_must_expect_none(self):
        catalog, cases = snapshot_catalog("engineer"), kit_cases("engineer")
        case = next(c for c in cases["cases"] if c["class"] == "no-skill")
        case["expected"] = "mk-fix"
        with self.assertRaises(ValueError):
            validate_cases(cases, catalog)


class IdentityMapTests(unittest.TestCase):
    def setUp(self):
        self.before = snapshot_catalog("engineer")
        self.after = restructured(self.before)
        self.cases = kit_cases("engineer")
        self.identity = load(IDENTITY_EXAMPLE)

    def test_remap_follows_merges_and_renames(self):
        remapped = remap_cases(self.cases, self.identity, self.before, self.after)
        labels = {c["id"]: c["expected"] for c in remapped["cases"]}
        for case in self.cases["cases"]:
            expected = {"mk-watzup": "mk-sumup", "mk-sowat": "mk-sumup", "mk-mermaidjs-v11": "mk-mermaid"}.get(case["expected"], case["expected"])
            self.assertEqual(labels[case["id"]], expected)

    def test_split_needs_explicit_case_owner(self):
        roster_before = ["mk-a", "mk-b"]
        roster_after = ["mk-a1", "mk-a2", "mk-b"]
        cases = {"schema_version": 1, "holdout_id": "h", "cases": [{"id": "c1", "split": "train", "prompt": "p", "expected": "mk-a", "class": "positive"}]}
        document = {"schema_version": 1, "mappings": [{"from": "mk-a", "to": ["mk-a1", "mk-a2"], "kind": "split"}]}
        with self.assertRaisesRegex(ValueError, "case_owners"):
            remap_document(cases, document, roster_before, roster_after)
        document["case_owners"] = {"c1": "mk-a2"}
        self.assertEqual(remap_document(cases, document, roster_before, roster_after)["cases"][0]["expected"], "mk-a2")
        document["case_owners"] = {"c1": "mk-b"}
        with self.assertRaises(ValueError):
            remap_document(cases, document, roster_before, roster_after)
        document["case_owners"] = {"c1": "mk-a1", "gone": "mk-a2"}
        with self.assertRaises(ValueError):
            remap_document(cases, document, roster_before, roster_after)

    def test_unmapped_removed_skill_is_rejected(self):
        document = {"schema_version": 1, "mappings": self.identity["mappings"][:1]}
        with self.assertRaisesRegex(ValueError, "missing from the candidate roster"):
            remap_cases(self.cases, document, self.before, self.after)

    def test_wrong_target_count_is_rejected(self):
        document = copy.deepcopy(self.identity)
        document["mappings"][2]["to"] = ["mk-mermaid", "mk-diagram"]
        with self.assertRaises(ValueError):
            remap_cases(self.cases, document, self.before, self.after)

    def test_remove_maps_cases_to_none(self):
        document = copy.deepcopy(self.identity)
        document["mappings"][2] = {"from": "mk-mermaidjs-v11", "to": [], "kind": "remove"}
        after = copy.deepcopy(self.after)
        after["skills"] = [s for s in after["skills"] if s["id"] != "mk-mermaid"]
        remapped = remap_cases(self.cases, document, self.before, after)
        mermaid = [c["id"] for c in self.cases["cases"] if c["expected"] == "mk-mermaidjs-v11"]
        self.assertTrue(mermaid)
        self.assertTrue(all(c["expected"] == "none" for c in remapped["cases"] if c["id"] in mermaid))


class CompareRestructureTests(unittest.TestCase):
    def setUp(self):
        self.before_catalog = snapshot_catalog("engineer")
        self.after_catalog = restructured(self.before_catalog)
        self.cases = kit_cases("engineer")
        self.identity = load(IDENTITY_EXAMPLE)
        self.remapped = remap_cases(self.cases, self.identity, self.before_catalog, self.after_catalog)
        self.before = report(self.before_catalog, self.cases, "holdout")
        self.after = report(self.after_catalog, self.remapped, "holdout")
        self.owner = {c["id"]: c["expected"] for c in self.remapped["cases"]}

    def test_owner_level_comparison_counts_fixes_and_false_activations(self):
        # Baseline confuses the recap skills and activates on one no-skill prompt;
        # the candidate gets every owner right.
        confused = {"mk-sumup": "mk-watzup", "mk-watzup": "mk-sumup"}
        no_skill = next(c["id"] for c in self.cases["cases"] if c["split"] == "holdout" and c["class"] == "no-skill")
        def baseline(case):
            if case["id"] == no_skill:
                return "mk-explain"
            return confused.get(case["expected"], case["expected"])
        result = compare_restructure(self.before, self.after, records(self.before, self.cases, baseline),
                                     records(self.after, self.remapped, lambda c: c["expected"]), self.cases, self.identity)
        self.assertEqual(result["status"], "matched_restructure", result["confounds"])
        self.assertEqual(result["owner_accuracy"]["after"], 1.0)
        self.assertEqual(result["false_activations_on_no_skill"], {"before": 1, "after": 0})
        # watzup and sumup collapse into one owner, so confusing them is not a miss.
        self.assertEqual(result["transitions"]["fixed"], [no_skill])
        self.assertIn("no-skill", result["by_class"])

    def test_removed_skill_picked_on_no_skill_prompt_stays_a_false_activation(self):
        identity = copy.deepcopy(self.identity)
        identity["mappings"][2] = {"from": "mk-mermaidjs-v11", "to": [], "kind": "remove"}
        after_catalog = copy.deepcopy(self.after_catalog)
        after_catalog["skills"] = [s for s in after_catalog["skills"] if s["id"] != "mk-mermaid"]
        remapped = remap_cases(self.cases, identity, self.before_catalog, after_catalog)
        before, after = report(self.before_catalog, self.cases, "holdout"), report(after_catalog, remapped, "holdout")
        no_skill = next(c["id"] for c in self.cases["cases"] if c["split"] == "holdout" and c["class"] == "no-skill")
        removed_case = next(c["id"] for c in self.cases["cases"] if c["split"] == "holdout" and c["expected"] == "mk-mermaidjs-v11")
        def baseline(case):
            return "mk-mermaidjs-v11" if case["id"] == no_skill else case["expected"]
        result = compare_restructure(before, after, records(before, self.cases, baseline),
                                     records(after, remapped, lambda c: c["expected"]), self.cases, identity)
        self.assertEqual(result["status"], "matched_restructure", result["confounds"])
        self.assertEqual(result["false_activations_on_no_skill"], {"before": 1, "after": 0})
        self.assertEqual(result["transitions"], {"fixed": [no_skill], "regressed": []})
        # The removed skill's own case maps to none, and the baseline's correct pick
        # of the removed skill is not penalised.
        self.assertNotIn(removed_case, result["transitions"]["regressed"])
        self.assertEqual(result["per_owner"]["mk-mermaidjs-v11"]["before"], {"FP": 1})

    def test_near_miss_expecting_none_keeps_its_class(self):
        cases = copy.deepcopy(self.cases)
        target = next(c for c in cases["cases"] if c["split"] == "holdout" and c["class"] == "near-miss")
        target["expected"] = "none"
        remapped = remap_cases(cases, self.identity, self.before_catalog, self.after_catalog)
        before, after = report(self.before_catalog, cases, "holdout"), report(self.after_catalog, remapped, "holdout")
        result = compare_restructure(before, after, records(before, cases, lambda c: "mk-fix" if c["id"] == target["id"] else c["expected"]),
                                     records(after, remapped, lambda c: c["expected"]), cases, self.identity)
        self.assertEqual(result["status"], "matched_restructure", result["confounds"])
        self.assertEqual(result["false_activations_on_no_skill"], {"before": 0, "after": 0})
        self.assertEqual(result["transitions"]["fixed"], [target["id"]])
        self.assertNotIn(target["id"], result["transitions"]["regressed"])

    def test_candidate_cases_must_derive_from_identity_map(self):
        tampered = copy.deepcopy(self.remapped)
        tampered["cases"][0]["expected"] = "none"
        self.after["cases_hash"] = fingerprint(tampered)
        result = compare_restructure(self.before, self.after, [], [], self.cases, self.identity)
        self.assertEqual(result["status"], "confounded")
        self.assertIn("candidate_cases_not_derived_from_identity_map", result["confounds"])

    def test_runtime_difference_is_a_confound(self):
        self.after["runtime"] = dict(self.after["runtime"], version="other")
        result = compare_restructure(self.before, self.after, [], [], self.cases, self.identity)
        self.assertEqual((result["status"], result["confounds"]), ("confounded", ["runtime"]))


class CommandLineTests(unittest.TestCase):
    def test_catalog_from_snapshot_and_remap_commands(self):
        with tempfile.TemporaryDirectory() as tmp:
            before, after, out = Path(tmp, "before.json"), Path(tmp, "after.json"), Path(tmp, "remapped.json")
            self.assertEqual(main(["catalog-from-snapshot", "--snapshot", str(SNAPSHOTS / "engineer.json"), "--output", str(before)]), 0)
            after.write_text(json.dumps(restructured(load(before))))
            code = main(["remap", "--cases", str(ASSETS / "max-kit-engineer-cases.json"), "--identity-map", str(IDENTITY_EXAMPLE),
                         "--catalog", str(before), "--candidate-catalog", str(after), "--output", str(out)])
            self.assertEqual(code, 0)
            self.assertNotIn("mk-watzup", {c["expected"] for c in load(out)["cases"]})


if __name__ == "__main__":
    unittest.main()
