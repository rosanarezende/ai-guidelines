# Guia de Setup Claude (Antigravity)

Este adaptador contém diretrizes para a interação com modelos Anthropic Claude (Haiku, Sonnet, Opus) via Interface Antigravity ou Cursor.

## Otimização de Mensagens

- **Haiku**: Utilize para refações rápidas e tarefas atômicas de codificação.
- **Sonnet/Opus**: Utilize para planejamento arquitetural profundo e análise de múltiplos arquivos.

## Contexto e Ignore

- Utilize `.claudeignore` para repositórios acessados via Claude Desktop ou plugins específicos.
- O formato segue o padrão `.gitignore`, similar ao `.geminiignore`.

---

## Observações de Comportamento

Claude tende a ser extremamente verboso. Quando carregado com as **Global Rules**, ele deve priorizar respostas sucintas e foco em artefatos.
