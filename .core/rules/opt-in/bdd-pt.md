# BDD: Comportamento Guiado por Testes (Dado/Quando/Então)

> Esta regra instrui agentes de IA a estruturarem testes no formato BDD.
> **Foco:** linguagem ubíqua, rastreabilidade e documentação viva.

---

## Formato Obrigatório

Todos os testes DEVEM usar a estrutura **DADO / QUANDO / ENTÃO** em Português do Brasil:

- **DADO** [cenário inicial / pré-condição / estado do sistema]
- **QUANDO** [ação executada pelo usuário ou sistema]
- **ENTÃO** [resultado esperado / asserção]

### Exemplo

```javascript
it("DADO usuário sem permissão QUANDO tenta acessar painel ENTÃO retorna erro 403", () => {
  // ...
});
```

---

## Rastreabilidade (Business Rules)

- Cada regra de negócio documentada DEVE ter um identificador único (ex: `[BR-CLI-SYNC-01]`).
- Os testes que validam essa regra DEVEM incluir o identificador no nome.
- Isso garante que qualquer regressão seja rastreável até a spec original.

```javascript
it("[BR-CLI-SYNC-01] DADO baseline desatualizado QUANDO executado adopt ENTÃO sincroniza apenas arquivos alterados", () => {
  // ...
});
```

---

## Princípios BDD

- **Linguagem Ubíqua:** Testes devem ser legíveis por humanos não-técnicos. Evite jargão de implementação nos nomes.
- **Documentação Viva:** A suíte de testes serve como documentação executável do sistema. Se o teste não descreve o comportamento com clareza, reescreva-o.
- **Cenários Atômicos:** Cada `it()` descreve exatamente um cenário. Não combine múltiplos fluxos.

---

## Regras para Agentes de IA

- Ao criar testes, SEMPRE use o formato DADO/QUANDO/ENTÃO no nome do caso de teste.
- Ao receber uma business rule (`[BR-*]`), inclua o ID no teste correspondente.
- Gere cenários para fluxo feliz, fluxo alternativo e casos de erro.
- Priorize legibilidade sobre concisão nos nomes dos testes.
- Mantenha cada cenário atômico: um `it()` deve expressar uma intenção de negócio observável.
