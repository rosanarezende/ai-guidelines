# CO-10.7 kickoff — CLI pública autoexplicável e wizard orientado ao contexto

> Spec: 0024-context-architecture  
> Nó: co-flow-convergence  
> Sub-checkpoint planejado: CO-10.7  
> Decisão: [DEC-0024-G15]  
> Data: 2026-06-19  
> Estado deste artefato: kickoff preparatório; **não inicia implementação enquanto CO-10.7 não estiver ativo**.

## 1. Fato observado

O redesign do site tornou o produto mais compreensível, mas revelou um risco de inversão:

```text
site explica o fluxo ideal
→ CLI pública ainda pode exigir que a pessoa decore comandos
→ documentação compensa lacuna de produto
```

Isso viola a intenção do `co-flow-convergence`: o fluxo vivo deve ser modelado no produto, e o site deve reproduzir essa experiência, não substituir a experiência real.

## 2. Decisão operacional

`npx ai-guidelines` é a porta de entrada pública do produto.

Comandos diretos continuam existindo, mas como atalhos para automação, documentação de referência ou pessoas experientes. A experiência primária deve ser:

```text
rodar npx ai-guidelines
→ framework detecta o contexto do repositório
→ wizard explica o estado em linguagem humana
→ pessoa escolhe o próximo passo correto
→ comando/decisão apropriada é executado somente com autoridade
```

## 3. Divisão de responsabilidades

### CLI como fonte da experiência real

A CLI deve detectar e orientar:

- pasta vazia;
- projeto novo com arquivos soltos;
- repositório existente sem ai-guidelines;
- repositório existente com conflitos;
- repositório já governado;
- perfil solo, contribuições externas ou time;
- uma spec ativa;
- múltiplas specs abertas;
- ausência de spec ativa;
- branch errada;
- working tree suja;
- PR Draft/Ready;
- CI verde, pendente ou falha;
- findings, reviews, resolutions e dispositions;
- readiness ausente, readiness terminal e avanço permitido;
- revisão de PR de outra pessoa;
- modo offline/degradado;
- necessidade de review, validação, update ou decisão humana.

### `src/cli/copy` como texto operacional da CLI

Devem morar em `src/cli/copy`:

- perguntas do wizard;
- labels das opções;
- descrições curtas de opções;
- mensagens de bloqueio;
- avisos de autoridade;
- previews;
- confirmações;
- mensagens de cancelamento;
- explicações curtas de contexto.

Não devem morar em `src/cli/copy`:

- texto comercial longo;
- narrativa editorial do site;
- comparação de mercado;
- conteúdo visual;
- storytelling que só existe para documentação.

### Site como documentação viva

O site pode ter textos explicativos próprios, mas fatos operacionais devem vir da experiência real:

- se o site mostra uma opção, ela precisa existir no wizard;
- se o site mostra um comando, ele precisa existir no registry;
- se o site mostra um terminal, ele deve vir de transcript real ou estar claramente rotulado como exemplo guiado;
- se a CLI estiver confusa, a correção deve acontecer primeiro na CLI;
- depois o site reflete a experiência corrigida.

## 4. Cenários mínimos de investigação

Antes de redesenhar mais o site, CO-10.7 deve rodar e comparar a CLI pública em cenários reais.

### Onboarding

| Cenário                                           | Pergunta de falsificação                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| Pasta vazia                                       | `npx ai-guidelines` sugere inicializar sem exigir que a pessoa conheça `init`? |
| Projeto novo com arquivos soltos                  | A CLI explica se é init, adopt ou conflito?                                    |
| Repo existente com `package.json`                 | A CLI preserva conteúdo existente e orienta adopt/dry-run?                     |
| Formatter rival                                   | A CLI explica conflito e opções como `force-prettier` sem jargão?              |
| Repo sem ai-guidelines, mas com CI/Husky/Prettier | A CLI mostra o que será preservado, mesclado ou bloqueado?                     |

### Uso diário em repo governado

| Subcenário                      | Pergunta de falsificação                                                      |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Nova sessão com uma spec ativa  | A CLI mostra o foco e o próximo passo sem pedir comando específico?           |
| Nova sessão com múltiplas specs | A CLI pede escolha explícita de foco e evita inferência silenciosa?           |
| Retomada após interrupção       | A CLI explica o que estava em andamento e o que mudou?                        |
| Working tree suja               | A CLI prioriza limpar/validar mudanças antes de decisões?                     |
| Branch errada                   | A CLI bloqueia ações perigosas e orienta troca/checkout seguro?               |
| PR Draft/Ready                  | A CLI distingue implementação, Ready e Human Gate?                            |
| CI pendente/falha               | A CLI bloqueia decisões e mostra fonte factual do bloqueio?                   |
| Findings abertos                | A CLI orienta resolver findings antes de readiness/advance?                   |
| Findings fechados               | A CLI orienta disposition/readiness sem reabrir trabalho antigo?              |
| Readiness ausente               | A CLI oferece o fluxo governado correto para declarar readiness?              |
| Readiness terminal              | A CLI não tenta advance-subcheckpoint quando não há próximo sub-checkpoint?   |
| Advance permitido               | A CLI mostra preview e exige confirmação humana antes de alterar tasks/state? |

### Trabalho em time

| Subcenário                  | Pergunta de falsificação                                                 |
| --------------------------- | ------------------------------------------------------------------------ |
| Perfil solo                 | A CLI não impõe política de review/team desnecessária?                   |
| Perfil contributor          | A CLI diferencia o que a pessoa pode propor do que exige maintainer?     |
| Perfil team                 | A CLI deixa claro quando mudar política de colaboração exige autoridade? |
| Review de PR de colega      | A CLI orienta revisar branch alvo sem perder o trabalho atual?           |
| Retorno ao próprio trabalho | A CLI ajuda a voltar para spec/branch original?                          |
| Várias specs abertas        | A CLI evita aplicar decisões na spec errada?                             |

### Manutenção do framework no consumidor

| Subcenário            | Pergunta de falsificação                                                         |
| --------------------- | -------------------------------------------------------------------------------- |
| Atualizar providers   | A CLI usa seleção humana, não input por vírgula como caminho principal?          |
| Atualizar práticas    | A CLI explica CI, Prettier, Husky, TDD, BDD e Quality Gates em linguagem humana? |
| Usar `prune`          | A CLI explica quando limpar órfãos é seguro?                                     |
| Usar `force-prettier` | A CLI explica risco e efeito antes de aplicar?                                   |
| Mudar colaboração     | A CLI avisa que isso altera política global do repositório?                      |

### Modo degradado

| Subcenário     | Pergunta de falsificação                                                    |
| -------------- | --------------------------------------------------------------------------- |
| Sem GitHub/gh  | A CLI degrada para leitura local e bloqueia decisões que dependem de PR/CI? |
| Sem rede       | A CLI explica o que não pode verificar?                                     |
| CI inacessível | A CLI não inventa status verde/vermelho?                                    |
| PR state stale | A CLI pede refresh/verificação em vez de seguir por heurística local?       |

## 5. Comparação obrigatória

Para cada cenário:

```text
estado inicial
→ comando executado
→ saída observada
→ lacuna de linguagem/UX
→ regra ou texto a mover para a CLI
→ teste esperado
→ impacto no site
```

O objetivo não é documentar tudo no site primeiro. O objetivo é tornar a CLI clara o suficiente para que o site possa capturar e explicar a experiência real.

## 6. Critérios de saída do CO-10.7

CO-10.7 só deve ser considerado concluído quando:

- `npx ai-guidelines` abrir uma experiência pública orientada por contexto;
- init/adopt/update aparecerem como caminhos guiados, não como comandos a decorar;
- uso diário em repo governado for orientado sem exigir memória de agente;
- múltiplas specs exigirem escolha explícita de foco;
- trabalho em time e review de PR de colega tiverem caminho claro;
- mudanças de política global exigirem aviso de autoridade;
- estados bloqueados forem explicados em linguagem humana;
- comandos diretos continuarem disponíveis como atalhos;
- site puder derivar prints/transcripts desses fluxos reais;
- testes provarem que o site não mostra opção inexistente no wizard.

## 7. Fora de escopo

CO-10.7 não deve:

- executar Ready;
- executar Human Gate;
- fazer merge;
- avançar sub-checkpoint;
- abrir novo PR;
- alterar topologia externa;
- implementar CO-5 ou CO-6;
- transformar o site em SSOT operacional;
- mover narrativa editorial do site para `src/cli/copy`.

## 8. Próximo passo governado

Este kickoff prepara CO-10.7, mas o sub-checkpoint ativo ainda precisa ser governado pelo runtime.

Enquanto `work` apontar CO-10.6 como ativo, a implementação de CO-10.7 deve aguardar:

```text
CO-10.6 readiness
→ decisão governada de avanço CO-10.6 → CO-10.7
→ work apontando CO-10.7
→ implementação da CLI pública autoexplicável
```
