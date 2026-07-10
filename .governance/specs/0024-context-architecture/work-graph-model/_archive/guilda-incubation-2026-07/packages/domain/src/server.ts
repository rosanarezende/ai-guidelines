// Server-side shared kernel da governance-demo.
// Use este entrypoint somente em runtime Node. Superficies browser devem
// importar @demo/domain ou @demo/contracts.
export * from "./index.ts";
export * from "./policy/org-domain.ts";
export * from "./policy/commands.ts";
export * from "./sources/repo-projections.ts";
export * from "./graph/build.ts";
export * from "./policy/stable-digest.ts";
