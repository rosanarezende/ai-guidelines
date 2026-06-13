import { GovernanceError } from "../shared/errors.js";

/**
 * Value Object: referência **namespaced** a uma superfície de enforcement (CO-3).
 *
 * Uma superfície é o ponto operacional onde um {@link EnforcementBinding} incide.
 * O namespace torna a ref **resolvível de forma não-ambígua** a partir de uma
 * fonte viva específica — sem colidir com outra (PIT-0008): `npm-script:*`
 * resolve por `script-contracts.yml`; `registry-command:*` resolve pelo
 * `CommandRegistry`. A `SurfaceRef` NÃO carrega os dados derivados (command,
 * mutates, category): esses são resolvidos sob demanda e nunca duplicados no
 * binding.
 *
 * Split no PRIMEIRO `:` — o nome de um npm-script já contém `:` internos
 * (`gate-decidability:check`), então só o primeiro separador delimita o
 * namespace.
 */
export const SURFACE_NAMESPACES = ["npm-script", "registry-command"] as const;

export type SurfaceNamespace = (typeof SURFACE_NAMESPACES)[number];

export interface SurfaceRef {
  readonly namespace: SurfaceNamespace;
  /** Resto após o namespace (com `:` internos preservados). Não-vazio. */
  readonly name: string;
}

export function isSurfaceNamespace(value: unknown): value is SurfaceNamespace {
  return typeof value === "string" && (SURFACE_NAMESPACES as readonly string[]).includes(value);
}

/**
 * `"npm-script:gate-decidability:check"` → `{ namespace, name }` (validado).
 *
 * - Sem separador (`:`): namespace AUSENTE → `SURFACE_NAMESPACE_MISSING`.
 * - Namespace fora do allow-list: NÃO-SUPORTADO → `SURFACE_NAMESPACE_UNSUPPORTED`.
 * - Nome vazio após o namespace → `SURFACE_NAME_EMPTY`.
 */
export function parseSurfaceRef(value: string): SurfaceRef {
  const sep = value.indexOf(":");
  if (sep <= 0) {
    throw new GovernanceError(
      "SURFACE_NAMESPACE_MISSING",
      `Superfície "${value}" sem namespace — esperado "<namespace>:<nome>" ` +
        `(namespaces: ${SURFACE_NAMESPACES.join("|")}).`
    );
  }
  const namespace = value.slice(0, sep);
  const name = value.slice(sep + 1).trim();
  if (!isSurfaceNamespace(namespace)) {
    throw new GovernanceError(
      "SURFACE_NAMESPACE_UNSUPPORTED",
      `Namespace de superfície não-suportado: "${namespace}" em "${value}" ` +
        `(suportados nesta versão: ${SURFACE_NAMESPACES.join("|")}).`
    );
  }
  if (name.length === 0) {
    throw new GovernanceError(
      "SURFACE_NAME_EMPTY",
      `Superfície "${value}" com nome vazio após o namespace "${namespace}".`
    );
  }
  return { namespace, name };
}

/** `{ namespace, name }` → `"npm-script:gate-decidability:check"`. */
export function formatSurfaceRef(ref: SurfaceRef): string {
  return `${ref.namespace}:${ref.name}`;
}
