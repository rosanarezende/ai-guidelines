// paths.mjs — fronteiras fisicas da org simulada v3.
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const SIM_ROOT = path.join(here, "..");
export const GOVERNANCE_ROOT = path.join(SIM_ROOT, "acme-governance");
export const REPOS_ROOT = path.join(SIM_ROOT, "repos");
