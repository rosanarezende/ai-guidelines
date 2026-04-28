# NEXT — Débitos da Spec 0016

> Este arquivo captura débitos técnicos, gaps processuais ou sub-features que foram conscientemente adiados durante o ciclo de vida desta Spec.
> **Regra de encerramento:** antes do fechamento desta Spec, todos os itens deste arquivo devem ser resolvidos, migrados para o `roadmap/backlog.md` global ou categorizados como issues. O arquivo será deletado.

---

## 🛑 Gaps de Processo

- **Concorrência de Specs:** Foi identificado um gap no processo SDD. A spec 0016 foi aberta enquanto 0008 e 0015 ainda não estavam fechadas formalmente (seus branches/PRs não foram mergeados). A documentação SDD impõe "Uma spec ativa por vez" (`docs/process/spec-foundation.md`), no entanto, não há mecanismos ou diretrizes que guiem a criação ou execução paralela segura de Specs de escopos distintos e não há um enforcement automatizado (ex: um pre-push hook que previna a abertura de nova Spec sem fechar a anterior, ou uma reescrita do processo para acomodar "Lanes" de trabalho em paralelo). Isso deve ser revisado na documentação de governança.
- **Análise Prévia do Backlog:** Falta uma orientação explícita e obrigatória no workflow base (seja em `AGENTS.md` ou `global-rules.md`) de que todo agente IA ou desenvolvedor deve **sempre analisar o backlog (`.specify/specs/roadmap/backlog.md`) ao iniciar qualquer sessão de trabalho**. Esse gap permite que tarefas percam contexto, que prioridades sejam ignoradas ou que novas frentes de trabalho sejam abertas sem respeitar o estado do planejamento existente.
- **Gestão de Conhecimento e Pesquisas (Research):** Não há uma política clara de consolidação das pesquisas feitas nas specs. O processo SDD deve ser atualizado para que, no encerramento de uma spec, as pesquisas relevantes contidas na subpasta `research/` sejam migradas para um diretório global (ex: `.specify/specs/researchs/`) e catalogadas no `.specify/specs/research-index.md`, deletando a pasta local da spec (similar ao fluxo do `NEXT.md`). Além disso, a leitura prévia do `research-index.md` deve ser incorporada ao workflow de inicialização dos agentes, maximizando o reuso do conhecimento e evitando pesquisas redundantes.

## 🛠 Débitos Técnicos (Adiados)

- _(Adicionar itens aqui conforme o desenvolvimento da 0016 avançar)_
