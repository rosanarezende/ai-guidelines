import { useEffect, useRef, useState } from "react";
import { auth, WebContainer } from "@webcontainer/api";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

import { simulatorProjectById } from "@content/simulatorProjects";

import "./RealCliRunner.css";
import copy from "./locales/pt-BR.json";

/**
 * Modo "Rodar de verdade" (enhancement opcional, desktop): boota a CLI REAL no
 * navegador via WebContainer (Node real) + xterm. Nada aqui é SSOT: se faltar
 * header, clientId, rede ou for mobile, o simulador projetado (fallback)
 * continua sendo a experiência principal.
 *
 * Carregado de forma preguiçosa (lazy) — `@webcontainer/api` + xterm ficam num
 * chunk separado e só baixam quando a pessoa ativa este modo.
 */

const CLIENT_ID: string =
  (import.meta.env.VITE_WEBCONTAINER_CLIENT_ID as string | undefined) ??
  "wc_api_rosanarezende_8aac9870783ba75f6634c81bc0f4cd1f";

type RunStatus = "booting" | "installing" | "running" | "error";

interface RealCliPackageManifest {
  readonly source: "latest" | "current";
  readonly packageSpec: string;
  readonly displayCommand: string;
  readonly label: string;
}

const FALLBACK_MANIFEST: RealCliPackageManifest = {
  source: "latest",
  packageSpec: "ai-guidelines@latest",
  displayCommand: "npx ai-guidelines",
  label: "versão publicada no npm",
};

let webContainerAuthPromise: Promise<void> | undefined;

function isAlreadyInitializedError(error: unknown): boolean {
  return error instanceof Error && /init should only be called once/i.test(error.message);
}

function ensureWebContainerAuth(): Promise<void> {
  webContainerAuthPromise ??= Promise.resolve()
    .then(() => {
      try {
        auth.init({ clientId: CLIENT_ID, scope: "" });
      } catch (error) {
        if (!isAlreadyInitializedError(error)) throw error;
      }
    })
    .catch((error) => {
      webContainerAuthPromise = undefined;
      throw error;
    });

  return webContainerAuthPromise;
}

function resolvePackageSpec(packageSpec: string): string {
  if (packageSpec.startsWith("/")) {
    return new URL(packageSpec, window.location.href).href;
  }
  return packageSpec;
}

async function loadRealCliPackageManifest(): Promise<RealCliPackageManifest> {
  try {
    const response = await fetch(new URL("/real-cli-package.json", window.location.href), {
      cache: "no-store",
    });
    if (!response.ok) return FALLBACK_MANIFEST;
    const manifest = (await response.json()) as Partial<RealCliPackageManifest>;
    if (
      (manifest.source === "latest" || manifest.source === "current") &&
      typeof manifest.packageSpec === "string" &&
      typeof manifest.displayCommand === "string" &&
      typeof manifest.label === "string"
    ) {
      return manifest as RealCliPackageManifest;
    }
  } catch {
    /* fallback below */
  }
  return FALLBACK_MANIFEST;
}

export function RealCliRunner({ context }: { readonly context: string }): JSX.Element {
  const termHostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<RunStatus>("booting");
  const [errorMessage, setErrorMessage] = useState("");
  const [packageLabel, setPackageLabel] = useState("");

  useEffect(() => {
    let disposed = false;
    let teardown: (() => void) | undefined;

    async function boot(): Promise<void> {
      try {
        const project = simulatorProjectById(context);
        if (!project.supportsRealMode) {
          setErrorMessage(project.unsupportedRealModeReason ?? copy.unsupportedScenario);
          setStatus("error");
          return;
        }

        await ensureWebContainerAuth();
        if (disposed) return;

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
        await container.mount(project.files as never);

        const manifest = await loadRealCliPackageManifest();
        const packageSpec = resolvePackageSpec(manifest.packageSpec);
        setPackageLabel(manifest.label);

        setStatus("installing");
        term.writeln(`$ ${manifest.displayCommand}`);
        const proc = await container.spawn(
          "npm",
          ["exec", "--yes", "--package", packageSpec, "--", "ai-guidelines"],
          {
            terminal: { cols: term.cols, rows: term.rows },
          }
        );
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
            ? copy.installing.replace("{package}", packageLabel || copy.packageFallback)
            : status === "running"
              ? copy.running
              : `${copy.error}: ${errorMessage}`}
      </p>
      <div className="realCliTerm" ref={termHostRef} />
    </div>
  );
}

export default RealCliRunner;
