<!--
═════════════════════════════════════════════════════════════════════════════
TÍTULO do PR — segue `.core/process/pr-title-conventions.md`:

  [<emojis>] [<label-opcional>] [<identificador>] <título curto>

Conjuntos fechados:
- Emojis: 🧾 (governance) · 🛠️ (execution) · 🔗 (integration)
         · 🔒 (governance contract) · 1️⃣2️⃣3️⃣ (order) · ➜ (downstream)
         · 🚑 (fast-track)
- Labels textuais opcionais: [Bootstrap] · [Pre-model] · [Hotfix]
- Identificador: [Spec NNNN] OU [<pillar>] (fix, patch, spike, incident, etc.)

Exemplos:
  [🛠️4️⃣] [Spec 0023] PR5: hardening final do runtime
  [🔗] [Integration] [Spec 0023] Homologação final da stack
  [🧾🔒] [Spec 0024] Lifecycle bootstrap
  [🛠️] [fix] Reorganize package.json scripts
═════════════════════════════════════════════════════════════════════════════
-->

<!--
═════════════════════════════════════════════════════════════════════════════
GOVERNANÇA VISUAL (OBRIGATÓRIA — artefato oficial do ciclo, não anexo)

As imagens são projeções gateadas pelo estado epistêmico da spec. NÃO são
decorativas: existem para zerar o custo cognitivo de quem revisa e adota.
`governance-pr-check` FALHA o gate se a imagem exigida faltar (cf. matriz).

  Imagem            | Obrigatória em               | Slot
  ----------------- | ---------------------------- | ----------------------------
  #1 Visão pretendida | todo Ready (PR de execução)  | "## Visão pretendida"
  #3 Valor entregue   | todo Ready (PR de execução)  | "## Valor entregue"
  #4 Convergência     | Integration PR               | (no template do Integration)
  #2 Capacidade       | opcional (recomendada)       | "## Capacidade construída"

Quando: a imagem é AUTORADA no marco de máximo contexto (#1 ao abrir o Draft;
#3 ao levar a Ready) — AI-as-Channel (ADR 0018): a IA que prepara o PR produz o
prompt FINAL e a imagem é gerada no gerador externo; só a IMAGEM (durável) vive
aqui. No encerramento, as versões finais são promovidas para `assets/` (gate R4).

Formato aceito (o check exige `![…](url)` OU `<img … src=…>` dentro da seção):
  ![visão](URL)   ·   <img src="URL" width="760"/>
  Before/After:
  <table><tr>
    <td align="center"><strong>ANTES</strong><br/><img src="URL_ANTES" width="380"/></td>
    <td align="center"><strong>DEPOIS</strong><br/><img src="URL_DEPOIS" width="380"/></td>
  </tr></table>

Draft é isento (intenção em formação): preencha as imagens ANTES de marcar Ready.
═════════════════════════════════════════════════════════════════════════════
-->

## Visão pretendida

<!-- #1 — o problema + a solução pretendida. Obrigatória em Ready. Cole `![visão](URL)`. -->

## Valor entregue

<!-- #3 — antes/depois do valor deste slice (sintomas→capacidades). Obrigatória em Ready. Cole a imagem.
     #2 Capacidade construída (opcional, recomendada) pode entrar aqui como "## Capacidade construída". -->

## Status do ciclo de vida

> Lifecycle: <kbd>Draft</kbd> → <kbd>Ready for review</kbd> → <kbd>Authorized to merge</kbd>
>
> **Ready ≠ Mergeable** (cf. [ADR 0024](../.core/governance/adrs/0024-draft-ready-mergeable-distinct-states.md)).
> Em stacks governance-first (cf. [ADR 0020](../.core/governance/adrs/0020-governance-precede-execution.md)), integração ocorre em sequência atômica ponta-a-ponta; conversão `Draft → Ready` **não** autoriza merge.

- [ ] **Draft** — trabalho em andamento; não solicita review ainda
- [ ] **Ready for review** — operacionalmente concluído; aguarda revisão humana

<!--
"Authorized to merge" é ato humano explícito — registrado na seção "Merge
authorization" abaixo como texto, não como checkbox. ADR 0024 separa os
3 estados para impedir leitura "Ready = mergeable".
-->

## PR Type

Escolha **uma** opção (mova 🔘 para a sua; deixe ⚪ nas outras):

- ⚪ 🧾 **Governance** — spec/decision-brief/plan/tasks/research/ADR
- ⚪ 🛠️ **Execution** — código + docs derivados
- ⚪ 🔗 **Integration** — homologação/convergência final da stack; sem comportamento novo
- ⚪ 🚑 **Fast-track** — patch/fix/incident pequeno (accountability transferida; cf. [ADR 0021](../.core/governance/adrs/0021-enforcement-precedes-awareness.md))

## Posição na stack

- **Stack atual**: <!-- ex.: "3 de 6 na stack 0023" OU "isolado" -->
- **Upstream (depends on)**: <!-- #prev OU "main" -->
- **Downstream (followed by)**: <!-- #next OU "terminal" -->

Tipo de merge (escolha **uma**; mova 🔘 para a sua):

- ⚪ **Mergeable isoladamente** — sem stack governance-first
- ⚪ **Apenas merge atômico ponta-a-ponta** — stack governance-first (per ADR 0020)
- ⚪ **Integration PR** — agrega evidência de convergência; não autoriza merge sozinho

## Merge authorization

**Owner authorization**: pendente / autorizada em <!-- YYYY-MM-DD -->

<!--
Owner edita esta linha quando autorizar. Para stacks governance-first (ADR 0020),
autorização vale para a stack inteira quando todos os PRs estão Ready.
Antes disso: deixe "pendente". Esta seção é texto, não checklist — `Ready` não
implica autorização automática (cf. ADR 0024).
-->

## Resumo

<!--
Explique o valor entregue e a mudança operacional observável.
Não duplique conteúdo de spec.md / decision-brief.md — referencie via Cross-refs.

Se houver impacto downstream (consumidores via `adopt`, breaking changes,
migração necessária), descreva explicitamente aqui — não há seção dedicada
porque a maioria dos PRs não tem; mas quando tem, é informação crítica.
-->

## Test plan

<!--
Resumo curto: como o reviewer valida? Comandos chave + 1-2 observações.
Para runtime/wizard/UX: explique o caminho de uso real, não apenas "tests green".
Para governance: cite os artefatos que mudam de estado (DECs, ADRs, status agregado).
-->

<details>
<summary><strong>Test plan detalhado (opcional — comandos completos, coverage report, smoke matrix)</strong></summary>

<!--
Para PRs grandes, cole aqui:
- comandos completos de validação (yarn ci, smoke multi-OS, etc.)
- coverage report ou delta vs baseline
- fluxos exploratórios manuais
- screenshots/logs relevantes

Para PRs pequenos, pode deletar este bloco — o resumo acima basta.
-->

</details>

## Cross-refs

- **Spec**: <!-- `.governance/specs/<id-slug>/` OU ausente -->
- **ADRs aplicáveis**: <!-- ex.: ADR 0020, 0024 OU nenhum -->
- **DECs aplicáveis**: <!-- ex.: DEC-0023-J01 OU nenhum -->
- **Linked issue**: <!-- #123 OU ausente -->

## Checklist operacional

- [ ] `yarn format ; yarn validate` verde antes do push
- [ ] Commits atômicos por unidade lógica (per `[CORE-06]`); mensagens em pt-BR
- [ ] Decisões arquiteturais cravadas em ADR ou decision-brief quando cabíveis
- [ ] Sem credenciais/secrets/contexto pessoal vazado

## Disclosure de IA

Implementação assistida por IA.

<!--
DUAS partes, propositalmente separadas (Spec 0024, Checkpoint 2.4d):

1. A linha acima é EDITORIAL — frase padrão do template, editável. Não é dado
   governado, schema nem check. Se este PR for puro-humano, edite/remova.

2. Os FATOS DE PROCESSO abaixo são DERIVADOS de reviews/gates via topologia
   (G07), não escritos à mão. Para PRs de spec, gere e cole:

     yarn disclosure

   Responde "como o trabalho foi produzido e validado?" (nº de revisões,
   categorias, findings emitidos/resolvidos, gate humano) — NÃO "quem
   participou?". Cole o bloco derivado aqui:
-->

<!-- fatos-derivados:início -->
<!-- (cole a saída de `yarn disclosure`; vazio até haver revisão registrada em artefato) -->
<!-- fatos-derivados:fim -->

<details>
<summary><strong>Notas qualitativas (opcional — divergências, segunda opinião, nuance)</strong></summary>

<!--
Só o que a evidência derivada NÃO captura (julgamento humano):
- divergências documentadas (onde escolheu A vs B, citação do raciocínio)
- gates humanos por commit (CORE-07/14)
Participação por ator NÃO vive aqui nem em artefato dedicado — disclosure é
projeção de processo, não de participantes (decisão do 2.4d).
-->

</details>
