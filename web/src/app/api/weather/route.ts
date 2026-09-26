/**
 * GET /api/weather: server-side proxy to the National Weather Service API. NOT IMPLEMENTED.
 *
 * This is the app's only live data path; everything else is precomputed static files.
 *
 * TODO(nws-proxy):
 * 1. Upstream is https://api.weather.gov. NWS requires a User-Agent that identifies the app
 *    and a contact, e.g. "TriggerPoint (ops@example.gov)". Read it from NWS_USER_AGENT
 *    (server-only env var; never NEXT_PUBLIC_). Send `Accept: application/geo+json`.
 * 2. Endpoints: /points/{lat},{lon} resolves the forecast office and grid (cache for days,
 *    it rarely changes) -> /gridpoints/{wfo}/{x},{y} for wind speed/gust/direction and RH;
 *    /alerts/active?point={lat},{lon} for Red Flag Warnings and Fire Weather Watches.
 * 3. Caching: honour upstream Cache-Control/Expires; revalidate forecasts ~10 min and alerts
 *    ~1-2 min. Keep the last good response and serve it, flagged stale with its issuance
 *    time, when upstream fails or the demo is offline. Never invent a value to fill a gap.
 * 4. Units: gridpoint values are SI with WMO unit codes (wmoUnit:km_h-1, wmoUnit:degC,
 *    wmoUnit:degree_(angle)) over ISO 8601 intervals ("2025-01-07T18:00:00+00:00/PT1H").
 *    Convert to mph / degF and expand intervals in pure, tested functions in src/lib/;
 *    keep wind direction as degrees FROM.
 * 5. Validate the upstream JSON with zod and return a small typed payload that includes
 *    issuance/update times and source URLs so the UI can label provenance.
 */
export function GET() {
  return Response.json(
    { error: "Not implemented", detail: "NWS proxy is a TODO; see src/app/api/weather/route.ts." },
    { status: 501 },
  );
}
