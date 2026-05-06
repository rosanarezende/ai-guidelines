# Research — Viabilidade de Integração com Projetos Externos

> **Data:** 2026-05-05
> **Contexto:** Análise de compatibilidade de licenças e modelos de integração entre ai-guidelines e projetos do ecossistema Akita.
> **Relevância para Spec 0018:** Documenta constraints legais e opções de integração para as Seeds B.10 e B.11.

---

## 1. Mapeamento de Licenças

| Projeto                   | Licença               | Tipo                          | Compatível com Apache 2.0?               |
| :------------------------ | :-------------------- | :---------------------------- | :--------------------------------------- |
| **ai-guidelines** (nosso) | Apache 2.0            | Permissiva                    | —                                        |
| **ai-jail**               | GPL 3.0               | Copyleft forte                | ❌ como dependência / ✅ como referência |
| **llm-coding-benchmark**  | Sem licença explícita | All rights reserved (default) | ⚠️ Apenas citação/fair use               |
| **pact-lang**             | Sem licença explícita | All rights reserved (default) | ⚠️ Apenas citação/fair use               |

---

## 2. O que PODEMOS fazer (sem restrição)

### 2.1 Referência documental

Referenciar qualquer projeto como "tooling recomendado" na documentação, rationale de regras, ou research notes. Não constitui derivative work. Exemplos:

- "Recomendamos `ai-jail --mask .env` para mascarar secrets em sandboxes de agentes IA"
- "O benchmark [EXT-AKITA-2026] valida empiricamente que modelos Tier A protegem secrets naturalmente"

**Status:** ✅ Livre — equivale a citar uma ferramenta como referência bibliográfica.

### 2.2 Citação de findings e dados

Citar resultados, métricas e patterns observados em benchmarks/pesquisas externas. Fair use para fins de pesquisa e documentação técnica.

**Status:** ✅ Livre — já praticado em `2026-05-05-akita-benchmark-analysis.md`.

### 2.3 Metadata em schema (external_evidence)

Adicionar referências como `"external_evidence": ["EXT-AKITA-2026"]` no schema YAML das regras. São ponteiros textuais, não código derivado.

**Status:** ✅ Livre — metadata referencial.

---

## 3. O que NÃO podemos fazer (com Apache 2.0 atual)

### 3.1 Bundlar ai-jail como dependência runtime

GPL 3.0 exige que o trabalho derivado inteiro seja distribuído sob GPL. Se ai-guidelines (Apache 2.0) dependesse de ai-jail (GPL 3.0), teríamos que relicenciar todo o projeto sob GPL — o que eliminaria a possibilidade de uso proprietário.

**Status:** ❌ Incompatível.

### 3.2 Copiar código do ai-jail

Mesmo que fossem apenas trechos, GPL 3.0 é "viral" — qualquer incorporação exige que o projeto inteiro seja GPL.

**Status:** ❌ Incompatível.

### 3.3 Redistribuir binários do ai-jail

Incluir binários do ai-jail dentro de releases do ai-guidelines exigiria conformidade GPL (incluir fonte, notas de licença, etc.).

**Status:** ❌ Incompatível.

---

## 4. Modelo de integração recomendado

Dada a análise, o modelo ideal é **"referência + orquestração, sem acoplamento"**:

```
┌─────────────────────────────────────────────┐
│ ai-guidelines (Apache 2.0)                  │
│                                             │
│  AGENTS.md → regras textuais               │
│  rules.json → metadata com external_evidence│
│  CLI → adopt, compile, diagnose            │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Referência documental (não código)  │    │
│  │ "Recomendamos ai-jail --mask .env"  │    │
│  │ "Validado por [EXT-AKITA-2026]"     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ adopt --sandbox (futuro)            │    │
│  │ Gera .ai-jail com masks padrão     │    │
│  │ Não importa código GPL — gera TOML │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
         │ referência              │ gera config
         ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│ ai-jail (GPL 3.0)│    │ .ai-jail (TOML config)│
│ (instalado pelo  │    │ (gerado, não derivado │
│  usuário, não    │    │  de código GPL)       │
│  bundlado)       │    │                       │
└──────────────────┘    └──────────────────────┘
```

**Chave:** `adopt --sandbox` geraria um arquivo `.ai-jail` (TOML) com masks padrão (`[".env", ".env.*", "credentials*"]`). Isso é **geração de configuração**, não derivative work do ai-jail. O formato TOML do `.ai-jail` é uma convenção pública documentada no README do ai-jail.

---

## 5. Resumo executivo

| Questão                  | Decisão                                                        |
| :----------------------- | :------------------------------------------------------------- |
| Licença do ai-guidelines | **Manter Apache 2.0**                                          |
| Integração com ai-jail   | **Referência documental** (sem acoplamento de código)          |
| Integração com benchmark | **Citação + metadata** (`external_evidence` no schema)         |
| `adopt --sandbox`        | **Seed B.11** — gera `.ai-jail` config, não importa código GPL |
