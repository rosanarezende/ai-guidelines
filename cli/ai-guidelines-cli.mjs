import path from "node:path";
import { fileURLToPath } from "node:url";
import { execute, main } from "./core/engine.mjs";

const __filename = fileURLToPath(import.meta.url);

export { execute, main };

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await main();
}
