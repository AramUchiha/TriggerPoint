import { z } from "zod";

/**
 * Contracts for everything the pipeline exports to web/public/scenarios/.
 * All loaded data is parsed with these schemas before use (see CLAUDE.md).
 *
 * Units are in field names: wind in mph (US fire-weather convention), directions
 * in degrees the wind blows FROM (meteorological), times in minutes, lengths in metres.
 */

const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a kebab-case id");

/** Degrees clockwise from true north, [0, 360). */
const DirectionDeg = z.number().min(0).lt(360);

/** [west, south, east, north] in WGS84 degrees. */
export const BBoxSchema = z
  .tuple([z.number(), z.number(), z.number(), z.number()])
  .refine(([w, s, e, n]) => w < e && s < n, "bbox must be [west, south, east, north]");

/** [longitude, latitude] in WGS84 degrees. */
export const LonLatSchema = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);

/** Where a value came from. Every exported number must trace to one. */
export const ProvenanceSchema = z.object({
  /** e.g. "US Census ACS 5-year, table B25044". */
  source: z.string().min(1),
  /** e.g. "2019-2023", "LF2024", "HRRR 2025-01-07T18Z". */
  vintage: z.string().min(1),
  url: z.url().optional(),
  notes: z.string().optional(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

/** The model or process that produced an exported file. */
export const MethodSchema = z.object({
  model: z.enum(["WindNinja", "ELMFIRE", "derived", "source-data"]),
  version: z.string().min(1),
  /** e.g. "HRRR-initialized, mass-conserving, 100 m mesh". */
  configuration: z.string().min(1),
  notes: z.string().optional(),
});
export type Method = z.infer<typeof MethodSchema>;

export const IgnitionSchema = z.object({
  id: Slug,
  name: z.string().min(1),
  lonLat: LonLatSchema,
  /** Why this location (historic ignition, roadside, powerline corridor...), with its source. */
  rationale: z.string().min(1),
});
export type Ignition = z.infer<typeof IgnitionSchema>;

export const ScenarioFileKindSchema = z.enum([
  "wind-field",
  "arrival-grid",
  "arrival-contours",
  "trigger-line",
  "communities",
]);

export const ScenarioFileSchema = z.object({
  /** Relative to /scenarios/. */
  path: z.string().min(1),
  kind: ScenarioFileKindSchema,
  ignitionId: Slug.optional(),
  windDirectionDeg: DirectionDeg.optional(),
  windSpeedMph: z.number().nonnegative().optional(),
  method: MethodSchema,
});
export type ScenarioFile = z.infer<typeof ScenarioFileSchema>;

/** Index of a precomputed scenario set: /scenarios/manifest.json. */
export const ScenarioManifestSchema = z.object({
  schemaVersion: z.literal(1),
  /** Null until the pipeline has exported anything. */
  generatedAt: z.iso.datetime({ offset: true }).nullable(),
  bbox: BBoxSchema,
  ignitions: z.array(IgnitionSchema),
  /** Wind directions swept (degrees FROM). */
  windDirectionsDeg: z.array(DirectionDeg),
  /** Domain-average input wind speeds swept (mph at 20 ft). */
  windSpeedsMph: z.array(z.number().positive()),
  files: z.array(ScenarioFileSchema),
  /** Dataset vintages keyed by dataset, e.g. "dem", "fuels", "census", "roads". */
  dataVintages: z.record(z.string(), ProvenanceSchema),
});
export type ScenarioManifest = z.infer<typeof ScenarioManifestSchema>;

/** A regular raster grid. Row-major, starting at the north-west corner. */
export const GridSpecSchema = z.object({
  /** CRS the model ran in, e.g. "EPSG:32611" (UTM 11N). */
  crs: z.string().min(1),
  /** WGS84 bounds, for placing the grid on the map. */
  bbox: BBoxSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  cellSizeM: z.number().positive(),
});
export type GridSpec = z.infer<typeof GridSpecSchema>;

/** A WindNinja output field for one direction x speed scenario. */
export const WindFieldSchema = z
  .object({
    id: Slug,
    /** Domain-average input direction (degrees FROM). */
    windDirectionDeg: DirectionDeg,
    /** Domain-average input speed (mph at 20 ft). */
    windSpeedMph: z.number().nonnegative(),
    /** Output height above vegetation. */
    outputHeightM: z.number().positive(),
    method: MethodSchema,
    grid: GridSpecSchema,
    speedMph: z.array(z.number().nonnegative()),
    directionDeg: z.array(DirectionDeg),
  })
  .superRefine((field, ctx) => {
    const cells = field.grid.width * field.grid.height;
    for (const key of ["speedMph", "directionDeg"] as const) {
      if (field[key].length !== cells) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `expected ${cells} values (width x height), got ${field[key].length}`,
        });
      }
    }
  });
export type WindField = z.infer<typeof WindFieldSchema>;

/** Metadata for an ELMFIRE time-of-arrival raster; the pixels live in a sibling binary file. */
export const ArrivalGridMetaSchema = z.object({
  id: Slug,
  ignitionId: Slug,
  windDirectionDeg: DirectionDeg,
  windSpeedMph: z.number().nonnegative(),
  method: MethodSchema,
  grid: GridSpecSchema,
  /** Raster file, relative to /scenarios/. */
  path: z.string().min(1),
  // TODO(export-web): settle on one encoding once the first ELMFIRE run exists.
  encoding: z.enum(["float32-le", "uint16-png"]),
  units: z.literal("minutes"),
  /** Pixel value meaning "fire did not arrive within the simulation". */
  noDataValue: z.number(),
  simulationDurationMin: z.number().positive(),
});
export type ArrivalGridMeta = z.infer<typeof ArrivalGridMetaSchema>;

export const ExitSchema = z.object({
  name: z.string().min(1),
  /** Outbound lanes usable during an evacuation. */
  lanes: z.number().int().positive(),
  source: ProvenanceSchema,
});
export type Exit = z.infer<typeof ExitSchema>;

export const CommunitySchema = z.object({
  id: Slug,
  name: z.string().min(1),
  households: z.number().int().nonnegative(),
  vehiclesPerHousehold: z.number().nonnegative(),
  exits: z.array(ExitSchema).min(1),
  provenance: z.object({
    households: ProvenanceSchema,
    vehiclesPerHousehold: ProvenanceSchema,
  }),
});
export type Community = z.infer<typeof CommunitySchema>;
