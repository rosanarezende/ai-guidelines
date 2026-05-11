### BDD: Comportamento Guiado por Testes (Dado/Quando/Então)

> Esta regra instrui agentes de IA a estruturarem testes no formato BDD.
> **Foco:** linguagem ubíqua, rastreabilidade e documentação viva.

---

#### [OPT-0201] Estrutura de Teste BDD

```yaml
id: OPT-0201
scope: opt-in
opt_in_feature: bdd
category: correctness
evidence_strength: declared_heuristic
sources: []
applicable_languages: ["*"]
tags: [opt-in, bdd, testing]
```

**Instruction (en):**
All tests MUST use the GIVEN / WHEN / THEN structure in Brazilian Portuguese (DADO/QUANDO/ENTÃO). Each `it()` describes exactly one atomic scenario. Prioritize readability over brevity. If a business rule `[BR-*]` is provided, include it in the test name.

**Documentação (pt-br):**

- **DADO** [cenário inicial / pré-condição / estado do sistema]
- **QUANDO** [ação executada pelo usuário ou sistema]
- **ENTÃO** [resultado esperado / asserção]

- **Linguagem Ubíqua:** Testes devem ser legíveis por humanos não-técnicos. Evite jargão de implementação nos nomes.
- **Documentação Viva:** A suíte de testes serve como documentação executável do sistema. Se o teste não descreve o comportamento com clareza, reescreva-o.
- **Cenários Atômicos:** Cada `it()` descreve exatamente um cenário. Não combine múltiplos fluxos.

**Exemplo:**

```javascript
it("[BR-CLI-SYNC-01] DADO baseline desatualizado QUANDO executado adopt ENTÃO sincroniza apenas arquivos alterados", () => {
  // ...
});
```

**See also:** [OPT-0401], [OPT-0501]
