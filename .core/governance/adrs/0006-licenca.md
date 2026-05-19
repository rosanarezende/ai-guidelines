# ADR 0006 — Licença Apache-2.0

**Status**: Aceita  
**Data**: 2026-04-21  
**Spec**: 0004 — Vaga D (Public-ready hygiene)

---

## Contexto

Para tornar o repositório `ai-guidelines` público, é necessária uma decisão
explícita e documentada sobre licença. A escolha impacta:

- Como o framework pode ser usado, modificado e redistribuído por terceiros.
- A percepção do projeto no ecossistema OSS.
- Compatibilidade com dependências e contribuidores externos.

### Opções consideradas

| Licença               | Adoção                   | Proteção de Patentes | Complexidade |
| --------------------- | ------------------------ | -------------------- | ------------ |
| **MIT**               | Máxima (GitHub padrão)   | Nenhuma              | Mínima       |
| **Apache-2.0**        | Alta (AI tooling)        | Explícita (§3)       | Baixa        |
| **BSL / Elastic-2.0** | Baixa (source-available) | Variável             | Alta         |

### Benchmarks de AI tooling (2025-2026)

Projetos de referência no ecossistema AI-first dev:

- `cline/cline`: **Apache-2.0**
- `continuedev/continue`: **Apache-2.0**
- `multica-ai/multica`: **Apache-2.0** (com cláusulas adicionais)
- `github/spec-kit`: MIT

O padrão dominante em AI tooling é **Apache-2.0**, que inclui proteção
explícita de patentes — relevante para um framework que pode ser adotado
por organizações.

---

## Decisão

Adotar **Apache-2.0** como licença do repositório `ai-guidelines`.

**Rationale:**

1. **Alinhamento com o ecossistema**: Apache-2.0 é o padrão de AI tooling
   em 2026 (Cline, Continue, Multica).
2. **Proteção de patentes**: A cláusula §3 protege contribuidores e usuários
   de litígios de patente — importante para um framework de governança.
3. **Permissividade**: Permite uso comercial, modificação e redistribuição,
   incluindo em produtos proprietários, sem restrições de copyleft.
4. **Percepção pública**: Apache-2.0 é reconhecida como licença OSS de boa
   fé por avaliadores técnicos e de compliance corporativo.

---

## Consequências

### Positivas

- Qualquer pessoa ou empresa pode usar, modificar e redistribuir o framework
  sem custo e sem restrições de copyleft.
- Contribuidores têm proteção explícita de patentes.
- Percepção profissional no ecossistema AI-first dev.

### Negativas / Riscos

- Apache-2.0 é ligeiramente mais complexa que MIT para leitura direta.
  Mitigação: o `README.md` linkará a licença de forma clara.
- Não impede uso proprietário do framework sem contribuição de volta.
  Isso é intencional — o objetivo é maximizar adoção.

---

_Pesquisa de suporte: `.specify/specs/researchs/0004-ai-dev-foundations-public-ready/benchmarks-public-oss.md` §1_
