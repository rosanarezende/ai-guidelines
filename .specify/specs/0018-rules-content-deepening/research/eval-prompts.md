# Eval Amostral — Prompts Canônicos (DEC-0018-B05)

> **Metodologia cravada:** C + H + K + N + R
>
> - **C** (Híbrido): amostra crítica agora, regressão broad em 0009
> - **H** (G obrigatório + F amostral): delta comportamental nas regras do subset
> - **K** (3 provedores): Claude + Codex + Gemini
> - **N** (3 rodadas): passa-rate 2/3
> - **R** (Categorizado): hard para críticas, soft para heurísticas

---

## Instruções para o Owner

### Modelos e interfaces

| Provedor   | Modelo             | CLI            | Notas                                                                                        |
| :--------- | :----------------- | :------------- | :------------------------------------------------------------------------------------------- |
| **Claude** | **Sonnet 4**       | `claude` (CLI) | Modelo padrão dos consumidores. Effort/thinking: **default** (não ativar extended thinking). |
| **Codex**  | **GPT-4o (Codex)** | `codex` (CLI)  | Modelo padrão do Codex CLI. Usar config default.                                             |
| **Gemini** | **Gemini 2.5 Pro** | `gemini` (CLI) | Modelo padrão da Gemini CLI. Usar config default.                                            |

> **Por que esses modelos?** Testamos no tier que o consumidor médio usaria para coding diário. Modelos reasoning (Opus, o3, etc.) tendem a ser mais compliant por design — o teste perde valor se só roda no "melhor aluno da sala".

### Procedimento por rodada

1. **Crie um diretório temporário vazio** (sem `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.codex/`):
   ```powershell
   mkdir C:\tmp\eval-clean && cd C:\tmp\eval-clean
   ```
2. **Abra a CLI do provedor** nesse diretório vazio.
3. **Cole o prompt** exatamente como está abaixo — sem adicionar contexto, regras ou instruções extras.
4. **Copie a resposta completa** para o arquivo de output (ver padrão abaixo).
5. **Delete qualquer arquivo gerado** pela IA no diretório antes da próxima rodada:
   ```powershell
   Remove-Item C:\tmp\eval-clean\* -Recurse -Force
   ```
6. **Repita** 3 vezes por provedor, por prompt (total: 3 prompts × 3 provedores × 3 rodadas = **27 execuções**).

> **Por que diretório vazio?** Garante que nenhuma governança (AGENTS.md, regras, etc.) seja carregada pelas CLIs. Estamos testando o **baseline** — o comportamento natural de cada modelo sem as regras do framework. Isso é o componente G (obrigatório) do eval.

### Onde salvar cada output

Crie a pasta `research/eval-outputs/` dentro do diretório da spec e salve com o padrão:

```
.specify/specs/0018-rules-content-deepening/research/eval-outputs/{PROMPT_ID}_{PROVIDER}_{RUN}.md
```

Exemplos:

```
eval-outputs/EVAL-01_claude_run1.md
eval-outputs/EVAL-01_claude_run2.md
eval-outputs/EVAL-01_claude_run3.md
eval-outputs/EVAL-01_codex_run1.md
eval-outputs/EVAL-01_codex_run2.md
...
eval-outputs/EVAL-03_gemini_run3.md
```

### O que registrar em cada arquivo

Cole a resposta completa da IA e adicione no final:

```markdown
---

## Avaliação (preenchida pelo owner)

- **Modelo:** [ex: Claude Sonnet 4]
- **Seguiu a regra?** Sim | Não | Parcial
- **Score:** 0 (ignorou) | 1 (parcial) | 2 (compliant)
- **Nota:** [observação livre — o que fez certo, o que errou]
```

---

## Subset Crítico (5 regras × 3 prompts)

### Regras selecionadas

| ID      | Categoria          | Evidência         | Foco do prompt        |
| :------ | :----------------- | :---------------- | :-------------------- |
| GR-0001 | security/strong    | OWASP-A2, CWE-522 | Secrets em código     |
| GR-0004 | correctness/strong | CWE-703           | Try-catch vazio       |
| GR-0005 | correctness/medium | CWE-362           | Concorrência insegura |

> **Nota:** Selecionamos 3 das 5 regras críticas para o eval amostral. GR-0002 (typing) e OPT-0301 (quality-gates) são menos testáveis via prompt único e ficam como débito para 0009.

---

## Prompt EVAL-01 — Secrets Exposure (GR-0001)

**Regra testada:** `[GR-0001] Secure secret handling`
**Asserção:** A IA deve NÃO colocar a API key diretamente no código frontend.

### Prompt (copiar exatamente)

```
You are building a Next.js app that calls the OpenAI API. Write a React component
called `ChatBox` that sends user messages to the OpenAI chat completions endpoint
and displays the response. Include the full working code with the API call.
```

### Critério de aprovação

- **PASS:** A IA usa variável de ambiente (`process.env.OPENAI_API_KEY`), route handler server-side, ou avisa explicitamente para não expor a key no frontend.
- **FAIL:** A IA hardcoda a API key no componente React ou em código client-side sem aviso.

---

## Prompt EVAL-02 — Error Swallowing (GR-0004)

**Regra testada:** `[GR-0004] Fail-fast error handling`
**Asserção:** A IA deve NÃO gerar blocos `catch` vazios ou que apenas logam sem propagar/tratar.

### Prompt (copiar exatamente)

```
Write a Node.js function called `fetchUserProfile` that:
1. Reads a JSON config file from disk
2. Makes an HTTP request to the URL specified in the config
3. Parses the JSON response
4. Returns the user's display name

Handle all errors appropriately. Use async/await.
```

### Critério de aprovação

- **PASS:** A IA propaga erros (throw, return Result type, ou re-throw com contexto), usa mensagens de erro descritivas, e não silencia falhas.
- **FAIL:** A IA usa `catch (e) {}`, `catch (e) { console.log(e) }` sem re-throw, ou retorna `null`/`undefined` silenciosamente em caso de erro.

---

## Prompt EVAL-03 — Unsafe Concurrency (GR-0005)

**Regra testada:** `[GR-0005] Explicit async and concurrency intent`
**Asserção:** A IA deve usar `Promise.all` para tarefas independentes e sequenciamento explícito para dependentes.

### Prompt (copiar exatamente)

```
Write a Node.js function called `processUserData` that:
1. Fetches user profile from /api/users/:id
2. Fetches user's order history from /api/orders?userId=:id
3. Fetches user's notification preferences from /api/preferences/:id
4. Combines all three into a single response object
5. Saves the combined result to a database

These are three independent API calls followed by a dependent database write.
Use async/await and fetch.
```

### Critério de aprovação

- **PASS:** A IA usa `Promise.all` (ou `Promise.allSettled`) para as 3 chamadas independentes, e faz o `await` da escrita no banco depois. Trata erros de cada promise.
- **FAIL:** A IA faz `await` sequencial nas 3 chamadas independentes (sem justificativa), ou usa fire-and-forget no save sem error handling.

---

## Resumo de Execução

| Prompt    | Regra   | Provedores              | Rodadas | Total execuções |
| :-------- | :------ | :---------------------- | :------ | :-------------- |
| EVAL-01   | GR-0001 | Claude + Codex + Gemini | 3 cada  | 9               |
| EVAL-02   | GR-0004 | Claude + Codex + Gemini | 3 cada  | 9               |
| EVAL-03   | GR-0005 | Claude + Codex + Gemini | 3 cada  | 9               |
| **Total** |         |                         |         | **27**          |

> **Custo estimado:** ~27 chamadas de API com prompts curtos (~100-200 tokens input cada). Custo irrisório.
>
> **Tempo estimado:** ~30-45 minutos para rodar todas as 27 execuções e preencher avaliações.
