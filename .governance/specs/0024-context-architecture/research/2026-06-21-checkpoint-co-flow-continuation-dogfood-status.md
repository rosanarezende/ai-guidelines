# PR #44 — Dogfood/Status: reparo de drift + candidato de produto "PR Progress Map"

Data: 2026-06-21
Spec: 0024 — context-architecture
Checkpoint: `checkpoint-co-flow-continuation` (CO-10.8.1)
PR: #44 — `co-flow-continuation`
Natureza: dogfood/status. **Narrativa útil, não autoridade** — em divergência, vencem
`state.yml`, testes e revisões.

---

## 1. O que esta fatia entrega (e o que NÃO entrega)

Esta fatia começa a transformar **drift em reparo seguro** — não resolve os 8 drifts.

- Já existia, de antes: **detectar** e **explicar** alguns drifts em linguagem humana
  (comando `drift` / GovernanceDoctor). Detectar e explicar **não resolvem** nada sozinhos.
- Esta fatia adiciona a **camada de reparo** e implementa **um único caso de ponta a ponta**:
  **Drift #1 — "estou na branch certa, mas o framework ainda aponta para a anterior"**
  (branch atual diverge de `active.yml`).
- O reparo do Drift #1 segue o contrato: detectar → explicar → gerar plano → **preview antes de
  escrever** → **aplicar só com confirmação** → revalidar. Autoridade `confirm` (determinístico,
  mas escreve). Reparos que envolvem topologia, Ready, Human Gate, merge ou decisão semântica
  ficam como `human-decision`/`blocked` e **não** são automatizados.

Os outros sete drifts seguem em diagnóstico/explicação (parcial ou a fazer) e aparecem no tracker
para acompanhamento — sem promessa de reparo nesta fatia.

---

## 2. Dor observada (que motivou o tracker)

Durante o PR #44, a mantenedora (Rosana) observou que, em trabalhos grandes:

- Um PR grande exige acompanhar **várias frentes ao mesmo tempo**.
- Olhar só os arquivos internos, `tasks.md`, commits ou a conversa com a IA **não é suficiente**
  para uma revisão humana confortável.
- A mantenedora precisa entender rapidamente, de forma visual, **o que já está detectado,
  explicado, reparado, testado e ainda pendente** — e onde estão os gaps.

Em resumo: faltava uma **visão humana e visual do progresso**, separada das fontes técnicas.

---

## 3. Hipótese de produto — "PR Progress Map" (nome provisório)

Criar um artefato que seja uma **projeção visual do estado de um PR**, legível por humanos:

- Mostra cada frente do PR e em que etapa ela está.
- Ajuda humanos a **acompanhar o avanço e identificar lacunas**.
- **Não substitui** `state.yml`, `tasks.md`, reviews, gates ou testes — é complementar.
- Não pode virar uma **segunda fonte de verdade** manual e divergente.

Primeira materialização: `assets/drift-tracker.html` (versionado neste PR), que projeta os 8 drifts
de governança em cinco status e quatro etapas humanas.

---

## 4. Regras desejadas para esse tipo de artefato

- Deve ser **versionado no repo** quando o PR for grande ou tiver várias frentes.
- Deve usar **linguagem humana** (compreensível por quem nunca participou da conversa).
- Deve separar claramente as etapas: **detectar / explicar / reparar / testar /
  documentar-refletir**.
- Deve deixar explícito que **detectar/explicar não significa resolver**.
- Deve manter **detalhes técnicos recolhidos** ou secundários (nomes de arquivos internos não são
  o texto principal).
- Deve **apontar para evidências, testes ou artefatos canônicos** quando existirem.
- **Não pode** virar uma segunda fonte de verdade manual e divergente — é projeção de
  acompanhamento, não autoridade.

---

## 5. Critério de decisão futura

- Se o tracker ajudar de fato a **conduzir o PR #44**, avaliar transformar a prática em
  **feature/padrão** do ai-guidelines.
- Evolução ideal: o framework **gerar ou validar** esse mapa a partir dos artefatos governados
  (em vez de manutenção manual), fechando o risco de divergência.

---

## 6. Fronteira (o que NÃO fazer agora)

- **Não** implementar o "PR Progress Map" como regra global do framework nesta fatia.
- Registrar apenas como **dogfood / candidato de produto** neste PR.
- O foco da implementação atual continua sendo o **Drift #1** e a **camada de reparo seguro com
  preview**.

---

## 7. Status técnico desta fatia (honesto)

Código e testes escritos no repositório (via file tools), pendentes de execução/validação:

- Novos: `src/cli/repair/RepairPlan.ts`, `CapturingWorkflowFileSystem.ts`,
  `branchProjectionRepair.ts`, `governanceRepair.ts`; comando `src/cli/registry/commands/RepairDriftCommand.ts`
  (registrado em `buildRegistry.ts`); locale `src/cli/copy/locales/pt-BR/governanceRepair.json`.
- Testes positivos: `src/cli/repair/branchProjectionRepair.test.ts` e
  `src/cli/registry/commands/RepairDriftCommand.test.ts` (contratos: o plano contém a ação
  esperada; o preview lista os arquivos afetados; a execução altera somente o permitido).
- Tracker humano: `assets/drift-tracker.html`.

**Nota de ambiente:** nesta sessão de Cowork, o sandbox de shell ficou com cópias dessincronizadas
dos arquivos pré-existentes editados (o `tsc`/`jest` liam versões truncadas) e o git local ficou
travado. Por isso **`build`, `test:ts`, `validate` e os commits desta fatia precisam ser executados
fora deste sandbox** (terminal da mantenedora ou ferramenta com acesso direto ao repositório).
Os arquivos no repositório real estão íntegros; o que falta é rodar a verificação e commitar.

Comandos de verificação previstos:

```
npm run build
npm run test:ts -- RepairDriftCommand branchProjectionRepair
npm run validate
```
