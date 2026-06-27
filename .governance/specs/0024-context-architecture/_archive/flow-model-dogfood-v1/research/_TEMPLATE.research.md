---
node: research
id: res-NNN # sequencial; arquivo: res-NNN_<slug>.md (sem data no nome)
investigates: # back-pointer: as questions que investiga (1..N)
  - q-NNN
method: <benchmark | análise | scan de código | spike-PoC | dogfood>
# data da investigação: no corpo
---

# res-NNN — <título da investigação>

> Data: <YYYY-MM-DD> · (data no corpo, não no nome)

**Questão(ões):** <quais questions investiga e por quê>

**Evidência / achados:** <o que encontrou; refs verificáveis `file#anchor`>

**Recomendação (só em `escolha`, _bounded_):** <a opção sugerida + por quê. O humano DECIDE e pode
divergir — a recomendação não enviesa o menu de opções, que mora na `question`.>

<!-- Research é IMUTÁVEL após registrada. Declara só `investigates`. A `decision` declara `grounded-by`. -->
