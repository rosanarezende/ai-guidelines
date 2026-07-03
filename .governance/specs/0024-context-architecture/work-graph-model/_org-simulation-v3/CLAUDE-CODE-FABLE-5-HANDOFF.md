# Handoff — Claude Code com Fable 5

> Uso pretendido: voltar ao Claude Code depois desta rodada, usando Fable 5 para continuar a sim v3.
> Base pública verificada em 2026-07-02: docs oficiais da Anthropic/Claude Code.

## Fatos verificados

- Fable 5 está documentado como o modelo mais capaz no Claude Code para tarefas maiores que uma sessão; no Claude Code ele é selecionado com `/model fable`.
- Requer Claude Code `v2.1.170+` e não é o padrão.
- É indicado para problemas ambíguos e longos: investigação de causa raiz, debugging de incidentes, decisões arquiteturais e tarefas que normalmente seriam quebradas em várias fatias.
- Usa adaptive thinking sempre ligado; a recomendação de migração é não tentar desligar thinking.
- O esforço (`effort`) é o principal controle de custo/latência/capacidade: `high` como default, `xhigh` só para o que for sensível/capability-bound.
- Não está disponível em zero data retention; a documentação oficial cita requisito de 30 dias de retenção.
- Classificadores de segurança podem recusar/fazer fallback, especialmente em domínios cyber/bio. Para este repo, prompts de segurança devem ser formulados como validação defensiva e com escopo explícito.

Fontes:

- https://code.claude.com/docs/en/model-config
- https://platform.claude.com/docs/en/about-claude/models/overview
- https://platform.claude.com/docs/en/about-claude/models/migration-guide
- https://www.anthropic.com/news/redeploying-fable-5

## Como extrair mais valor neste repo

Use Fable 5 para **objetivo grande + contrato de verificação**, não para microtarefas.

Formato recomendado:

```text
Objetivo: evoluir a sim v3 até <resultado observável>.

Contexto obrigatório:
- Leia model.yml, tracker.md, _org-simulation-v3/README.md, NEXT-STEPS.md e o diff/HEAD atual.
- Respeite o layout sanitizado: host central em _org-simulation-v3/acme-governance/; repos adotados em _org-simulation-v3/repos/<repo>/; standalone repo-local em repos/<repo>/.governance/works/*.yml; incidentes centrais em acme-governance/incidents/.
- Repo vence memória/transcript.
- Não avance Ready/Gate/merge.

Critério de sucesso:
- mecanismo fail-closed;
- fixture adversarial que falha antes/passa depois;
- adoption-journey verde;
- hooks normais de commit/push verdes; validações extras só quando a fatia exigir e, se recorrentes, devem virar hook/CI;
- relatório separando fatos, interpretação e riscos.

Autonomia:
- investigue antes de editar;
- faça commits incrementais normais;
- pare se encontrar decisão humana real.
```

## O que mudar em relação a prompts antigos

- Dê o resultado e as restrições; não prescreva todos os passos.
- Evite lembretes repetidos de “teste tudo”; use um critério de sucesso verificável.
- Entregue pacotes maiores: Fable 5 tende a compensar em tarefas longas quando há espaço para investigar e verificar.
- Use `xhigh` só para revisão adversarial, arquitetura difícil ou migração com muitos arquivos. Para iteração normal, comece em `high`.
- Para segurança, peça “validação defensiva contra fixtures locais” e evite linguagem de exploração ofensiva.

## Primeiro prompt sugerido

```text
Estamos em ai-guidelines, Spec 0024, PR #45. Continue apenas dentro do checkpoint ativo.

Objetivo: revisar a sim v3 após a rodada Codex que implementou outcome real, lifecycle repo-local,
contratos com interface, trust-policy, layout repo-first sanitizado, runtime _lib v3, app Next/MUI,
comandos governados, exemplos multi-backend e fixtures adversariais. Não implemente ainda.

Leia:
- .governance/specs/0024-context-architecture/work-graph-model/model.yml
- tracker.md
- _org-simulation-v3/README.md
- _org-simulation-v3/NEXT-STEPS.md
- _org-simulation-v3/CLAUDE-CODE-FABLE-5-HANDOFF.md
- git diff/log desde a970415b

Contexto físico obrigatório:
- _org-simulation-v3/acme-governance/ é o host central da org.
- _org-simulation-v3/repos/<repo>/ são repos de produto adotados, com código MVP e sidecar .governance.
- Fix/dep-bump standalone ficam em repos/<repo>/.governance/works/*.yml.
- Incidente fica em acme-governance/incidents/incidents.yml e gera follow-ups para standalone/proposal.
- A v3 JÁ porta a base _lib DDD, adapter file, command dry-run/execute, read-model de grafo,
  app operacional Next/MUI e exemplos derivados file/sqlite/neo4j/mongo.
- A v3 ainda NÃO porta a autoria completa da v2 nem adapters transacionais SQLite/Neo4j/Mongo
  write-capable. Neo4j é read-model derivado por padrão; o próximo backend transacional a provar
  é file + event-log/lock.
- Integrações externas são opcionais e devem entrar como evidence providers/importers/projections,
  não como SSOT paralelo; ver integration-catalog.yml.

Saída:
1. fatos observados;
2. gaps ou contradições;
3. plano de próxima fatia;
4. o menor conjunto de validações que provaria a fatia.
```
