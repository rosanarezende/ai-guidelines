#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { execute, main } from "./app/engine.mjs";

const __filename = fileURLToPath(import.meta.url);

export { execute, main };

// Em macOS, `os.tmpdir()` retorna `/var/folders/...` que é symlink para
// `/private/var/folders/...`. Node resolve symlinks ao carregar o módulo,
// fazendo `import.meta.url` apontar para `/private/...` enquanto
// `process.argv[1]` mantém o caminho literal `/var/...`. Comparar sem
// realpath faz a CLI sair silenciosamente sem rodar `main()` quando
// instalada num sandbox sob `/var/folders/...` (consumidor via `npx`
// ou suíte smoke). `realpathSync` normaliza ambos os lados.
function resolvedPathsAreEqual(a, b) {
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return false;
  }
}

if (process.argv[1] && resolvedPathsAreEqual(process.argv[1], __filename)) {
  await main();
}
