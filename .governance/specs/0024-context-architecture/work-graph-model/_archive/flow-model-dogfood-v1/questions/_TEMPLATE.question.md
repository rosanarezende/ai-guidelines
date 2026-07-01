---
node: question
id: q-NNN # sequencial; arquivo: q-NNN_<slug>.md (sem data no nome)
raised-by: <intent-brief | q-XXX | tarefa>
mode: escolha # escolha (alternativas vivas → owner arbitra) | aceitação (finding convergido)
status: aberta # aberta | resolvida
# ↓ GERADO dos back-pointers (A+) — NÃO editar à mão; um check garante consistência.
#   Vazio enquanto `aberta`; preenche quando a research investiga / a decision resolve.
investigated-by: [] # = research(es) cujo `investigates` contém esta question
resolved-by: null # = "dec-NNN §Dx" da decision cujo `resolves` contém esta question
---

# q-NNN — <a pergunta, no interrogativo>

**Pergunta:** <o que precisa ser respondido>

## Opções (modo `escolha`) — SEM enviesar (conjunto mínimo, nunca Pró/Contra)

### Opção A — <nome>

- **Problema que resolve:** … · **Benefícios:** … · **Tradeoffs:** … · **Riscos:** …
- **Quando escolher:** … · **Quando NÃO escolher:** …

### Opção B — <nome>

- (idem)

## Estado da iteração (enquanto `aberta`)

> <o que já convergiu / o que falta NAQUELA question — é o que a retomada lê>

**Resposta convergida:** <preencher ao `resolver`>

<!-- A question declara só `raised-by`. `investigated-by`/`resolved-by` são GERADOS (A+). A ESCOLHA +
     justificativa moram na `decision`; a RECOMENDAÇÃO (bounded) na `research`. -->
