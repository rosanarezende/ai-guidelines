// index.mjs — shim de compatibilidade dos CLIs. A implementação ativa é
// TypeScript em ./src (Node >= 22.18 roda .ts nativo via type stripping).
// Não adicione lógica aqui; feature nova entra em ./src.
export * from "./src/index.ts";
