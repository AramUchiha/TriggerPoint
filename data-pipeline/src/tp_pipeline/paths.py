"""Filesystem layout shared by all pipeline commands."""

from pathlib import Path

PIPELINE_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = PIPELINE_ROOT.parent

CONFIG_DIR = PIPELINE_ROOT / "config"
RAW_DIR = PIPELINE_ROOT / "raw"  # downloaded source data, never edited (gitignored)
WORK_DIR = PIPELINE_ROOT / "work"  # intermediate products and model runs (gitignored)

# Everything the web app loads. Only manifest.json is committed.
WEB_SCENARIOS_DIR = REPO_ROOT / "web" / "public" / "scenarios"
