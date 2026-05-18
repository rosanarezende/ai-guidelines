# Guia de Eficiência de IA

> Como maximizar a **precisão por token** ao trabalhar com agentes de IA em projetos de software.
> Complementa as regras do monólito `AGENTS.md` com estratégias avançadas.

---

## 1. RPI: O Protocolo Fundamental

A eficiência começa **antes** do prompt. O ciclo **Research → Plan → Implement** reduz drasticamente o retrabalho:

| Fase          | O que fazer                          | Por que importa                                            |
| ------------- | ------------------------------------ | ---------------------------------------------------------- |
| **Research**  | Ler código existente, specs, ADRs    | Evita alucinação — a IA trabalha com fatos, não suposições |
| **Plan**      | Descrever mudanças antes de executar | Permite revisão humana antes do custo de implementação     |
| **Implement** | Executar o plano aprovado            | Commits atômicos com contexto claro                        |

> Detalhes do ciclo em [`rpi-protocol.md`](rpi-protocol.md).

---

## 2. Context Engineering

Em 2026, a gestão de contexto evoluiu de "limitar arquivos" para "otimizar o cache".

### Prompt Caching

Modelos modernos utilizam cache de prefixo: se a estrutura inicial do prompt (regras, contexto de arquitetura) se mantém estável, as chamadas subsequentes são mais baratas e rápidas.

- **Estabilidade**: Evite alterar regras core ou o `AGENTS.md` no meio de uma tarefa.
- **Injeção de Contexto**: Ferramentas CLI (Claude Code, Gemini CLI) otimizam isso automaticamente. Em ferramentas manuais, cole o contexto estático primeiro.

### Redução de Ruído

- **Ignore Files**: Rigor absoluto com `.gitignore`, `.geminiignore` e `.claudeignore`. Nunca deixe `node_modules`, `dist`, `.git` ou logs entrarem no contexto.
- **System Prompts vs User Prompts**: Mantenha as regras fixas no monólito `AGENTS.md` e use o prompt do usuário apenas para a **intenção imediata**.

---

## 3. Model Routing (Intelligence Routing)

Nem toda tarefa precisa do modelo mais poderoso. Aplique o **Ceticismo Informado**:

| Tipo de tarefa      | Modelo recomendado                     | Exemplos                                          |
| ------------------- | -------------------------------------- | ------------------------------------------------- |
| **80% do trabalho** | Fast/Flash (Haiku, Flash, GPT-4o-mini) | Refactoring, testes unitários, formatação, docs   |
| **20% do trabalho** | Pro/Opus/Reasoning (Opus, Pro, o3)     | Arquitetura, migrações, debugging complexo, specs |

### Observações práticas

- **Ceticismo de Versão**: Modelos novos podem sofrer mudanças de comportamento pós-lançamento. Teste features críticas em versões diferentes se notar degradação.
- **Adaptive Thinking**: Modelos com "Thinking Mode" melhoram a precisão lógica mas aumentam latência e custo. Use apenas quando o plano exigir raciocínio profundo.

---

## 4. Padrões Avançados

### EN vs PT-BR em Prompts

Embora o output final siga a convenção do projeto, alguns modelos performam melhor em lógica complexa com instruções em **Inglês**.

- **Recomendação**: Use inglês para instruções de lógica densa; use PT-BR para iteração criativa e exploração.

### IA Revisando IA

Para tarefas de alta criticidade, use um modelo "Senior" para gerar e um modelo "Fast" para revisar, ou dois modelos de provedores diferentes para cross-validation.

---

## 5. Cost Awareness

Acompanhe o consumo para evitar interrupções de fluxo:

- **Sinais de Cota**: Quando o modelo começar a dar respostas curtas ou "esquecer" instruções, verifique se atingiu o limite de tokens (TPM/RPM).
- **Fragmentação preventiva**: Se a tarefa é grande, divida em sub-tarefas antes de estourar o contexto. É mais barato que recomeçar.

---

> [!NOTE]
> **Adaptadores de IA:** Para configurações específicas de cada ferramenta (paths, ignore files, comportamento observado), consulte os adaptadores compilados no bloco `<AI_GUIDELINES>` do `AGENTS.md`.
