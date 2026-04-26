# Research: Estratégia de Notificações de Atualização

Este documento analisa como manter repositórios que consomem o `ai-guidelines` (via `init` ou `adopt`) informados sobre atualizações, considerando a transição de um "template repository" para um "package NPM".

## Estado Atual (Pre-NPM)

Atualmente, o framework é consumido via clone local ou referência direta ao repositório. Não há um canal de push para notificar os consumidores.

### Riscos:

- Repositórios satélites ficam com versões obsoletas de `rules/` ou `AGENTS.md`.
- Mudanças de breaking changes no CLI não são percebidas até que o usuário tente rodar o comando e falhe.

### Soluções Interinas (Candidatas):

1. **GitHub Releases**: Utilizar o recurso nativo de "Watch" do GitHub. Instruir usuários no README a assinar apenas "Releases".
2. **Check de Versão no CLI**: Adicionar uma chamada leve à API do GitHub no entrypoint do CLI para comparar a versão local com a última Tag.
   - _Pró_: Notificação direta no terminal.
   - _Contra_: Adiciona latência e dependência de rede no CLI.

## Estado Futuro (Post-NPM / Spec 0005)

A migração para um pacote npm (`@rosanarezende/ai-guidelines`) resolve este problema nativamente.

### Ferramentas Recomendadas:

- **`update-notifier`**: Padrão da indústria para CLIs Node.js.
  - Roda em background (non-blocking).
  - Cacheia o resultado por intervalo definido (ex: 1 semana).
  - Respeita ambientes de CI (fica silencioso).

## Conclusão e Decisão de Curto Prazo

Decidimos **adiar a implementação de automação** para a Spec 0005. No curto prazo (Public-Ready), a mitigação será:

1. **PR Template Generalizado**: Inclusão de checklist manual para que o contribuidor avalie o impacto downstream.
2. **Documentação no README**: Orientação sobre como se manter atualizado via GitHub Releases.

---

_Data: 2026-04-22_
_Contexto: Spec 0004 - Vaga D_
