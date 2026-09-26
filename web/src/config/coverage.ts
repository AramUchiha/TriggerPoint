import manifest from "../../public/scenarios/manifest.json";
import type { BBox } from "@/lib/geo";
import { ScenarioManifestSchema } from "@/types/scenario";

/** Area the app covers. Fire drops outside it are rejected. */
export const COVERAGE_BBOX: BBox = ScenarioManifestSchema.parse(manifest).bbox;
