# Research: Fricções de Bootstrap em Consumo Real (`site`)

**Data:** 2026-05-08
**Domínio:** UX da CLI e Arquitetura de Bootstrap do Consumidor
**Relacionado a:** Spec 0021 (`governance-information-architecture`) e candidata `process-automations`

## 1. Contexto

Durante um teste de consumo real do pacote publicado no repositório `site`, o fluxo executado foi:

1. `yarn add ai-guidelines --dev`
2. `npx ai-guidelines`

O consumidor usa **Yarn Classic 1.22.22**. O wizard interativo seguiu o caminho `adopt` e concluiu a aplicação do baseline no repositório alvo.

## 2. Fricções observadas

### 2.1 Latência percebida alta no bootstrap

O passo `yarn add ai-guidelines --dev` levou ~303s no relato do consumidor. Em seguida, `npx ai-guidelines` também foi percebido como demorado.

Essa fricção não prova, sozinha, que a causa raiz esteja no código do framework. O tempo total mistura:

- resolução/instalação do package manager do consumidor;
- download e bootstrap do `npx`;
- inicialização do wizard e da lógica de detecção do projeto.

Mesmo assim, para a experiência do usuário final, isso é **uma única jornada de onboarding**. O valor percebido do framework cai se o primeiro contato parecer lento ou opaco.

### 2.2 Encerramento estranho do processo interativo

Após a execução do `npx ai-guidelines`, o consumidor relatou que a CLI "só saiu quando dei Enter".

Hipótese inicial: há risco de comportamento inconsistente na fronteira entre dois estilos de prompt interativo:

- wizard via `@inquirer/prompts`;
- prompts posteriores via `readline` manual.

Mesmo sem reproduzir ainda o defeito de forma determinística, o relato é forte o suficiente para virar evidência de produto: a CLI pode estar dando a sensação de travamento ou retenção indevida do TTY no fim do fluxo.

### 2.3 Ausência de um bootstrap explícito do sistema documental

O consumidor identificou uma lacuna de produto: hoje o fluxo começa em `init`/`adopt`, mas não existe um comando dedicado para:

- configurar o workspace documental do consumidor;
- escolher onde viverão specs, backlog, histórico e memória correlata;
- preparar o terreno para a primeira sessão com a LLM escolhida;
- entregar prompts canônicos para a primeira sessão e para specs subsequentes.

Sem isso, parte do valor do framework fica implícita e depende de descoberta manual.

## 3. Implicação arquitetural

Essas fricções se dividem em duas classes e não devem ser resolvidas pela mesma spec:

### Classe A — contrato de informação e placement

Pertence à Spec 0021 decidir:

- se o lifecycle SDD continua fixo em `.specify/specs/` ou se nasce um `spec_workspace_dir`;
- se `spec_workspace_dir` existir, qual é o **default canônico**;
- a separação formal entre `sdd_dir` (artefatos locais do framework) e `spec_workspace_dir` (memória operacional do consumidor);
- o contrato documental para comandos futuros: `config`, `spec init`, `intake`, `status`.

### Classe B — implementação e UX da CLI

Pertence a uma spec posterior de automação/onboarding implementar:

- `ai-guidelines config` como comando de bootstrap explícito;
- prompts de primeira sessão e de continuidade;
- investigação objetiva da latência percebida;
- correção do eventual problema de encerramento/TTY.

## 4. Recomendação

1. **Não implementar comandos novos antes da 0021.** Sem contrato de placement decidido, a CLI corre o risco de cristalizar paths e artefatos errados.
2. **Registrar a fricção agora como evidência empírica de consumo real.** Isso evita que a discussão futura sobre onboarding nasça apenas de hipótese da mantenedora.
3. **Quando a spec de CLI vier depois da 0021, incluir testes de fim de fluxo via shim real do npm/npx**, não apenas chamadas diretas ao entrypoint, para cobrir comportamento de TTY/encerramento observado pelo consumidor.
