import { ActiveSpecEntry, ActiveSpecsRoot } from "../../domain/workflow/ActiveSpecEntry.js";
import { WorkflowFileSystem } from "../ports/WorkflowFileSystem.js";

/**
 * Lê o índice operacional público (`.governance/runtime/active-specs.yml`) e
 * resolve cada entry contra o disco local.
 *
 * Responsabilidades:
 *   - leitura do contrato (delegada ao parser injetado, [DEC-0023-G02]);
 *   - drift guard de ambiente (cada entry recebe `specPathExists` derivado
 *     de uma checagem de diretório, com warning narrativo quando ausente).
 *
 * O drift guard é **soft**: paths ausentes localmente não falham — podem
 * apenas indicar que a branch da spec ainda não foi checked out. Caller
 * decide se ignora. Falhas duras ficam reservadas para violações de
 * contrato (schema), que são propagadas pelo parser.
 */

const INDEX_PATH = ".governance/runtime/active-specs.yml";

export interface ResolvedActiveSpec {
  readonly entry: ActiveSpecEntry;
  /** True quando `spec_path` do índice resolve para um diretório local. */
  readonly specPathExists: boolean;
}

export interface ListActiveSpecsResult {
  /** True quando o índice foi encontrado e parseado com sucesso. */
  readonly indexAvailable: boolean;
  readonly entries: ReadonlyArray<ResolvedActiveSpec>;
  /** Diagnósticos não-fatais (índice ausente; paths divergentes). */
  readonly warnings: ReadonlyArray<string>;
}

/**
 * Parser injetado pelo composition root (cf. boundary lock — app não
 * importa infra direto). Implementação concreta vive em
 * `infrastructure/yaml/activeSpecsSerializer.ts`.
 */
export type ActiveSpecsParser = (yamlText: string) => ActiveSpecsRoot;

export class ListActiveSpecs {
  constructor(
    private readonly fs: WorkflowFileSystem,
    private readonly parser: ActiveSpecsParser
  ) {}

  run(): ListActiveSpecsResult {
    if (!this.fs.fileExists(INDEX_PATH)) {
      return {
        indexAvailable: false,
        entries: [],
        warnings: [
          `Index "${INDEX_PATH}" not found. Run \`yarn workflow publish-state\` from the spec branch to populate the public index.`,
        ],
      };
    }

    const yamlText = this.fs.readTextFile(INDEX_PATH);
    const root = this.parser(yamlText);

    const entries: ResolvedActiveSpec[] = root.activeSpecs.map((entry) => ({
      entry,
      specPathExists: this.fs.directoryExists(entry.specPath),
    }));

    const warnings = entries
      .filter((resolved) => !resolved.specPathExists)
      .map(
        (resolved) =>
          `Spec "${resolved.entry.slug}" declares spec_path "${resolved.entry.specPath}" in the index, but the directory is missing locally. ` +
          `Branch "${resolved.entry.branch}" may not be checked out, or the path may have been renamed since last publish-state.`
      );

    return { indexAvailable: true, entries, warnings };
  }
}
