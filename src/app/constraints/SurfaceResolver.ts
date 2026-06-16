import { GovernanceError } from "../../domain/shared/errors.js";
import { SurfaceClass } from "../../domain/constraints/Constraint.js";
import {
  formatSurfaceRef,
  parseSurfaceRef,
  SurfaceNamespace,
  SurfaceRef,
} from "../../domain/constraints/SurfaceRef.js";

/**
 * Superfície RESOLVIDA — o resultado normalizado de um {@link SurfaceResolver}.
 *
 * Carrega só o derivado mínimo: a ref, namespace/nome, e os fatos que a fonte
 * viva expõe (classe observável quando há; `mutates` quando há; proveniência).
 * O `command` completo e demais campos da `script-contracts.yml` NÃO entram aqui
 * (nem no binding persistido) — são re-derivados sob demanda da fonte canônica.
 */
export interface ResolvedSurface {
  readonly ref: string;
  readonly namespace: SurfaceNamespace;
  readonly name: string;
  /** Classe observável derivada da FONTE (quando derivável). `undefined` = não-derivável. */
  readonly observableClass?: SurfaceClass;
  /** Se a superfície muta estado (npm-script). `undefined` quando não-derivável. */
  readonly mutates?: boolean;
  /** Fonte canônica onde foi resolvida. */
  readonly source: string;
  /** Metadados mínimos derivados (ex.: command/category | command/subcommand). */
  readonly metadata?: Readonly<Record<string, string>>;
}

/** Um resolver concreto por namespace. Resolve FORMA→fato; lança se inexistente. */
export interface SurfaceResolver {
  readonly namespace: SurfaceNamespace;
  resolve(ref: SurfaceRef): ResolvedSurface;
}

/**
 * Dispatcher determinístico: roteia uma superfície namespaced ao resolver do seu
 * namespace. Namespace parseável mas sem resolver registrado → erro explícito
 * (ex.: um pipeline só com `npm-script` falha sobre `registry-command:…`,
 * provando que o resolver de registry é necessário e não fingido).
 */
export class SurfaceResolverRegistry {
  private readonly byNamespace = new Map<SurfaceNamespace, SurfaceResolver>();

  constructor(resolvers: readonly SurfaceResolver[]) {
    for (const resolver of resolvers) {
      if (this.byNamespace.has(resolver.namespace)) {
        throw new Error(`Resolver duplicado para namespace "${resolver.namespace}".`);
      }
      this.byNamespace.set(resolver.namespace, resolver);
    }
  }

  /** `"npm-script:gate-decidability:check"` → {@link ResolvedSurface} (lança em falha). */
  resolve(surface: string): ResolvedSurface {
    const ref: SurfaceRef = parseSurfaceRef(surface); // namespace ausente/não-suportado/nome vazio
    const resolver = this.byNamespace.get(ref.namespace);
    if (!resolver) {
      throw new GovernanceError(
        "SURFACE_RESOLVER_ABSENT",
        `Sem resolver registrado para o namespace "${ref.namespace}" (${formatSurfaceRef(ref)}).`
      );
    }
    return resolver.resolve(ref);
  }
}
