"""Load and validate files in data-pipeline/config/."""

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml

from tp_pipeline.paths import CONFIG_DIR


@dataclass(frozen=True)
class BBox:
    """Study-area bounds in WGS84 degrees."""

    west: float
    south: float
    east: float
    north: float

    def __post_init__(self) -> None:
        if not (-180 <= self.west < self.east <= 180 and -90 <= self.south < self.north <= 90):
            raise ValueError(f"invalid bbox: {self}")

    def as_list(self) -> list[float]:
        """[west, south, east, north], the order the web manifest uses."""
        return [self.west, self.south, self.east, self.north]


def _read_yaml(name: str, config_dir: Path = CONFIG_DIR) -> dict[str, Any]:
    with (config_dir / name).open() as f:
        data = yaml.safe_load(f)
    if not isinstance(data, dict):
        raise ValueError(f"{name}: expected a mapping at the top level")
    return data


def load_bbox(config_dir: Path = CONFIG_DIR) -> BBox:
    data = _read_yaml("bbox.yaml", config_dir)
    if data.get("crs") != "EPSG:4326":
        raise ValueError("bbox.yaml: crs must be EPSG:4326")
    return BBox(
        west=float(data["west"]),
        south=float(data["south"]),
        east=float(data["east"]),
        north=float(data["north"]),
    )
