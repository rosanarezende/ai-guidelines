import { useEffect, useRef, useState } from "react";
import { auth, WebContainer } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

import "./RealCliRunner.css";
import copy from "./locales/pt-BR.json";

/**
 * Modo "Rodar de verdade" (enhancement opcional, desktop): boota a CLI REAL no
 * navegador via WebContainer (Node real) + xterm — exatamente a abordagem do
 * clack. Nada aqui é SSOT: se faltar header, clientId, rede ou for mobile, o
 * simulador projetado (fallback) continua sendo a experiência principal.
 *
 * Carregado de forma preguiçosa (lazy) — `@webcontainer/api` + xterm ficam num
 * chunk separado e só baixam quando a pessoa ativa este modo.
 */

const CLIENT_ID: string =
  (import.meta.env.VITE_WEBCONTAINER_CLIENT_ID as string | undefined) ??
  "wc_api_rosanarezende_8aac9870783ba75f6634c81bc0f4cd1f";

type RunStatus = "booting" | "installing" | "running" | "error";

function operationFor(context: string): "init" | "adopt" | "update" {
  if (context === "empty") return "init";
  if (context === "governed") return "update";
  return "adopt";
}

/** Árvore de arquivos montada no container, por contexto (espelha as fixtures). */
function filesFor(context: string): Record<string, unknown> {
  if (context === "existing" || context === "conflict") {
    const pkg: Record<string, unknown> = { name: "meu-projeto", version: "1.0.0" };
    if (context === "conflict") pkg.devDependencies = { "@biomejs/biome": "^1.9.0" };
    return { "package.json": { file: { contents: `${JSON.stringify(pkg, null, 2)}\n` } } };
  }
  if (context === "governed") {
    return {
      "package.json": {
        file: {
          contents: `${JSON.stringify({ name: "meu-projeto", version: "2.1.0" }, null, 2)}\n`,
        },
      },
      ".ai-guidelines": {
        directory: { "config.json": { file: { contents: "{}\n" } } },
      },
    };
  }
  return {};
}

export function RealCliRunner({ context }: { readonly context: string }): JSX.Element {
  const termHostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<RunStatus>("booting");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let disposed = false;
    let teardown: (() => void) | undefined;

    async function boot(): Promise<void> {
      try {
        auth.init({ clientId: CLIENT_ID, scope: "" });
        const term = new Terminal({ convertEol: true, fontSize: 13, cursorBlink: true });
        const fit = new FitAddon();
        term.loadAddon(fit);
        if (termHostRef.current) {
          term.open(termHostRef.current);
          fit.fit();
        }

        const container = await WebContainer.boot({ coep: "require-corp", workdirName: "demo" });
        if (disposed) {
          container.teardown();
          term.dispose();
          return;
        }
        await container.mount(filesFor(context) as never);

        const operation = operationFor(context);
        setStatus("installing");
        term.writeln(`$ npx ai-guidelines ${operation}`);
        const proc = await container.spawn("npx", ["-y", "ai-guidelines@latest", operation], {
          terminal: { cols: term.cols, rows: term.rows },
        });
        void proc.output.pipeTo(
          new WritableStream({
            write(data) {
              term.write(data);
            },
          })
        );
        const writer = proc.input.getWriter();
        term.onData((data) => {
          void writer.write(data);
        });
        if (!disposed) setStatus("running");

        teardown = () => {
          try {
            container.teardown();
          } catch {
            /* noop */
          }
          term.dispose();
        };
      } catch (error) {
        if (!disposed) {
          setErrorMessage(error instanceof Error ? error.message : String(error));
          setStatus("error");
        }
      }
    }

    void boot();
    return () => {
      disposed = true;
      teardown?.();
    };
  }, [context]);

  return (
    <div className="realCli">
      <p className="realCliStatus" role="status">
        {status === "booting"
          ? copy.booting
          : status === "installing"
            ? copy.installing
            : status === "running"
              ? copy.running
              : `${copy.error}: ${errorMessage}`}
      </p>
      <div className="realCliTerm" ref={termHostRef} />
    </div>
  );
}

export default RealCliRunner;
