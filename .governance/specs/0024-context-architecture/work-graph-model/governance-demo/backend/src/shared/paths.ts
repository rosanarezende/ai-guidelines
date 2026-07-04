// paths.ts — fronteiras físicas da demo de governança.
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const BACKEND_ROOT = path.join(here, "..", "..");
export const SIM_ROOT = path.join(BACKEND_ROOT, "..");
export const WORK_GRAPH_ROOT = path.join(SIM_ROOT, "..");
export const GOVERNANCE_ROOT = path.join(SIM_ROOT, "acme", "governance");
export const REPOS_ROOT = path.join(SIM_ROOT, "acme", "repos");
export const READ_MODEL_EXAMPLES_ROOT = path.join(BACKEND_ROOT, "examples", "read-models");
export const INTEGRATION_CATALOG_FILE = path.join(WORK_GRAPH_ROOT, "integration-catalog.yml");
