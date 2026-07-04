// governance-server.ts — gateway servidor do app para o backend.
// O app consome o SDK tipado (@demo/backend); a montagem do snapshot, comandos
// e catálogo moram na camada de aplicação do backend, não aqui.
export {
  loadGovernanceSnapshot,
  loadIntegrationCatalog,
  dryRunCommand,
  executeCommand,
} from "@demo/backend";
