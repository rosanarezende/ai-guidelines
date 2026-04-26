## Resumo

<!-- Descreva a mudança de forma objetiva. -->

## Linked Issue

<!-- Use `#123` para a issue principal desta entrega. Se não houver issue, deixe vazio. -->

## Spec Path

<!-- Caminho para a spec em .specify/specs/<slug>/ se houver. Ex: .specify/specs/0004-ai-dev-foundations-public-ready/ -->

## No-Spec Reason

<!-- Se não houver spec, justifique: ajuste rápido (typo, wording, config menor), bugfix urgente, etc. -->

## Tipo de Mudança

<!-- Marque o que se aplica: -->

- [ ] ✨ Funcionalidade (feat) — nova capacidade no CLI, framework ou docs
- [ ] 🐛 Correção (fix) — correção de comportamento incorreto
- [ ] 📄 Documentação (docs) — guias, referências, processos, ADRs
- [ ] ⚙️ Configuração (chore) — CI, scripts, dependências, estrutura
- [ ] 🗂️ Refatoração (refactor) — sem mudança de comportamento externo

## Contexto e Motivação

<!-- Qual dor, risco ou oportunidade motivou esta mudança? -->

## Impacto Downstream (Breaking Changes)

<!-- Esta mudança afeta repositórios que consomem este framework? Liste instruções de migração se houver quebra de compatibilidade. -->

## Checklist

- [ ] Commits atômicos (uma unidade lógica por commit, mensagem em PT-BR)
- [ ] Branch dedicada (nunca direto em `main`)
- [ ] Executei `yarn format` antes do push
- [ ] Executei `yarn check` antes do push (testes + cobertura)
- [ ] Documentei decisões arquiteturais relevantes em `adrs/`
- [ ] Atualizei `tasks.md` da spec correspondente (se aplicável)
- [ ] Revisei risco de contexto pessoal, credenciais ou artefatos operacionais vazados
- [ ] Confirmei que a mudança segue o contrato arquitetural existente ou documenta a divergência
- [ ] Verifiquei se a mudança exige atualização manual em repositórios que consomem este framework (via `adopt`)
- [ ] **Este PR está em modo Draft** (converter para Ready somente após aprovação humana)

## Disclosure de IA

<!-- Este PR foi gerado ou co-gerado por IA? Qual agente/modelo? -->
<!-- Ex: "Gerado com Gemini 3 Flash via Antigravity, revisado pelo mantenedor humano" -->
