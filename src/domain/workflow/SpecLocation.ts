/**
 * Resolução do caminho físico de uma spec ativa.
 *
 * `source` distingue topologia nova (`governance`) de bridge (`specify-legacy`).
 * Runtime trata as duas como fontes legítimas (double-lookup);
 * UI sinaliza ao humano quando a spec ainda vive em `.specify/`.
 */

export type SpecSource = "governance" | "specify-legacy";

export interface SpecLocation {
  readonly slug: string;
  readonly absolutePath: string;
  readonly source: SpecSource;
}
