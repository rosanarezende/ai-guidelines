// Browser-safe shared kernel da governance-demo.
// Este entrypoint pode ser importado pelo frontend. Modulos que dependem de
// Node ou de validadores server-only ficam em @demo/domain/server.
export * from "./workspace/adoption-shell.ts";
export * from "./onboarding/adoption-commands.ts";
export * from "./authority/adoption-authorization.ts";
export * from "./workspace/governance.ts";
export * from "./policy/i18n.ts";
export * from "./graph/query.ts";
export * from "./control-plane/portal-spike.ts";
