/**
 * Erro determinístico do domínio de governança.
 * `code` é estável (case/snake) para reuso em mensagens e testes.
 */
export class GovernanceError extends Error {
  public readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "GovernanceError";
    this.code = code;
  }
}
