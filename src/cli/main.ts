#!/usr/bin/env node
import { buildRegistry } from "./registry/buildRegistry.js";
import { runCockpit } from "./cockpit.js";

interface Logger {
  info(message: string): void;
  error(message: string): void;
}

const logger: Logger = {
  info: (message) => process.stdout.write(`${message}\n`),
  error: (message) => process.stderr.write(`${message}\n`),
};

function renderHelp(): string {
  return `ai-guidelines CLI

Uso:
  npm run guidelines -- <comando> [opções]

═══ COMANDOS (registry) ═══

${buildRegistry().renderHelp()}

═══ FLUXO SITUADO (onde procurar cada passo) ═══

  Retomar contexto:        npm run guidelines -- handoff [spec]
  Verificar frescor:       npm run handoff:check -- [--spec NNNN]
  Briefing de trabalho:    npm run guidelines -- work [--authorization explicit-work-request]
  Pedir review governado:  npm run guidelines -- review <tipo>
  Catálogo/policy:         npm run guidelines -- review types | review policy
  Decisões do humano:      npm run guidelines -- decide [--brief-only] [--type <tipo>]
  Preparar Ready:          npm run pr-ready:check -- --pr <n>
  Gate local completo:     npm run validate

═══ OPÇÕES GERAIS ═══

  --target <dir>             Diretório alvo (default: diretório atual)
  --name <project_name>      Nome do projeto (default: nome da pasta alvo)
  --package-manager <pm>     npm | pnpm | yarn | yarn@1.22.22 | yarn@4.1.1
  --providers <lista>        claude,cursor,copilot,windsurf,gemini,aider,openai
  --lang <pt|en>             Idioma para features (ex: tdd, bdd). Padrão: pt
  --force                    Sobrescreve arquivos suportados
  --force-prettier           Força baseline Prettier mesmo com formatter rival
  --dry-run                  Mostra ações sem escrever arquivos
  --install                  Instala dependências automaticamente
  --prune                    Remove arquivos órfãos em .ai-guidelines/ (adopt/update)
  --yes, -y                  Aceita defaults do comando quando suportado

═══ CONTRATO ARQUITETURAL ═══

  AI-as-Channel (ADR 0018): nenhum LLM embutido no runtime.
  Governance precede execução (ADR 0020 + ADR 0021): decisões estruturais
  fechadas antes da execução; tasks.md é boundary de autorização.
`;
}

export async function run(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  const repoRoot = process.cwd();
  const [commandName] = argv;

  if (commandName === "--help" || commandName === "-h") {
    logger.info(renderHelp());
    return 0;
  }

  if (!commandName) {
    return runCockpit(repoRoot, logger);
  }

  const result = await buildRegistry().dispatch(argv, { repoRoot, logger });
  return result.exitCode;
}

export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<void> {
  try {
    const exitCode = await run(argv);
    if (exitCode !== 0) process.exitCode = exitCode;
  } catch (error) {
    logger.error(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

void main();
