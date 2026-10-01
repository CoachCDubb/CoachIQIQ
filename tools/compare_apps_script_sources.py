#!/usr/bin/env python3
"""Read-only comparison of two Apps Script source directories."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


SOURCE_SUFFIXES = {".gs", ".html"}
MANIFEST = "appsscript.json"


def source_inventory(root: Path) -> dict[str, str]:
    """Return relative source paths and SHA-256 hashes without changing files."""
    if not root.is_dir():
        raise ValueError(f"Source directory does not exist: {root}")
    inventory: dict[str, str] = {}
    for path in sorted(root.iterdir()):
        if not path.is_file():
            continue
        if path.name != MANIFEST and path.suffix not in SOURCE_SUFFIXES:
            continue
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        inventory[path.name] = digest
    return inventory


def compare_sources(baseline: Path, candidate: Path) -> dict[str, object]:
    baseline_files = source_inventory(baseline)
    candidate_files = source_inventory(candidate)
    baseline_names = set(baseline_files)
    candidate_names = set(candidate_files)
    shared = baseline_names & candidate_names
    return {
        "baseline": str(baseline.resolve()),
        "candidate": str(candidate.resolve()),
        "baselineCount": len(baseline_files),
        "candidateCount": len(candidate_files),
        "onlyInBaseline": sorted(baseline_names - candidate_names),
        "onlyInCandidate": sorted(candidate_names - baseline_names),
        "different": sorted(name for name in shared if baseline_files[name] != candidate_files[name]),
        "identical": sorted(name for name in shared if baseline_files[name] == candidate_files[name]),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline", required=True, type=Path)
    parser.add_argument("--candidate", required=True, type=Path)
    parser.add_argument("--require-match", action="store_true", help="Exit nonzero when any source differs.")
    args = parser.parse_args()
    if args.baseline.resolve() == args.candidate.resolve():
        parser.error("Baseline and candidate must be different directories.")
    report = compare_sources(args.baseline, args.candidate)
    print(json.dumps(report, indent=2))
    changed = bool(report["onlyInBaseline"] or report["onlyInCandidate"] or report["different"])
    return 1 if args.require_match and changed else 0


if __name__ == "__main__":
    raise SystemExit(main())
