# Methods

> Stub. Each section gets filled in as the corresponding pipeline step is implemented.
> Every number the app shows must be traceable to a section here.

## Question

If a fire starts at a given ignition point under a given wind, can a canyon neighborhood
finish evacuating before the fire arrives, and where is the trigger line at which the
evacuation order must be given?

## Study area

<!-- config/bbox.yaml; pilot communities; why these canyons. -->

## Terrain

<!-- USGS 3DEP DEM: product, resolution, CRS, derived slope/aspect. -->

## Fuels

<!-- LANDFIRE LF2024 FBFM40 + canopy layers; alignment to the DEM grid; known gaps. -->

## Wind scenarios (WindNinja)

<!-- Direction x speed sweep, initialization (domain-average vs HRRR), solver, mesh,
     output height. Worst case = one speed class up (see caveats). -->

## Fire spread and time of arrival (ELMFIRE)

<!-- Ignition selection, simulation duration, spotting settings, outputs. -->

## Evacuation clearance time

<!-- Households x vehicles per household, exit lanes and per-lane capacity (cite source),
     mobilization time. Formula and every parameter's provenance. -->

## Trigger line

<!-- Where the fire's remaining travel time to the community equals clearance time plus
     a safety margin. Background: Cova et al. (2005) trigger points; WUIVAC. -->

## Verdict

<!-- How projection + clearance combine into the verdict shown in the panel. -->

## Validation: 2017 La Tuna Fire hindcast

<!-- `tp hindcast-latuna`: setup, comparison data, metrics, results. -->

## Limitations and caveats

<!-- HRRR/WindNinja underprediction in lee canyons; LF2024 misses post-Oct-2024
     disturbances; ember spotting; anything else discovered. -->

## References

<!-- Full citations. -->
