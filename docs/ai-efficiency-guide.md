# Guia Definitivo de Eficiência de IA: Modelos, Contexto e Economia

Este guia une a filosofia agnóstica de Agentes de IA com as especificidades técnicas projetadas para 2026, garantindo máxima performance, precisão técnica e economia de tokens em qualquer ecossistema de projetos.

---

## 1. Núcleo de Eficiência (Agnóstico)

A eficiência não é apenas sobre gastar menos, mas sobre **precisão por token**.

- **RPI Protocol**: Research (Pesquisar), Plan (Planejar), Implement (Implementar). O tempo gasto em Research e Plan reduz drasticamente o churn de tokens na fase de Implementation.
- **Modularidade Atômica (Regra de Ouro)**: Máximo de 3 arquivos por solicitação. Se a tarefa é maior, fragmente-a. Contextos menores resultam em menor taxa de alucinação.
- **Feedback Cirúrgico**: Faça as correções diretamente no artefato gerado. Evite reenviar prompts longos para ajustes de estilo ou typos.

---

## 2. Context Engineering e Prompt Caching

Em 2026, a gestão de contexto evoluiu de "limitar arquivos" para "otimizar o cache".

### Prompt Caching (Claude / Gemini / GPT)

Modelos modernos utilizam cache de prefixo. Isso significa que se você mantém a estrutura inicial do prompt (regras, contexto de arquitetura) estável, as chamadas subsequentes são muito mais baratas e rápidas.

- **Estabilidade**: Evite mudar suas `global-rules.md` ou `AGENTS.md` no meio de uma tarefa.
- **Injeção de Contexto**: Ferramentas CLI (Claude Code, Gemini CLI) otimizam isso automaticamente. Em ferramentas manuais, cole o contexto estático primeiro.

### Redução de Ruído

- **Ignore Files**: Rigor absoluto com `.gitignore`, `.geminiignore` e `.claudeignore`. Nunca deixe `node_modules`, `dist`, `.git` ou logs entrarem no contexto.
- **System Prompts vs User Prompts**: Mantenha as regras em arquivos (Nível 1 e 2) e use o prompt do usuário apenas para a **intenção imediata**.

---

## 3. Estratégia de Model Routing (Intelligence Routing)

Não confie cegamente em "o modelo mais novo é melhor". Aplique o **Ceticismo Informado**.

- **Model Routing**:
  - **Modelos Fast/Flash**: 80% do trabalho. Refactoring simples, testes unitários, documentação, typos.
  - **Modelos Pro/Opus/Reasoning**: 20% do trabalho. Arquitetura, migrações complexas, debugging de race conditions, specs iniciais.
- **Ceticismo de Versão**: Modelos novos podem sofrer "nerfs" ou mudanças de comportamento pós-lançamento. Teste features críticas em versões diferentes se notar degradação de performance.
- **Adaptive Thinking**: Modelos com "Thinking Mode" ou "Chain of Thought" (ex: Gemini Thinking) melhoram a precisão lógica mas aumentam a latência e o custo. Use apenas quando o `Plan` exigir raciocínio profundo.

---

## 4. Nuances Linguísticas e Padrões Avançados

### EN vs PT em Prompts

Embora o output final deva seguir o projeto (PT-BR), alguns modelos performam melhor em lógica complexa quando o prompt de instrução é em **Inglês**.

- **Recomendação**: Use Inglês para instruções de lógica densa; use PT-BR para iteração criativa e exploração.

### AI Revisando AI (Pattern)

Para tarefas de alta criticidade, use um modelo "Senior" para gerar e um modelo "Junior/Fast" para revisar, ou utilize dois modelos de provedores diferentes para cross-validation.

---

## 5. Matriz de Modelos (Referência 2026)

> **Data da Consulta:** 27 de abril de 2026.
> **Aviso:** O mercado de IA evolui em ciclos extremamente rápidos. Quem consome este guia pode estar lidando com modelos superiores ou substitutos aos listados abaixo. Verifique sempre o estado atual das APIs.

| Família              | Modelos de Referência (2026) | Superpoder                                      | Quando Evitar                                 |
| :------------------- | :--------------------------- | :---------------------------------------------- | :-------------------------------------------- |
| **Claude 4.x**       | **Sonnet 4 / Opus 4**        | Coding-first, computer use e raciocínio humano. | Tarefas triviais de texto (caro).             |
| **Gemini 2.x / 3.x** | **Pro / Flash / Thinking**   | Janela de 2M-5M tokens e integração multimodal. | Quando o isolamento total de dados é crítico. |
| **GPT-5 / o-series** | **GPT-5 / o3-preview**       | Raciocínio lógico puro e pesquisa profunda.     | Refactoring simples de UI.                    |
| **DeepSeek / Llama** | **Llama 4 / DeepSeek-V3+**   | Performance flagship em infraestrutura local.   | Integração "out-of-the-box" em IDEs pagas.    |

---

## 6. Cost Awareness e Quotas

Acompanhe o consumo para evitar interrupções de fluxo.

- **Sinais de Cota**: Quando o modelo começar a dar respostas curtas ou "esquecer" instruções, verifique se atingiu o limite de tokens (TPM/RPM).
- **Visualizador de Quotas**: Ver Spec 0014 para ferramentas de monitoramento automático.

---

> [!NOTE]
> **Adapters de IA:** Para configurações específicas de cada ferramenta (paths de regras, comandos de inicialização), consulte os adaptadores em `.core/rules/` no repositório fonte.
