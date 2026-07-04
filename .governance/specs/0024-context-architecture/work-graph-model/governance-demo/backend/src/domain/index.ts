// index.ts — contrato compartilhado BROWSER-SAFE do domínio (tipos + funções
// puras sem imports de node:*). Componentes client importam daqui via
// @demo/backend/domain. O domínio server-side (validador, comandos, projeções,
// build do grafo — usam node:crypto) é exportado pelo SDK raiz (src/index.ts).
export * from "./adoption-shell.ts";
export * from "./adoption-commands.ts";
export * from "./adoption-authorization.ts";
export * from "./governance.ts";
export * from "./i18n.ts";
export * from "./graph/query.ts";
