#!/usr/bin/env python3
"""Ownership contract: mk-media is the only owner of video compression.

Composition and motion skills render and hand delivery encoding to this skill;
no other skill ships a compression or web-video audit implementation, and no
duplicate FFmpeg/compress-video skill exists.
"""

import json
import re
from pathlib import Path

import pytest

SKILL_DIR = Path(__file__).resolve().parents[2]
KITS = SKILL_DIR.parents[2]
OWNER = "mk-media"
OWNED_SCRIPTS = {"video_optimize.py", "video_probe.py", "video_web_audit.py", "capture_rendered_videos.mjs"}


def frontmatter(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    match = re.match(r"---\n(.*?)\n---\n", text, re.S)
    assert match, f"{path} has no frontmatter"
    return match.group(1)


def all_skill_dirs():
    return [p.parent for p in KITS.glob("*/skills/*/SKILL.md")]


def test_owner_descriptor_covers_web_video():
    meta = frontmatter(SKILL_DIR / "SKILL.md")
    assert re.search(r"^name: mk-media$", meta, re.M)
    when = re.search(r"^when_to_use: (.*)$", meta, re.M).group(1).lower()
    assert "compress" in when and "web video" in when


def test_owner_references_and_scripts_exist():
    body = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")
    assert "references/web-video-optimization.md" in body
    for name in OWNED_SCRIPTS:
        assert (SKILL_DIR / "scripts" / name).is_file(), name
    reference = (SKILL_DIR / "references" / "web-video-optimization.md").read_text(encoding="utf-8")
    for script in ("video_optimize.py", "video_web_audit.py", "capture_rendered_videos.mjs"):
        assert script in reference


def test_no_duplicate_compression_skill():
    names = {d.name for d in all_skill_dirs()}
    duplicates = sorted(n for n in names if re.search(r"ffmpeg|compress|video-optim", n))
    assert duplicates == [], f"video compression belongs to {OWNER}: {duplicates}"


def test_no_other_skill_ships_the_implementation():
    offenders = []
    for skill in all_skill_dirs():
        if skill.name == OWNER:
            continue
        offenders += [str(p.relative_to(KITS)) for p in skill.rglob("*") if p.name in OWNED_SCRIPTS]
    assert offenders == []


def skill_dir(name: str):
    return next((d for d in all_skill_dirs() if d.name == name), None)


def test_composition_skills_delegate_delivery_encoding():
    for name in ("mk-remotion", "mk-hyperframes"):
        skill = skill_dir(name)
        assert skill is not None, f"{name} is missing"
        assert OWNER in (skill / "SKILL.md").read_text(encoding="utf-8"), name


def test_routing_cases_expect_the_owner_for_compression_prompts():
    creator = skill_dir("mk-skill-creator")
    if creator is None:
        pytest.skip("mk-skill-creator is not ported yet; its routing cases hold the expectations")
    cases = []
    for path in sorted((creator / "assets/semantic-routing").glob("*-cases.json")):
        cases += json.loads(path.read_text(encoding="utf-8"))["cases"]
    compression = [c for c in cases if re.search(r"\bcompress|encoded larger", c["prompt"], re.I)]
    assert len(compression) >= 3
    assert {c["expected"] for c in compression} == {OWNER}
