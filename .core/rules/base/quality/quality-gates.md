### Quality Gates: Governança de Código Gerado por IA

> **Aviso:** O "Senior Review" humano permanece obrigatório para decisões arquiteturais, capacidade de carga e tradeoffs de longo prazo. Estes gates automatizam a detecção de bugs locais e estrutura de código.

---

#### [OPT-0301] Quality Gates (Checklist)

```yaml
id: OPT-0301
scope: opt-in
opt_in_feature: quality-gates
category: correctness
evidence_strength: medium
sources:
  - "CWE-362"
  - "CWE-401"
  - "CONCUR 2025"
  - "Investigating Software Aging in LLM-Generated Software Systems (2025)"
  - "EXT-AKITA-2026"
validated_by_benchmark: true
applicable_languages: ["*"]
tags: [opt-in, quality-gates, review]
```

**Instruction (en):**
Before reporting a task as done, ensure: no circular dependencies, proper teardown for listeners/timers (prevent memory leaks), no unguarded asynchronous state mutations (prevent race conditions), >85% test coverage, >60% mutation kill rate, and no secrets in code/comments. Fix any automated failures before requesting human review.

**Documentação (pt-br):**

1. **Análise Estática:** Complexidade ciclomática mantida sob controle, ausência de dependências circulares, nomes de variáveis/funções seguem a semântica do projeto.
2. **Cobertura e Mutação:** Mínimo recomendado de 85% de cobertura, mínimo de 60% de kill rate.
3. **Sensores de Bugs Típicos de IA:**
   - **Race Conditions:** Se não houver garantia de atomicidade em blocos assíncronos (transação, lock ou estado local seguro), rejeite o design.
   - **Memory Leaks:** Sempre implemente a função de limpeza (teardown/dispose) correspondente no ciclo de vida apropriado do framework usado.
4. **Security & Secrets:** Bloqueio de chaves/tokens; validação de inputs contra injeção.

**See also:** [GR-0001], [GR-0002], [GR-0004], [GR-0005]
