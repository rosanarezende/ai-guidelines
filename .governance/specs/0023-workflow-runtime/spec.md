## 📦 Escopo

### Dentro do escopo

- **Runtime CLI mínimo** com 1 comando principal (`workflow`) + 1 atalho (`continue`). REPL interativo. Comandos estruturados internos (`briefing`, `gaps`, `gate`, `next`, `quit`). Texto livre vira context bundle, **não** chamada de LLM.
- **`state.yml`** com schema 4-chave canônico (`stage`, `gate.status`, `focus`, `next`). Serializer + validador em domínio. Default sensato quando ausente.
- **Topologia `.governance/specs/`** como root primária no repo do mantenedor (este). Double-lookup runtime: `.governance/specs/{slug}` → fallback `.specify/specs/{slug}`. ADR 0019 registra.
- **Detecção de spec ativa**: branch name → diretório slug; quando não resolvida, runtime retorna `null` e orienta explicitamente o humano (sem inferência heurística por arquivos modificados nesta versão).
- **AssembleBriefing**: estado + cabeçalhos do `spec.md` e `research.md` → bloco de 15–25 linhas determinístico.
- **Código novo exclusivamente em `src/`** (DDD): `domain/workflow/`, `app/workflow/`, `adapters/cli/workflow/`. Bridge mínima no entrypoint `cli/ai-guidelines-cli.mjs` (delegate dinâmico).
- **Dogfooding**: esta própria spec usa o `state.yml` desde o primeiro commit; testar `ai-guidelines workflow` nela é critério de aceite do PR1.

---

## ✅ Critérios de Aceite (alto nível)

- [ ] `ai-guidelines workflow` na branch desta spec mostra briefing contextual coerente com `state.yml` + arquivos da pasta.
- [ ] `ai-guidelines continue` imprime briefing + próxima ação registrada em `state.next` (sem execução automática).
- [ ] `state.yml` validado por schema (4 chaves; sem campos opcionais explodidos).
- [ ] Double-lookup funciona: spec resolvida via `.governance/specs/` quando presente, via `.specify/specs/` quando não.
- [ ] Detecção de spec ativa por branch name funciona para `feat/spec-NNNN-*`; fallback explícito documentado.
