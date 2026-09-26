# Data sources

> Stub. For each source fill in: what it is, what we use it for, how we get it,
> license/attribution, the vintage we used, and known issues. The vintage must match
> what `manifest.json` records in `dataVintages`.

## Live (the only runtime network call)

### NWS API (api.weather.gov)

<!-- Alerts (Red Flag Warning, Fire Weather Watch) and gridpoint forecast via /api/weather.
     User-Agent requirement, caching, units. -->

## Precomputed inputs

### HRRR

<!-- Initializes WindNinja for hindcasts; archive source; cycles used. -->

### Synoptic (station observations)

<!-- Station obs for context and wind validation; API token is server-side only. -->

### ELMFIRE

<!-- Model, version, license. -->

### WindNinja

<!-- Model, version, license. -->

### LANDFIRE LF2024 (FBFM40 and canopy layers)

<!-- Layers, version, access method, post-Oct-2024 disturbance gap. -->

### USGS 3DEP DEM

<!-- Product, resolution, tile IDs. -->

### US Census ACS 5-year

<!-- Tables for households and vehicles available, geography (block group), vintage. -->

### OpenStreetMap

<!-- Road network and lane tags; extract date; ODbL attribution. -->

### City of Glendale Safety Element, Appendix C

<!-- Evacuation routes/exits; document version and date. -->

## Display only (not used in analysis)

### Basemap: OpenFreeMap

<!-- Style URL in web/src/config/map.ts; OSM/OpenMapTiles attribution. -->

### Terrain tiles: AWS Terrain Tiles (terrarium)

<!-- 3D terrain and hillshade in the map only; analysis uses 3DEP. Attribution. -->
