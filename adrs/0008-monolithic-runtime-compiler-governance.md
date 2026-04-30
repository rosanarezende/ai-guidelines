# ADR 0008 — Governança Monolítica (Monolithic Runtime Compiler)

**Status**: Aceita
**Data**: 2026-04-30
**Spec**: 0017 — Process & CLI Refactor (Finaliza 0008)

---

## Contexto

A arquitetura original da ferramenta separava as regras de governança em múltiplos arquivos dentro de um diretório `.ai-guidelines/` (ex: `rules/global-rules.md`, `rules/tdd.md`, etc.), enquanto o arquivo `AGENTS.md` atuava apenas como ponto de entrada que fazia referências a esses arquivos externos.

### Diagnóstico

Modelos de linguagem de fronteira (LLMs como Claude 3 Opus, Gemini 1.5 Pro) sofrem de degradação de contexto em interações longas, conhecido como o fenômeno _"Lost-in-the-Middle"_.
A fragmentação das regras:

- Forçava os agentes a lerem múltiplos arquivos para entenderem a constituição do repositório, o que consumia tokens e turnos de interação.
- Algumas plataformas limitam o nível de profundidade de leitura automática ou priorizam o System Prompt sobre arquivos referenciados.
- Modelos perdiam conformidade (compliance) com as diretrizes pois a fragmentação diluía a importância (Fixed-tier Bottleneck).

## Decisão

Adotar uma **Governança Monolítica** onde todas as regras são compiladas em um único arquivo durante a execução.

| Arquitetura Antiga                                                   | Arquitetura Nova (Monolítica)                                                                              |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Diretório `.ai-guidelines/rules/` distribuído nos repositórios alvo. | O diretório legado `.ai-guidelines/` é removido.                                                           |
| `AGENTS.md` com ponteiros para ler arquivos externos.                | `AGENTS.md` contém o bloco completo `<AI_GUIDELINES>` compilado com todas as regras e adaptadores in-line. |
| Múltiplos arquivos carregados pelo agente.                           | Um único ponto de injeção de contexto garantido.                                                           |

### Mudanças aplicadas

1. **Remoção de Diretórios Legados**: Exclusão de `.ai-guidelines/` nos repositórios locais para consolidar a governança em `.core/` no repositório principal.
2. **Compilação Monolítica**: O CLI agora atua como um _Runtime Compiler_ que une o Baseline (`.core/rules/global-rules.md`), os Adaptadores de Plataforma e as Features Opt-in (ex: `<FEATURE_TDD>`) em um bloco delimitado por tags `<AI_GUIDELINES>`.
3. **Injeção no AGENTS.md**: O bloco compilado é injetado diretamente no `AGENTS.md` dos repositórios consumidores.
4. **Otimização de Adaptadores**: Orientação para que plataformas (Claude, Codex, Gemini) busquem diretamente a tag `<AI_GUIDELINES>` em `AGENTS.md` em vez de arquivos separados.

## Consequências

### Positivas

- **Retenção de Contexto Máxima**: O formato monolítico garante prioridade máxima e persistência no contexto do agente.
- **Resiliência entre Plataformas**: Agnóstico à forma como a plataforma do agente resolve a leitura de múltiplos arquivos.
- **Idempotência do CLI**: O comando `adopt` se torna mais robusto e capaz de sincronizar regras com apenas uma operação de replace de bloco.

### Negativas / Riscos

- O tamanho do `AGENTS.md` em repositórios alvo aumentou.
- O CLI sofreu _Breaking Changes_ estruturais (comando `adopt` e paths do diretório alvo precisaram ser reescritos e não atualizam mais `.ai-guidelines/rules/`).
- Repositórios com regras customizadas locais precisarão mover suas customizações para a zona de "Contexto Tático" fora da tag `<AI_GUIDELINES>`.

### Ação futura

- Migrar repositórios consumidores do `ai-guidelines` que possuam customizações, garantindo que o seu conteúdo tático seja preservado nas regiões adequadas.
