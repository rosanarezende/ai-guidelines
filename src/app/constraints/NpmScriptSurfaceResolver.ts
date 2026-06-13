import { GovernanceError } from "../../domain/shared/errors.js";
import { formatSurfaceRef, SurfaceRef } from "../../domain/constraints/SurfaceRef.js";
import { ResolvedSurface, SurfaceResolver } from "./SurfaceResolver.js";

/**
 * Contrato de UM npm-script, derivado de `.core/governance/script-contracts.yml`
 * (`profiles.maintainer.package_scripts`). O resolver consome esses fatos
 * injetados — nunca lê o arquivo direto (purо/testável). O binding contém apenas
 * `npm-script:<nome>`; command/category/mutates/consumers são DERIVADOS aqui.
 */
export interface NpmScriptContract {
  readonly name: string;
  readonly command: string;
  readonly category: string;
  readonly mutates: boolean;
  readonly consumers?: readonly string[];
  readonly description?: string;
}

export const SCRIPT_CONTRACTS_SOURCE = ".core/governance/script-contracts.yml";

/**
 * Resolve `npm-script:<nome>` pela fonte canônica de scripts. A **classe
 * observável** (event|state) NÃO é derivável honestamente de `script-contracts`
 * (`mutates`/`category` não a determinam) — então fica `undefined` e a classe
 * declarada é validada só contra o mecanismo, não contra a superfície
 * (limitação declarada, sem inventar certeza).
 */
export class NpmScriptSurfaceResolver implements SurfaceResolver {
  readonly namespace = "npm-script" as const;
  private readonly byName: Map<string, NpmScriptContract>;

  constructor(scripts: readonly NpmScriptContract[]) {
    this.byName = new Map(scripts.map((s) => [s.name, s]));
  }

  resolve(ref: SurfaceRef): ResolvedSurface {
    const script = this.byName.get(ref.name);
    if (!script) {
      throw new GovernanceError(
        "SURFACE_NOT_FOUND",
        `npm-script inexistente: "${ref.name}" não está em ${SCRIPT_CONTRACTS_SOURCE}.`
      );
    }
    return {
      ref: formatSurfaceRef(ref),
      namespace: ref.namespace,
      name: ref.name,
      mutates: script.mutates,
      source: SCRIPT_CONTRACTS_SOURCE,
      metadata: { command: script.command, category: script.category },
    };
  }
}
