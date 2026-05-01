---
title: Bugs empíricos em código gerado por IA
spec: 0018-rules-content-deepening
bloco: B
sub-bloco: B.0
date: 2026-04-30
status: Stage 1 — research output (sem decisões cravadas)
informa:
  - "[DEC-0018-B01] Taxonomia das categorias de regras"
  - "[DEC-0018-B05] Metodologia do eval mínimo"
  - "[DEC-0018-B08] Política de reconciliação do conteúdo b9efb83"
sources:
  - https://arxiv.org/abs/2403.08937
  - https://link.springer.com/article/10.1007/s10664-025-10614-4
  - https://arxiv.org/html/2512.05239v1
  - https://arxiv.org/html/2409.20550v1
  - https://dl.acm.org/doi/10.1145/3728894
  - https://arxiv.org/abs/2401.01701
  - https://arxiv.org/html/2501.19012v1
  - https://www.aikido.dev/blog/slopsquatting-ai-package-hallucination-attacks
  - https://socket.dev/blog/slopsquatting-how-ai-hallucinations-are-fueling-a-new-class-of-supply-chain-attacks
  - https://arxiv.org/abs/2108.09293
  - https://dl.acm.org/doi/10.1145/3610721
  - https://arxiv.org/abs/2211.03622
  - https://dl.acm.org/doi/10.1145/3576915.3623157
  - https://dl.acm.org/doi/10.1145/3716848
  - https://arxiv.org/html/2310.02059v3
  - https://arxiv.org/html/2603.03683
  - https://openreview.net/pdf?id=L7rVSAv1b4
  - https://arxiv.org/pdf/2510.24188
  - https://arxiv.org/html/2509.13941
  - https://arxiv.org/abs/2503.14499
  - https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/
  - https://aider.chat/docs/leaderboards/
  - https://aider.chat/docs/benchmarks.html
  - https://www.gitclear.com/ai_assistant_code_quality_2025_research
  - https://gitclear-public.s3.us-west-2.amazonaws.com/GitClear-AI-Copilot-Code-Quality-2025.pdf
  - https://openreview.net/pdf/7b25f35e8d13c2c33d84177f371a0c76252ba1f4.pdf
  - https://arxiv.org/pdf/2509.16941
  - https://cset.georgetown.edu/wp-content/uploads/CSET-Cybersecurity-Risks-of-AI-Generated-Code.pdf
---

# Bugs empíricos em código gerado por IA

> **Escopo.** Esta síntese consolida evidência empírica disponível na literatura
> acadêmica e em estudos de indústria sobre os defeitos que LLMs/agentes de IA
> mais frequentemente injetam em código. Alimenta três decisões da Spec 0018:
> a taxonomia do catálogo (`[DEC-0018-B01]`), a metodologia do eval mínimo
> (`[DEC-0018-B05]`) e a política de reconciliação do conteúdo introduzido em
> `b9efb83` (`[DEC-0018-B08]`).
>
> **Status.** Stage 1 — só catalogo evidência e enuncio opções. Nenhuma decisão
> é cravada aqui; isso é prerrogativa do Stage 2 / decision-brief correspondente.

---

## 1. Sumário executivo

### TL;DR

A literatura empírica de 2021-2026 documenta com solidez **algumas** classes de
bug recorrentes em código gerado por IA — predominantemente **hallucinações de
API/pacote**, **violações de requisitos funcionais**, **vulnerabilidades de
segurança catalogadas em CWE Top-25** e, em workloads agentic, **falhas de
raciocínio de longo horizonte**. Já os três sensores que `b9efb83` enxertou em
`quality-gates.md` — **N+1 queries, race conditions, memory leaks** — têm
**suporte empírico assimétrico**: race conditions aparecem com frequência alta
em benchmarks de concorrência (CONCUR), memory leaks têm evidência crescente
porém menos consolidada (estudos de software aging), e N+1 não aparece como
categoria autônoma em nenhuma das taxonomias publicadas que consultei.

### Achados-chave

1. **Hallucinação de API e pacotes é o defeito mais documentado e replicado.**
   Liu et al. (2025, ACM TOSEM) reportam que conflitos de conhecimento
   factual representam ~32% dos hallucination instances classificados, com
   "API Knowledge Conflicts" sozinhos respondendo por **20.41%** das ocorrências.
   Spracklen et al. (2025, USENIX/arXiv) mediram **0.22%-46.15%** de Package
   Hallucination Rate em 11 modelos × 3 linguagens, com **Python 23.14%**,
   **Rust 24.74%**, **JavaScript 14.73%**.

2. **Vulnerabilidades de segurança CWE Top-25 são prevalentes e mensuráveis.**
   Pearce et al. ("Asleep at the Keyboard", 2021) encontraram **~40%** de
   1.689 programas Copilot vulneráveis. Fu et al. (2025, ACM TOSEM) analisando
   733 snippets de Copilot/CodeWhisperer/Codeium em projetos GitHub reais
   encontraram **27.3%** com weakness; top-5 CWEs: CWE-330 (random fraco,
   18.15%), CWE-94 (code injection, 9.87%), CWE-79 (XSS, 9.55%), CWE-78
   (command injection, 6.21%), CWE-427 (search path).

3. **Race conditions e deadlocks dominam falhas em código concorrente, mas
   sob viés de seleção.** O benchmark CONCUR (Tabela 3 do paper) mediu, em
   23 LLMs × 115 problemas concorrentes, **77 deadlocks**, **68 race conditions**
   e **214 uncaught exceptions** entre as falhas. **Importante:** o
   denominador é restrito a problemas explicitamente concorrentes —
   não generaliza para a totalidade do output dos modelos.

4. **N+1 queries não aparecem como categoria empiricamente identificada.**
   Em nenhuma das taxonomias consultadas (Tambon et al. 2024/2025; survey
   "A Survey of Bugs in AI-Generated Code" 2025; LLM Hallucinations in
   Practical Code Generation; SWE-bench failure analyses) "N+1 queries"
   aparece como categoria nomeada ou subcategoria. A inclusão no `b9efb83`
   parece não ter respaldo direto na literatura empírica que examinei e
   cabe nos sub-blocos B.0 / B.6 da Spec 0018 reconciliar.

5. **Falhas de raciocínio de longo horizonte são o gargalo dominante em
   agentes.** METR (2025) mostra que sucesso cai de ~100% em tarefas <4min
   para <10% em tarefas >4h. Bouzenia et al. (2025, "Empirical Study on
   Failures in Automated Issue Solving") classificam ~65% das falhas como
   **flawed reasoning** (vs. 25% knowledge deficiency, 10% environmental
   friction). GitClear (2024) mede aumento de **48%** em copy-paste de 2020
   a 2024 e queda do refactor de **24.1% → 9.5%** no mesmo período.

---

## 2. Metodologias dos benchmarks

Esta seção descreve **como** cada benchmark mede o quê, para fundamentar a
escolha de metodologia do eval mínimo da Spec 0018 (`[DEC-0018-B05]`).

### 2.1 SWE-bench / SWE-bench Verified / SWE-bench Pro

- **O que mede:** capacidade do modelo/agente de resolver issues reais do
  GitHub (originalmente 2.294 issues de 12 repositórios Python populares).
  SWE-bench Verified (2024, OpenAI) é um subset de 500 instâncias filtradas
  por humanos para reduzir ambiguidade. SWE-bench Pro (2025) estende para
  multi-arquivo e long-horizon.
- **Como mede:** dado um issue + repo state, gera-se um patch; mede-se com
  testes ocultos (hold-out) se o patch passa.
- **Limitações conhecidas (relevantes para nós):**
  - **Solution Leak**: SWE-Bench+ (Aleithan et al., 2024) identificou que
    em **60.83%** dos resolved instances do Verified/Lite a solução estava
    explicitamente ou implicitamente no issue body ou comments.
  - **Weak Tests**: **47.93%** dos resolved instances passariam com fixes
    parciais ou incorretos — testes não conseguem distinguir.
  - **Memorização**: "The SWE-Bench Illusion" (2025) reporta que SOTA atinge
    **76%** em identificação de buggy file path com **só** o issue (sem ler
    código), caindo para **53%** em repos fora do dataset — sugere
    contaminação/memorização.
- **Implicação para 0018:** SWE-bench é forte em medir resolução end-to-end
  mas não isola **tipos de bug**. Para o eval mínimo da Spec 0018 servirá
  mais como fonte de estatísticas agregadas do que como benchmark próprio.

Fontes: <https://arxiv.org/pdf/2509.16941>,
<https://openreview.net/pdf/7b25f35e8d13c2c33d84177f371a0c76252ba1f4.pdf>.

### 2.2 METR — Measuring AI Ability to Complete Long Tasks (2025)

- **O que mede:** tempo de tarefa que um humano experiente leva (50%-task-
  completion time horizon) que o modelo consegue completar com 50% de
  sucesso. Foco é **horizonte temporal**, não taxonomia de bugs.
- **Como mede:** combina HCAST (97 tarefas, 46 famílias), RE-Bench e
  SWE-bench Verified. Cada tarefa é cronometrada por humano com expertise
  compatível.
- **Achado-chave para nós:** "AI agents often seem to struggle with
  stringing together longer sequences of actions more than they lack
  skills or knowledge needed to solve single steps." Sucesso ~100% em
  tarefas <4 minutos; <10% em tarefas >4 horas.
- **Limitações declaradas:** mistura de domínios (cybersecurity, ML,
  software engineering, general reasoning) — não decompõe falhas por
  categoria de bug; foca em time-horizon, não em taxonomia de defeitos.

Fonte: <https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/>,
<https://arxiv.org/abs/2503.14499>.

### 2.3 Aider — Polyglot leaderboard

- **O que mede:** capacidade de seguir instruções e editar código sem
  intervenção humana, em **6 linguagens** (C++, Go, Java, JavaScript,
  Python, Rust) sobre **225** Exercism exercises mais difíceis.
- **Como mede:** duas tentativas por problema; após primeira falha, mostra
  resultado dos testes. Mede também **edit format compliance** (modelo
  produziu o diff/patch no formato instruído?).
- **Modos de falha reportados:** malformed responses, syntax errors (raros
  em top performers), indentação, esgotamento de context window, test
  timeouts, refusals.
- **Implicação para 0018:** Aider mede correção funcional + obediência
  ao formato. Útil para o eval mínimo se quisermos exercitar
  "produção de patch correto", mas não cataloga **tipos de bug** que
  passariam por testes fracos.

Fontes: <https://aider.chat/docs/leaderboards/>,
<https://aider.chat/docs/benchmarks.html>.

### 2.4 HumanEval / MBPP

- **O que medem:** correção funcional em problemas curtos auto-contidos
  (HumanEval: 164 problemas Python; MBPP: ~1.000 problemas básicos).
  Métrica é pass@k via testes unitários.
- **Limitações para taxonomia:** problemas curtos não exibem padrões de
  arquitetura (N+1, race conditions, memory leak) — viés sistemático
  contra exatamente o que `b9efb83` afirma medir.
- **Erro empírico documentado:** correlação inversa **ρ = -0.7887** entre
  HumanEval score e Package Hallucination Rate (Spracklen et al. 2025) —
  modelos melhores em HumanEval halucinam menos pacotes, mas isso não
  implica eliminação dos outros bugs.

### 2.5 CONCUR — Benchmarking LLMs for Concurrent Code Generation (2025)

- **O que mede:** especificamente bugs de concorrência em Java 8.
  43 problemas curados + 72 mutantes validados = 115 problemas; 23 LLMs.
- **Como mede:** model checking (formal methods) detecta race conditions,
  deadlocks, starvation, single-thread anti-pattern com **92%** de
  precisão validada manualmente.
- **Achados (Pass@1, Tabela 3):**
  - Uncaught Exceptions: **214** instâncias (mais frequente)
  - Deadlocks: **77**
  - Race Conditions: **68**
  - Single Thread (programa "concorrente" rodando serialmente): **74**
  - Starvation: **0** (autores hipotetizam baixa complexidade dos
    problemas)
  - Compilation errors dominam o total (1.279 instâncias) — 71% syntax.
- **Limitação chave:** o denominador é "problemas explicitamente
  concorrentes". Não responde "qual % do código geral exibe race
  condition" — só "quando o problema **pede** concorrência, qual a
  distribuição de falhas".

Fonte: <https://openreview.net/pdf?id=L7rVSAv1b4>,
<https://arxiv.org/html/2603.03683>.

### 2.6 Estudos observacionais (não-benchmarks)

- **GitClear AI Code Quality 2025 (analisa 211M LOC, 2020-2024):**
  copy-paste subiu de **8.3% → 12.3%** (+48% relativo); moved/refactored
  caiu de **24.1% → 9.5%**; code churn (linhas reescritas em <2 semanas)
  subiu de **5.5% → 7.9%**. Não decompõe por **tipo** de bug.
- **Stanford / Perry et al. (2023) — "Do Users Write More Insecure Code
  with AI Assistants?":** estudo controlado com 47 participantes
  resolvendo 6 tarefas. Participantes com acesso a `codex-davinci-002`
  produziram código significativamente menos seguro **em 4 de 5
  perguntas** (criptografia, injeção SQL, etc.) **e** acreditavam estar
  mais seguros. Não enumera CWEs, mas confirma o gap "confidence vs.
  security".
- **Fu et al. (2025, ACM TOSEM) — "Security Weaknesses of Copilot-
  Generated Code in GitHub Projects":** 733 snippets reais; 27.3%
  vulneráveis; top CWEs detalhados acima.

Fontes: <https://www.gitclear.com/ai_assistant_code_quality_2025_research>,
<https://arxiv.org/abs/2211.03622>,
<https://dl.acm.org/doi/10.1145/3716848>.

---

## 3. Taxonomias de bugs encontrados — tabela cross-estudo

A tabela abaixo cruza as categorias mais citadas por estudo. Frequência
relativa é **dentro do estudo de origem** — não comparável entre linhas.
"—" significa "categoria não nomeada nesse estudo".

| Categoria                                  | Tambon 2024 (333 bugs, 3 LLMs) | Liu 2025 — LLM Hallucinations (real-world) | Survey 2025 (lit. review)         | CONCUR 2025 (concorrência) | Fu 2025 — Copilot security | Pearce 2021 — Copilot CWE Top-25 |
| :----------------------------------------- | :----------------------------- | :----------------------------------------- | :-------------------------------- | :------------------------- | :------------------------- | :------------------------------- |
| Hallucinated object/API                    | sim ("Hallucinated Object")    | **20.41%** (API Knowledge Conflicts)       | "Hallucination" — categoria       | —                          | parcial (CWE-94)           | —                                |
| Functional requirement violation           | sim ("Misinterpretation")      | **36.66%**                                 | **"Functional bugs" (56 estudos)** | parcial                    | —                          | —                                |
| Syntax error                               | sim                            | —                                          | **"Syntax bugs" (32 estudos)**    | 71% das compilation errors | —                          | —                                |
| Missing corner case                        | sim                            | —                                          | parcial (functional)              | parcial                    | —                          | parcial                          |
| Wrong attribute / wrong type               | sim                            | parcial                                    | parcial                           | —                          | —                          | —                                |
| Incomplete generation / silly mistake      | sim                            | —                                          | parcial                           | —                          | —                          | —                                |
| **Race conditions / deadlocks**            | —                              | —                                          | parcial ("Reliability")           | **68 RC + 77 DL** em 23 LLMs | —                          | parcial (CWE-362 não top)        |
| **Memory leaks / memory bugs**             | —                              | —                                          | sim ("System bugs → Memory bugs") | —                          | —                          | parcial (CWE-401, -416)          |
| **N+1 queries**                            | —                              | —                                          | —                                 | —                          | —                          | —                                |
| Insecure randomness (CWE-330)              | —                              | —                                          | —                                 | —                          | **18.15%**                 | top                              |
| Code injection (CWE-94)                    | —                              | —                                          | —                                 | —                          | **9.87%**                  | top                              |
| Cross-site scripting (CWE-79)              | —                              | —                                          | —                                 | —                          | **9.55%**                  | top                              |
| OS command injection (CWE-78)              | —                              | —                                          | —                                 | —                          | **6.21%**                  | top (mais prevalente Python)     |
| SQL injection (CWE-89)                     | —                              | —                                          | —                                 | —                          | parcial                    | top                              |
| Package hallucination / slopsquatting      | —                              | parcial (Library/Dependency Conflicts)     | parcial                           | —                          | —                          | —                                |
| Prompt-biased code                         | sim                            | parcial                                    | —                                 | —                          | —                          | —                                |
| Environment / dependency conflict          | —                              | **0.94% + 11.26%** (env + deps)            | sim                               | —                          | —                          | —                                |

### Observações sobre a tabela

- **Hallucinação** é a categoria com **maior consenso transversal**:
  aparece nomeada em ≥4 dos 6 estudos.
- **CWE Top-25** é dominante quando a metodologia é scanner estático
  (CodeQL, SonarQube). Estudos que medem só "passou ou não no teste"
  (HumanEval, Aider) **não capturam** essa categoria.
- **"Reliability bugs"** no survey de 2025 (`arxiv.org/html/2512.05239`)
  é guarda-chuva para race conditions, memory leaks, performance —
  mas não tem subcategorias granulares com frequências.

---

## 4. Verificação dos sensores do `b9efb83`

Esta seção responde de forma honesta para cada um dos três sensores:
"está nos top-N de qual estudo? frequência reportada? evidência forte ou
circunstancial?"

### 4.1 N+1 queries

- **Aparece em qual taxonomia?** **Em nenhuma** das que consultei
  diretamente. Não é nomeado em Tambon 2024, Liu 2025, no survey 2025,
  no CONCUR 2025, em Pearce 2021, Fu 2025, METR 2025, ou em qualquer
  análise de falhas de SWE-bench que examinei.
- **Frequência reportada:** N/D.
- **Evidência circunstancial:** N+1 é amplamente documentado como
  anti-pattern de ORM em comunidades Rails, Django, Hibernate desde os
  anos 2000 — independente de IA. Há discussões na comunidade
  Aider/Continue/Copilot sobre LLMs sugerirem código "ingênuo" em
  loops sobre coleções, mas **não localizei estudo formal mensurando
  prevalência específica**.
- **Veredicto honesto:** **fraco**. A inclusão como "sensor canônico"
  em `quality-gates.md` parece ter origem em **intuição de
  engenharia** (válida e plausível), não em medição empírica
  publicada. Pode permanecer como heurística declarada como tal —
  mas não como "categoria evidence-backed" sem caveat.

### 4.2 Race conditions

- **Aparece em qual taxonomia?** **Sim**, em CONCUR 2025 (categoria de
  primeira classe), e como subcomponente de "reliability bugs" no
  survey 2025. Em CWE Top-25, CWE-362 (Concurrent Execution using
  Shared Resource with Improper Synchronization) é categoria
  reconhecida embora **não apareça no top-5** de Fu 2025.
- **Frequência reportada:** **68 instâncias** entre 23 LLMs em
  problemas explicitamente concorrentes (CONCUR Pass@1, Tabela 3).
  Valores comparáveis com deadlocks (77).
- **Evidência forte vs. circunstancial:** **forte mas com viés de
  seleção declarado**. CONCUR só testa problemas concorrentes —
  prevalência **proporcional ao volume de código concorrente** que
  o time produz. Em projetos majoritariamente CRUD, a base de
  oportunidades para race condition é menor.
- **Veredicto honesto:** **médio-forte**. A categoria existe e é
  documentada. A relevância para um time específico depende do
  perfil da stack. Justifica permanecer no catálogo se o eval
  mínimo incluir cenários concorrentes; senão, é over-fit ao
  arquétipo "backend ORM/cache/jobs".

### 4.3 Memory leaks

- **Aparece em qual taxonomia?** **Sim, parcialmente.** No survey
  2025 sob "System bugs → Memory bugs". Em estudos de Rust/C++
  sobre LLMs (deepSURF 2025, LAMeD 2025) é tópico de pesquisa ativo.
  "Investigating Software Aging in LLM-Generated Software Systems"
  (2025) reporta crescimento contínuo de memória em aplicações
  geradas por LLM, com casos de **~1.5 GB de incremento** em uma
  aplicação observada.
- **Frequência reportada:** N/D em termos de proporção do output;
  evidência é qualitativa/case-study.
- **Evidência forte vs. circunstancial:** **circunstancial-a-média**.
  A pesquisa em memory leaks de código IA é **emergente** (2025),
  com ferramentas (LAMeD, deepSURF, MemHint) ainda em validação.
  Não há estudo do tipo "27.3% dos snippets têm memory leak" como
  Fu 2025 produziu para CWE.
- **Veredicto honesto:** **médio**. A categoria é real e crescente
  em relevância — especialmente em Rust/C++/long-running services —
  mas **não tem o mesmo grau de quantificação** que hallucinação ou
  CWE Top-25. Pode entrar no catálogo com ressalva de "evidência
  emergente, não consolidada com frequência".

### 4.4 Síntese da reconciliação `b9efb83`

| Sensor          | Evidência empírica  | Quantificação         | Recomendação para `[DEC-0018-B08]` |
| :-------------- | :------------------ | :-------------------- | :--------------------------------- |
| N+1 queries     | Fraca / ausente     | N/D                   | Reclassificar como heurística declarada (não evidence-backed) **ou** mover para anexo de "padrões observados em campo, sem citação acadêmica direta" |
| Race conditions | Forte com viés      | 68 em CONCUR (23 LLMs) | Manter no catálogo com escopo declarado ("código concorrente") |
| Memory leaks    | Média / emergente   | Casos qualitativos    | Manter com caveat de "evidência emergente"; considerar separar por linguagem (Rust/C++/Go vs. Python/JS) |

---

## 5. Categorias adicionais com forte evidência empírica

Categorias **não cobertas** pelos sensores atuais do `b9efb83` mas com
evidência empírica robusta — candidatas naturais para o catálogo
expandido:

### 5.1 Hallucinated APIs / não-existing functions (forte)

- Liu et al. (2025): API Knowledge Conflicts = **20.41%** dos
  hallucinations classificados em código gerado.
- "When LLMs Lag Behind" (2025): em **63%** dos casos onde uma API
  nova é introduzida, modelos halucinam função inexistente em vez de
  usar a API correta.
- De-Hallucinator (Eghbali & Pradel, 2024): mostrou que iterative
  grounding melhora API recall em 23.9-61.0% — sinal indireto da
  prevalência do problema.

### 5.2 Hallucinated packages / slopsquatting (forte e exploitável)

- Spracklen et al. (2025): **0.22%-46.15%** de Package Hallucination
  Rate. Python 23.14%, Rust 24.74%, JS 14.73%. Modelos code-specialized
  halucinam **mais** (26.90%) que generalistas (13.63%).
- **43%** dos pacotes halucinados aparecem **consistentemente** em
  prompts repetidos — atacante pode prever e registrar.
- Caso real: pacote halucinado `huggingface-cli` baixado **>30.000
  vezes em 3 meses** após ser registrado como prova de conceito.

### 5.3 Insecure randomness e cripto-mistakes (forte)

- Fu et al. (2025): **CWE-330** (random fraco) é o #1 com **18.15%**
  das ocorrências em 733 snippets. Inclui uso de `random.random()`,
  `Math.random()`, sementes previsíveis em contextos de segurança.
- Empirical Security Evaluation of LLM-Generated Cryptographic Rust
  Code (2025): documenta misuse específico de APIs de cripto em Rust.

### 5.4 Injection (SQL, command, code, XSS) (forte)

- Fu et al. (2025): CWE-94 (9.87%), CWE-79 (9.55%), CWE-78 (6.21%),
  CWE-89 (SQL injection) — somam **>26%** das ocorrências top-5.
- Pearce et al. (2021): SQL injection e command injection são as
  duas classes mais frequentes nos cenários CWE Top-25 testados.

### 5.5 Off-by-one / missing corner case (médio-forte)

- Tambon et al. (2024) lista "Missing Corner Case" como uma das 10
  categorias top em 333 bugs analisados. Não traz % específico mas
  é citado consistentemente em estudos qualitativos.

### 5.6 Solution leak / shortcut behavior (relevante para eval)

- SWE-Bench+ (Aleithan et al. 2024): **60.83%** dos resolved
  instances do Verified têm solution leak. **Não é um bug do código
  gerado**, mas é um **bug do eval** que precisamos não replicar em
  `[DEC-0018-B05]`.

### 5.7 Prompt injection / data exfiltration patterns (emergente)

- Várias publicações 2024-2025 documentam que código IA-gerado para
  agentes/tooling frequentemente carece de input sanitization para
  prompt injection — categoria nova sem CWE direto ainda.

### 5.8 Flawed reasoning em multi-step (forte para agentes)

- Bouzenia et al. (2025): **65%** das falhas de agentes são "flawed
  reasoning" (loops improdutivos, over-reliance em heurísticas
  shallow). Não é um "bug de código" no sentido clássico mas é o
  **modo dominante de falha** em workflows agentic — e o eval
  mínimo do 0018 precisa decidir se mede isso.

### 5.9 Environment / dependency conflicts

- Liu et al. (2025): Dependency Conflicts = **11.26%**, Environment
  Conflicts = **0.94%**. Total ~12% dos hallucination instances.
- "AI-Generated Code Is Not Reproducible (Yet)" (2025): documenta
  gaps de dependência sistemáticos em outputs de coding agents.

### 5.10 Code clone / churn quality (sistêmico, não bug categórico)

- GitClear 2024: copy-paste +48%, refactor -60%, churn +44% em
  4 anos. Não é uma classe de bug per se, mas é um sinal de
  **degradação de manutenibilidade** que `[DEC-0018-B01]` pode
  considerar como categoria distinta de "code smells".

---

## 6. Limitações dos benchmarks (gaps para nosso contexto)

### 6.1 Viés de linguagem

- HumanEval/MBPP: Python-only.
- SWE-bench (original): Python-only; SWE-bench Multilingual e Pro
  expandem mas dataset ainda dominado por Python.
- Aider Polyglot cobre 6 linguagens mas com 225 problemas Exercism —
  **problemas auto-contidos**, não código de produção.
- CONCUR: Java 8 only.
- **Implicação:** se nosso `ai-guidelines` é polyglot por design, **a
  generalização da literatura para JS/TS/Go/Rust requer cuidado**.

### 6.2 Viés de domínio

- METR HCAST: cybersecurity, ML, software engineering, general
  reasoning — nada específico de **CLI tools, governance frameworks,
  monorepos editoriais**, que é nosso caso.
- SWE-bench: open-source maduro (Django, sympy, scikit-learn, etc.).
  Padrões de bug podem diferir de codebases corporativos jovens.
- Estudos de segurança (Pearce, Fu): foco web (Python/JS) — não
  cobrem padrões específicos de infra-as-code, IaC, K8s manifests.

### 6.3 Viés de modelo

- Estudos antigos (Pearce 2021) usaram Codex / `cushman-codex` —
  modelos hoje obsoletos. Generalização para Claude 3.7+, GPT-4o+,
  Gemini 2.5+ é incerta.
- Estudos recentes raramente cobrem **toda** a fronteira (geralmente
  3-6 modelos). Trade-off entre recência e abrangência.

### 6.4 Viés de granularidade

- HumanEval/MBPP: snippet curto auto-contido. Não exibe N+1,
  memory leak, race condition por construção.
- SWE-bench: patch médio é de algumas dezenas de linhas em arquivo
  único; SWE-bench Pro estende mas ainda longe de "feature
  multi-arquivo + migração + teste".
- **Implicação:** o eval mínimo do 0018 precisa **declarar
  explicitamente** o que escolhe medir e o que admite não medir.

### 6.5 Viés de "teste como oracle"

- SWE-Bench+: 47.93% das resolved instances passam testes mesmo com
  fix incompleto. Confiar só em "passa/não passa" subestima bugs
  silenciosos. Para `[DEC-0018-B05]` isso reforça a necessidade de
  **mutation testing** e/ou **inspeção qualitativa** como complemento.

### 6.6 Viés de "medir o modelo standalone vs. com agente/IDE"

- Pearce, Spracklen: medem o **modelo** (autocompleção zero-shot).
- Aider, SWE-bench Verified: medem o **modelo + scaffolding + tools**.
- METR: mede o **agente** (modelo + ferramentas + loop).
- Os números **não são comparáveis** entre essas três camadas. Para
  nosso eval, declarar a camada é mandatório.

### 6.7 Viés de "fim de pipeline" (output) vs. "início" (intent)

- Quase nenhum estudo mede falhas de **entendimento de requisito**
  (e.g., LLM produz código sintaticamente correto que resolve a
  pergunta errada). Liu 2025 chama isso de "Functional Requirement
  Violation" (36.66%) mas mede via humano post-hoc, não via teste.
- Nosso `quality-gates.md` precisa decidir se quer regras voltadas
  ao output (lint-able) ou ao intent (review-able).

---

## 7. Implicações para `[DEC-0018-B01]`, `[DEC-0018-B05]`, `[DEC-0018-B08]`

### 7.1 Para `[DEC-0018-B01]` — Taxonomia das categorias de regras

A literatura sugere **três eixos ortogonais** que podem estruturar o
catálogo:

1. **Eixo "tipo de defeito"** (taxonomia clássica):
   - Hallucination (API, package, type, behavior)
   - Functional violation (requirement mismatch, missing corner case)
   - Security (CWE Top-25, criptografia, randomness, injection)
   - Reliability (concorrência, memória, performance)
   - Maintainability (clones, churn, refactor avoidance)
   - Process (test weakness, solution leak, prompt injection)

2. **Eixo "camada de detecção"** (operacional):
   - Detectável por linter/static analysis (ESLint, SonarQube, CodeQL)
   - Detectável por teste unitário (HumanEval-style)
   - Detectável por mutation testing
   - Detectável só por inspeção humana / review semântico
   - Detectável só em runtime / fuzzing / production

3. **Eixo "evidência empírica"** (calibração de confiança):
   - **Forte** (estudo formal com %, ≥3 modelos, ≥1 linguagem)
   - **Média** (citado em ≥2 estudos sem % consistente)
   - **Emergente** (citado em pesquisa 2025+ ou tópico ativo)
   - **Heurística declarada** (intuição de engenharia, sem citação)

**Opção A** — taxonomia primária por "tipo de defeito" + tag de
evidência. Familiar para engenheiros, mas pode esconder gaps.

**Opção B** — taxonomia primária por "camada de detecção". Bom para
amarrar regra → ferramenta de validação. Mas perde semântica.

**Opção C** — matriz tipo × camada, com cell coverage explícito.
Mais ambicioso, mais didático.

### 7.2 Para `[DEC-0018-B05]` — Metodologia do eval mínimo

Lições principais da literatura:

- **Não confiar só em "passa/não passa".** SWE-Bench+ mostrou 47.93%
  de falsos positivos. Combinar com mutation testing (kill-rate) ou
  revisão humana cega.
- **Declarar a camada.** Modelo standalone vs. agente vs. agente-com-tools
  produzem números diferentes em ordens de magnitude.
- **Cobrir múltiplas linguagens.** Generalizar de Python só para
  polyglot tem viés conhecido.
- **Problema de tamanho realista.** Snippets HumanEval-style não
  exibem os bugs que importam (race, memory, N+1). SWE-bench Pro-like
  é mais alinhado.
- **Anti-leak por construção.** Verificar que solução não está no
  prompt/comments — replicar metodologia SWE-Bench+.
- **Múltiplas rodadas.** Spracklen mostrou que 43% dos hallucinated
  packages são consistentes — single-shot subestima problemas
  determinísticos.

**Opção A — eval "narrow & deep":** poucos cenários (3-5) cobrindo
exatamente as categorias do catálogo, com mutation + inspeção. Caro
mas calibrado.

**Opção B — eval "broad & shallow":** dezenas de cenários auto-rodáveis,
métrica simples (passa/não passa + scanner CWE). Cheap mas com viés
SWE-bench-like.

**Opção C — híbrido:** broad para regressão CI, narrow para
calibração trimestral.

### 7.3 Para `[DEC-0018-B08]` — Reconciliação do `b9efb83`

Três opções estruturadas:

**Opção A — manter os 3 sensores como estão**, declarando
explicitamente que são "heurísticas de engenharia" com graus
distintos de respaldo empírico.
Custo: zero (já está no repo). Risco: contradiz o objetivo da Spec
0018 de virar evidence-backed.

**Opção B — reclassificar:** manter race conditions e memory leaks
no catálogo principal com nota de escopo (concorrência / runtime
de longa duração); rebaixar N+1 para "heurística não-empírica"
declarada como tal.
Custo: edição moderada de `quality-gates.md`. Risco: perde-se
alguma simetria didática.

**Opção C — refundar o catálogo a partir das categorias com
evidência forte** (hallucination, package hallucination, CWE
Top-5, off-by-one, flawed reasoning), e adicionar N+1 / race /
memory como sub-categorias dentro de "reliability/runtime"
**com tag de força de evidência** explícita.
Custo: alto. Risco: maior superfície de manutenção, mas é o que
mais alinha com o objetivo declarado da Spec.

Nenhuma das opções é decidida aqui — cabe ao decision-brief Stage 2.

---

## 8. Limitações desta síntese

1. **Cobertura temporal.** Pesquisa concentrou-se em estudos de
   2021-2026, com peso em 2024-2025. Pode haver trabalhos
   anteriores ou pré-prints muito recentes não encontrados.

2. **Cobertura linguística.** Buscas foram em inglês. Pesquisa em
   chinês (forte em LLM coding bugs research) e francês não foi
   exercitada. Estudos como o de Tambon et al. (Canadá) foram
   incluídos mas pesquisa em CSC chinesa pode ter cobertura
   adicional.

3. **Viés de fontes acadêmicas vs. industrial.** Estudos formais
   pesam mais nesta síntese. Posts da comunidade
   (Aider/Continue/Anthropic blog) foram tocados mas não
   exaustivamente. Discussões reais em GitHub issues marcadas como
   "ai-generated bug" não foram raspadas por restrições de
   superfície de pesquisa.

4. **Não-replicação.** Não rodei nenhum dos benchmarks pessoalmente —
   sigo as estatísticas reportadas pelos autores. Há histórico
   conhecido de discrepâncias entre números reportados e replicações
   independentes (vide SWE-Bench Illusion).

5. **Honestidade sobre N+1.** A ausência de evidência **não é**
   evidência de ausência. É plausível que existam estudos que não
   localizei, ou que o problema seja real mas não tenha virado
   objeto formal porque é detectado facilmente em produção (slow
   query log) e raramente sobrevive até virar dataset acadêmico.

6. **Ângulo de modelo.** As frequências reportadas dependem
   fortemente do **modelo testado**. Estudos de 2021 (Codex)
   provavelmente sobre-estimam vs. modelos 2025+ em algumas
   categorias (sintaxe, types) e sub-estimam em outras (agente
   long-horizon).

7. **Ângulo de prompt.** Quase nenhum estudo controla por
   **qualidade do prompt** — uma variável que sabemos
   (Stanford 2023; Spracklen 2025 induced vs. natural) muda
   drasticamente a taxa de defeito.

8. **Sem decisões.** Esta síntese deliberadamente não decide nada.
   Cabe ao Stage 2 / decision-brief escolher entre as opções
   apresentadas em §7.

---

## 9. Apêndice — fontes consultadas (URLs e papel na síntese)

- **Tambon et al. 2024/2025** — "Bugs in Large Language Models
  Generated Code: An Empirical Study" — taxonomia 10-categoria,
  333 bugs.
  <https://arxiv.org/abs/2403.08937>
  <https://link.springer.com/article/10.1007/s10664-025-10614-4>

- **Survey 2025** — "A Survey of Bugs in AI-Generated Code" —
  meta-análise de 8 categorias.
  <https://arxiv.org/html/2512.05239v1>

- **Liu et al. 2025** — "LLM Hallucinations in Practical Code
  Generation: Phenomena, Mechanism, and Mitigation" —
  hallucination taxonomy 3+8 com %.
  <https://arxiv.org/html/2409.20550v1>
  <https://dl.acm.org/doi/10.1145/3728894>

- **Eghbali & Pradel 2024** — "De-Hallucinator: Mitigating LLM
  Hallucinations" — efeito de iterative grounding.
  <https://arxiv.org/abs/2401.01701>

- **Spracklen et al. 2025** — "Importing Phantoms: Measuring LLM
  Package Hallucination Vulnerabilities" — PHR por modelo/linguagem.
  <https://arxiv.org/html/2501.19012v1>

- **Slopsquatting coverage (industry)** — Aikido, Socket.
  <https://www.aikido.dev/blog/slopsquatting-ai-package-hallucination-attacks>
  <https://socket.dev/blog/slopsquatting-how-ai-hallucinations-are-fueling-a-new-class-of-supply-chain-attacks>

- **Pearce et al. 2021/2023** — "Asleep at the Keyboard? Assessing
  the Security of GitHub Copilot's Code Contributions" — 1.689
  programas, ~40% vulneráveis, CWE Top-25.
  <https://arxiv.org/abs/2108.09293>
  <https://dl.acm.org/doi/10.1145/3610721>

- **Perry et al. 2023** — "Do Users Write More Insecure Code with
  AI Assistants?" — Stanford user study.
  <https://arxiv.org/abs/2211.03622>
  <https://dl.acm.org/doi/10.1145/3576915.3623157>

- **Fu et al. 2025** — "Security Weaknesses of Copilot-Generated
  Code in GitHub Projects" — 733 snippets, top-5 CWE com %.
  <https://dl.acm.org/doi/10.1145/3716848>
  <https://arxiv.org/html/2310.02059v3>

- **CONCUR 2025** — "CONCUR: Benchmarking LLMs for Concurrent Code
  Generation" — 23 LLMs × 115 problemas concorrentes.
  <https://openreview.net/pdf?id=L7rVSAv1b4>
  <https://arxiv.org/html/2603.03683>

- **"Investigating Software Aging in LLM-Generated Software
  Systems" 2025** — memory growth case studies.
  <https://arxiv.org/pdf/2510.24188>

- **Bouzenia et al. 2025** — "An Empirical Study on Failures in
  Automated Issue Solving" — taxonomia 9-categoria, 65% flawed
  reasoning.
  <https://arxiv.org/html/2509.13941>

- **METR 2025** — "Measuring AI Ability to Complete Long Tasks".
  <https://arxiv.org/abs/2503.14499>
  <https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/>

- **Aider** — leaderboards e benchmarks.
  <https://aider.chat/docs/leaderboards/>
  <https://aider.chat/docs/benchmarks.html>

- **GitClear 2024/2025** — análise de 211M LOC; cópia, churn,
  refactor.
  <https://www.gitclear.com/ai_assistant_code_quality_2025_research>
  <https://gitclear-public.s3.us-west-2.amazonaws.com/GitClear-AI-Copilot-Code-Quality-2025.pdf>

- **SWE-Bench+** — Aleithan et al. 2024 (solution leak, weak
  tests).
  <https://openreview.net/pdf/7b25f35e8d13c2c33d84177f371a0c76252ba1f4.pdf>

- **SWE-Bench Pro 2025**.
  <https://arxiv.org/pdf/2509.16941>

- **CSET Issue Brief 2024** — Cybersecurity Risks of AI-Generated
  Code (visão de policy).
  <https://cset.georgetown.edu/wp-content/uploads/CSET-Cybersecurity-Risks-of-AI-Generated-Code.pdf>
