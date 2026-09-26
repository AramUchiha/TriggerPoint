"""`tp` command line. Every command is a stub that prints its plan and exits nonzero.

Commands run roughly in this order:
    fetch-dem -> fetch-fuels -> build-communities -> run-windninja -> run-elmfire -> export-web
with hindcast-latuna as the validation run. See docs/methods.md.
"""

import typer

app = typer.Typer(
    help="Trigger Point precompute pipeline. Outputs land in web/public/scenarios/.",
    no_args_is_help=True,
    add_completion=False,
)


def _todo(command: str, plan: list[str]) -> None:
    typer.echo(f"TODO: `tp {command}` is not implemented yet. Planned steps:", err=True)
    for step in plan:
        typer.echo(f"  - {step}", err=True)
    raise typer.Exit(code=1)


@app.command("fetch-dem")
def fetch_dem() -> None:
    """Download the USGS 3DEP DEM for the study area (config/bbox.yaml) into raw/dem/."""
    _todo(
        "fetch-dem",
        [
            "Query the USGS TNM / 3DEP service for 1/3 arc-second (~10 m) tiles covering the bbox",
            "Mosaic and reproject to UTM 11N (EPSG:32611); record product IDs and dates",
            "Derive slope and aspect for ELMFIRE into work/terrain/",
        ],
    )


@app.command("fetch-fuels")
def fetch_fuels() -> None:
    """Download LANDFIRE LF2024 fuels and canopy layers for the study area into raw/landfire/."""
    _todo(
        "fetch-fuels",
        [
            "Request FBFM40, CC, CH, CBH, CBD for the bbox from the LANDFIRE Product Service",
            "Align to the DEM grid; record the LANDFIRE version for every layer",
            "Flag disturbances after Oct 2024 that LF2024 cannot know about (manual review)",
        ],
    )


@app.command("build-communities")
def build_communities() -> None:
    """Build community polygons with households, vehicles per household and exits."""
    _todo(
        "build-communities",
        [
            "Define community polygons (city boundaries / Safety Element Appendix C)",
            "Aggregate Census ACS 5-year households and vehicles available by block group",
            "Attach exits from config/exits.yaml, cross-checked against OSM lanes tags",
            "Write provenance (table, vintage, URL) for every number",
        ],
    )


@app.command("run-windninja")
def run_windninja() -> None:
    """Run WindNinja (docker/windninja) for every wind direction x speed in the scenario sweep."""
    _todo(
        "run-windninja",
        [
            "Build the direction x speed sweep, including a worst case one speed class up",
            "Run WindNinja on the DEM for each case (domain-average init for planning sweeps)",
            "Write speed/direction grids plus run config to work/windninja/",
        ],
    )


@app.command("run-elmfire")
def run_elmfire() -> None:
    """Run ELMFIRE (docker/elmfire) for each ignition in config/ignitions.yaml x wind field."""
    _todo(
        "run-elmfire",
        [
            "Stage fuels, terrain and the WindNinja field for each ignition x wind case",
            "Run ELMFIRE and collect time-of-arrival rasters (minutes since ignition)",
            "Record ELMFIRE version, inputs and settings alongside every output",
        ],
    )


@app.command("hindcast-latuna")
def hindcast_latuna() -> None:
    """Validation: re-run the 2017 La Tuna Fire (Verdugo Mountains) and compare to the record."""
    _todo(
        "hindcast-latuna",
        [
            "Initialize WindNinja from archived HRRR for the fire's first burning period",
            "Run ELMFIRE from the reported origin with pre-fire fuels",
            "Compare against the mapped perimeter (e.g. CAL FIRE FRAP) and report the fit",
        ],
    )


@app.command("export-web")
def export_web() -> None:
    """Convert work/ products into web/public/scenarios/ and write manifest.json."""
    _todo(
        "export-web",
        [
            "Export wind fields, arrival grids, contours, trigger lines and communities",
            "Validate every file against the contracts in web/src/types/scenario.ts",
            "Write manifest.json with the method per file and data vintages",
        ],
    )


if __name__ == "__main__":
    app()
