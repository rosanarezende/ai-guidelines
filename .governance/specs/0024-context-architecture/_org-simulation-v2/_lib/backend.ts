// backend.ts — escolhe o ADAPTER de um repo pela config DELE (Lente 5: backend plugável por repo).
// Lê `<repo>/.governance/backend.yml`: kind=neo4j → Neo4jRepository (via docker-compose do repo) · senão → FileRepository.
// Devolve a porta `Repository` + um `close()` (o Neo4j tem driver pra fechar; o File é noop). O resto da lib não muda.
import type { Repository } from "./ports.ts";
import { FileRepository } from "./adapters/file/FileRepository.ts";
import { Neo4jRepository, neo4jDriver } from "./adapters/neo4j/Neo4jRepository.ts";
import { SqliteRepository } from "./adapters/sqlite/SqliteRepository.ts";
import { exists, readYaml } from "./adapters/file/io.ts";

interface BackendConfig {
  kind?: "file" | "neo4j" | "sqlite";
  uri?: string;
  user?: string;
  password?: string;
}

export interface OpenedRepo {
  repo: Repository;
  close: () => Promise<void>;
}

function configOf(repo: string): BackendConfig {
  const rel = `${repo}/.governance/backend.yml`;
  return exists(rel) ? readYaml<BackendConfig>(rel) : {};
}

/** o tipo de backend do repo (pra log/diagnóstico). */
export function backendOf(repo: string): "file" | "neo4j" | "sqlite" {
  return configOf(repo).kind ?? "file";
}

/** abre a porta Repository do repo no backend declarado. Lembre de `await close()`. */
export function openRepository(repo: string): OpenedRepo {
  const cfg = configOf(repo);
  if (cfg.kind === "neo4j") {
    const driver = neo4jDriver(
      cfg.uri ?? process.env.NEO4J_URI ?? "bolt://localhost:7687",
      cfg.user ?? process.env.NEO4J_USER ?? "neo4j",
      cfg.password ?? process.env.NEO4J_PASSWORD ?? "simsim123"
    );
    return { repo: new Neo4jRepository(repo, driver), close: () => driver.close() };
  }
  if (cfg.kind === "sqlite") {
    const r = new SqliteRepository(repo); // relacional embarcado (node:sqlite); o dado é um .governance/governance.db
    return { repo: r, close: async () => r.close() };
  }
  return { repo: new FileRepository(repo), close: async () => {} };
}
