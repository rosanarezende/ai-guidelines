import { spawn } from "node:child_process";

import { ClipboardWriter } from "../../app/ports/ClipboardWriter.js";

/**
 * Comando que escreve no clipboard do sistema operacional.
 *
 * Detectado uma vez no construtor; cache pra evitar re-resolução
 * em cada chamada de `copy()`.
 */
interface ClipboardCommand {
  readonly command: string;
  readonly args: ReadonlyArray<string>;
}

/**
 * Detecta o comando de clipboard apropriado para o ambiente.
 *
 * Estratégia:
 * - macOS (`darwin`) → `pbcopy` (sempre presente).
 * - Linux com Wayland (`WAYLAND_DISPLAY` set) → `wl-copy`.
 * - Linux com X11 (default) → `xclip -selection clipboard`.
 * - Outros → `null` (clipboard indisponível; fallback gracioso).
 *
 * Não testa se o binário existe antecipadamente — falha gracioso no `spawn`
 * via `error` event quando o comando não está instalado.
 */
function detectClipboardCommand(): ClipboardCommand | null {
  if (process.platform === "darwin") {
    return { command: "pbcopy", args: [] };
  }
  if (process.platform === "linux") {
    if (process.env.WAYLAND_DISPLAY) {
      return { command: "wl-copy", args: [] };
    }
    return { command: "xclip", args: ["-selection", "clipboard"] };
  }
  return null;
}

/**
 * Implementação real do clipboard usando subprocesso.
 *
 * Detecção do comando acontece uma vez no construtor (injetável para tests).
 * `copy()` é fail-graceful: retorna `false` em qualquer falha (comando
 * ausente, subprocesso quebrado, plataforma não suportada) — clipboard é
 * conveniência, não barreira (cf. [DEC-0023-B01]).
 */
export class NodeClipboard implements ClipboardWriter {
  private readonly cmd: ClipboardCommand | null;

  constructor(detector: () => ClipboardCommand | null = detectClipboardCommand) {
    this.cmd = detector();
  }

  copy(text: string): Promise<boolean> {
    if (!this.cmd) return Promise.resolve(false);

    return new Promise((resolve) => {
      try {
        // `detached: true` + `unref()` + `stdio.pipe-ignore-ignore` para
        // não bloquear o event loop do Node esperando o subprocess morrer.
        // `wl-copy` e `xclip` permanecem em background como daemons do
        // clipboard por design — não vamos forçá-los a morrer. Após
        // `stdin.end()` o conteúdo já foi transferido; não esperamos o
        // evento `close`.
        const proc = spawn(this.cmd!.command, this.cmd!.args.slice(), {
          detached: true,
          stdio: ["pipe", "ignore", "ignore"],
        });
        let settled = false;
        const settle = (value: boolean) => {
          if (!settled) {
            settled = true;
            resolve(value);
          }
        };
        proc.on("error", () => settle(false));
        proc.stdin.on("error", () => settle(false));
        proc.stdin.write(text, (err) => {
          if (err) {
            settle(false);
            return;
          }
          proc.stdin.end(() => {
            proc.unref();
            settle(true);
          });
        });
      } catch {
        resolve(false);
      }
    });
  }
}
