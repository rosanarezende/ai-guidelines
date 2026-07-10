---
artifact-kind: decision-brief
---

# Design system inicial - Guilda Governance

> **Status:** direcao inicial para adaptar produto.
> **Data:** 2026-07-08.
> **Autoridade:** orienta design visual e tokens da `governance-demo`; nao fecha
> marca final, fonte final, logo vetorial nem clearance juridico.

## 1. Principio central

```text
Pessoas decidem. O sistema apoia.
```

O design deve transmitir governanca sem peso burocratico: clareza, contexto,
responsabilidade e fluxo. A marca nao deve parecer um brasao medieval literal,
um SaaS generico de IA, uma ferramenta de compliance fria ou um dashboard
corporativo decorativo.

## 2. Sistema narrativo

| Elemento visual | Significado no produto                                   |
| --------------- | -------------------------------------------------------- |
| Centro em latao | decisao humana; o sistema nunca decide sozinho           |
| Blocos verdes   | areas de trabalho, times, iniciativas, dominios          |
| Blocos claros   | contexto, documentos, evidencias, insights               |
| Bloco grafite   | politica, risco, restricao, guardrail                    |
| Linhas/veredas  | trilhas de evidencia, responsabilidade e rastreabilidade |
| Fluxo para fora | repositorios, integracoes, governance host e mundo real  |
| Xicara do Cup   | parceiro contextual chamado para pensar junto            |

## 3. Tokens de cor iniciais

Os valores abaixo sao ponto de partida, extraidos da direcao visual escolhida.
Eles devem virar tokens de tema antes de serem aplicados em componentes.

| Token                 | Hex       | Uso principal                                      |
| --------------------- | --------- | -------------------------------------------------- |
| `guilda.green.900`    | `#0F3A34` | marca, sidebar, headers escuros, linhas principais |
| `guilda.green.700`    | `#14554C` | hover/active em superficies verdes                 |
| `guilda.sage.500`     | `#8FA99A` | evidencia, contexto, apoio visual                  |
| `guilda.sage.100`     | `#DDE6DF` | fundos leves de evidencia/contexto                 |
| `guilda.brass.500`    | `#C9A35A` | decisao humana, destaque contido, foco narrativo   |
| `guilda.graphite.900` | `#2B2F33` | texto forte, risco, politica, contraste            |
| `guilda.offwhite.50`  | `#F7F5F1` | fundo publico/login, superficies quentes           |
| `guilda.white`        | `#FFFFFF` | superficie interna e contraste                     |

### 3.1 Uso semantico

- **Decisao humana:** `guilda.brass.500`, sempre com parcimonia.
- **Trabalho/time/dominio:** `guilda.green.900` e `guilda.green.700`.
- **Contexto/evidencia:** `guilda.sage.500`, `guilda.sage.100` e
  `guilda.offwhite.50`.
- **Risco/politica/guardrail:** `guilda.graphite.900`, com alertas visuais
  claros quando houver bloqueio.
- **Fluxo/continuidade:** linhas em verde; saidas externas podem receber acento
  em latao.

## 4. Tipografia

Direcao inicial:

- **Marca/landing:** pode usar uma serifada editorial no wordmark e em headlines
  publicas, desde que continue legivel em PT/EN.
- **Produto/app:** usar sans-serif funcional para navegacao, formularios,
  dashboards, tabelas e onboarding.
- **CLI/docs tecnicos:** manter monospace apenas para comandos, paths e codigo.

Regra: a tipografia do app deve servir leitura e tomada de decisao; o tom
editorial fica reservado para pagina publica, login e materiais institucionais.

## 5. Superficies do produto

### 5.1 Pagina publica

Objetivo: explicar o produto sem depender de conhecimento tecnico.

Diretrizes:

- headline centrada em pessoas e trabalho, nao em IA;
- visual do workgraph como cena de fundo/apoio;
- chamadas: documentacao, experimentar demo, GitHub;
- evitar hero de marketing generico com gradiente/orbs.

Copy base:

```text
Pessoas decidem. O sistema apoia.
Governanca de trabalho open-source para decisoes claras, evidencias conectadas
e responsabilidades visiveis.
```

### 5.2 Login e signup

Objetivo: entrada segura e pouco intimidante.

Diretrizes:

- reforcar que nao guardamos senhas quando o fluxo for magic link/provider;
- permitir experimentar demo sem conta;
- explicar que conta/convite pertencem ao portal, enquanto a governanca real
  mora no Git/governance host do usuario;
- usar a imagem de workgraph como apoio, nao como decoracao dominante.

### 5.3 App interno

Objetivo: operacao clara e repetivel.

Diretrizes:

- manter layout utilitario, denso o suficiente para trabalho real;
- sidebar pode usar verde profundo;
- area de conteudo deve permanecer clara/off-white, com cards discretos;
- usar `guilda.brass.500` para decisao/destaque, nao como cor dominante;
- riscos e bloqueios devem ser legiveis, nao apenas coloridos.

### 5.4 Dashboards e resultados

Objetivo: mostrar saude do workgraph e resultados com lastro.

Diretrizes:

- dashboards devem priorizar leitura operacional;
- graficos usam ECharts como renderer primario decidido em QRD visual;
- metricas precisam apontar para evidencia/sourceRevision quando possivel;
- numeros sem lastro devem aparecer como limitacao, nao como verdade.

### 5.5 Mapas/workgraph

Objetivo: explicar relacoes, nao impressionar com grafo tecnico.

Diretrizes:

- visual principal deve ser navegavel por stakeholders;
- React Flow + ELK continua adequado para mapas guiados;
- grafo tecnico pode ter renderer proprio quando necessario;
- filtros, foco e legenda precisam existir antes de considerar a tela validada.

### 5.6 CLI - `guilda flow`

Objetivo: operacao repo-first para devs e automacoes.

Diretrizes:

- manter linguagem direta: `guilda flow`;
- usar a trinca `decisions • evidence • responsibility`;
- nao transformar CLI em marca principal do app;
- CLI deve parecer ferramenta de bancada, nao portal.

### 5.7 Cup - Contextual Work Partner

Objetivo: parceiro contextual transversal.

Diretrizes:

- nome: **Guilda Cup**;
- descricao: **Contextual Work Partner**;
- iconografia: xicara de cha/cafe;
- evitar "copilot" como promessa principal;
- o Cup sugere, explica, revisa e prepara rascunhos; nao decide nem grava sem
  confirmacao humana.

## 6. Componentes e estados

Diretrizes para adaptacao de MUI:

- cards com raio discreto, preferencialmente ate 8px;
- botoes primarios em verde profundo;
- foco/decisao em latao apenas quando for semanticamente uma decisao;
- badges de evidencia/contexto em sage;
- alertas de risco/politica devem ter texto claro e acao possivel;
- skeleton/loading devem preservar layout, sem saltos;
- tooltips devem explicar icones e estados incomuns.

## 7. Acessibilidade e contraste

- Toda cor semantica precisa ter texto ou icone complementar.
- A versao em fundo escuro precisa ter contraste validado.
- A versao 16px do simbolo precisa ser simplificada; nao usar o JPG reduzido
  como favicon final.
- O app precisa funcionar sem depender de textura, sombra ou baixa opacidade.

## 8. Assets de referencia

Primeira escolha visual versionada:

- [`brand/reference/2026-07-08-first-choice/guilda-symbol-light-reference.jpg`](brand/reference/2026-07-08-first-choice/guilda-symbol-light-reference.jpg)
- [`brand/reference/2026-07-08-first-choice/guilda-symbol-dark-reference.jpg`](brand/reference/2026-07-08-first-choice/guilda-symbol-dark-reference.jpg)
- [`brand/reference/2026-07-08-first-choice/guilda-consolidated-board-reference.jpg`](brand/reference/2026-07-08-first-choice/guilda-consolidated-board-reference.jpg)

Primeira vetorizacao/refinamento manual no Affinity:

- [`brand/assets/2026-07-08-affinity-symbol/guilda-symbol-color.png`](brand/assets/2026-07-08-affinity-symbol/guilda-symbol-color.png)
- [`brand/assets/2026-07-08-affinity-symbol/guilda-symbol-monochrome.png`](brand/assets/2026-07-08-affinity-symbol/guilda-symbol-monochrome.png)
- [`brand/assets/2026-07-08-affinity-symbol/guilda-symbol-line.png`](brand/assets/2026-07-08-affinity-symbol/guilda-symbol-line.png)

Familia de icones por superficie, com versoes para fundo claro e escuro:

- [`brand/assets/2026-07-08-product-icons/governance.png`](brand/assets/2026-07-08-product-icons/governance.png)
- [`brand/assets/2026-07-08-product-icons/governance-inverse.png`](brand/assets/2026-07-08-product-icons/governance-inverse.png)
- [`brand/assets/2026-07-08-product-icons/graph.png`](brand/assets/2026-07-08-product-icons/graph.png)
- [`brand/assets/2026-07-08-product-icons/graph-inverse.png`](brand/assets/2026-07-08-product-icons/graph-inverse.png)
- [`brand/assets/2026-07-08-product-icons/host.png`](brand/assets/2026-07-08-product-icons/host.png)
- [`brand/assets/2026-07-08-product-icons/host-inverse.png`](brand/assets/2026-07-08-product-icons/host-inverse.png)
- [`brand/assets/2026-07-08-product-icons/flow.png`](brand/assets/2026-07-08-product-icons/flow.png)
- [`brand/assets/2026-07-08-product-icons/flow-inverse.png`](brand/assets/2026-07-08-product-icons/flow-inverse.png)
- [`brand/assets/2026-07-08-product-icons/cup.png`](brand/assets/2026-07-08-product-icons/cup.png)
- [`brand/assets/2026-07-08-product-icons/cup-inverse.png`](brand/assets/2026-07-08-product-icons/cup-inverse.png)

Regra de uso:

- Use as versoes sem sufixo em fundos claros/off-white.
- Use as versoes `*-inverse.png` em fundos verde profundo, grafite ou cards
  escuros.
- `governance` e a marca principal do app.
- `graph` representa Guilda Workgraph.
- `host` representa Guilda Host.
- `flow` representa `guilda flow`.
- `cup` representa Guilda Cup.

Imagem candidata para hero da pagina publica:

- [`brand/assets/2026-07-08-public-hero/public-workgraph-hero.png`](brand/assets/2026-07-08-public-hero/public-workgraph-hero.png)

Regra de uso:

- Use como imagem de landing/public hero.
- Nao use como icone de produto.
- Mantenha `graph.png` e `graph-inverse.png` reservados ao icone de
  **Guilda Workgraph**.

## 9. O que ainda nao esta decidido

- Nome publico final.
- Clearance juridico de **Guilda Governance**.
- Logo vetorial final.
- Fonte final do wordmark.
- Tokens finais de tema no MUI.
- Aplicacao visual em todas as telas existentes.
- Favicon e app icon finais.

## 10. Fase de aplicacao no prototipo versionado

Esta fase pode comecar usando os PNGs refinados no Affinity como assets
candidatos. O objetivo nao e "fechar marca", e sim validar se a linguagem visual
funciona no produto real.

Ordem recomendada:

1. Criar tokens de tema `guilda.*` no frontend sem reescrever a UI inteira.
2. Aplicar marca em superficies de entrada: pagina publica, login, signup,
   experimentar demo e convite.
3. Aplicar shell interno: sidebar, topbar, workspace switcher e Cup launcher.
4. Adaptar dashboards/mapas para usar a semantica decisao/evidencia/risco sem
   trocar comportamento.
5. Revisar onboarding/configuracoes depois do shell, para nao redesenhar cada
   tela duas vezes.
6. Criar teste visual/manual de contraste e responsividade antes de expandir
   para todas as views.

Fora de escopo nesta fase:

- registrar marca;
- comprar dominio;
- trocar nome do repo/package;
- declarar logo final;
- criar favicon definitivo.

## 11. Proxima implementacao recomendada

1. Criar tema MUI com tokens `guilda.*` sem trocar todas as telas de uma vez.
2. Adaptar login/signup e pagina publica primeiro, por serem superficies de
   marca.
3. Adaptar shell/sidebar/topbar do app interno.
4. Revisar onboarding/configuracoes com a nova semantica de decisao/evidencia.
5. Vetorizar o simbolo antes de usar em producao ou repo publico.
