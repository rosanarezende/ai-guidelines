# F5 — revisão adversarial da v3 (Codex) · RECONCILIADA

- **status:** reconciliada (repo vence) · **16/16 findings ACEITOS** (F10 = já estava no pacote da P12 aguardando gate) · aplicação por blocos aguarda gate da owner
- **base:** HEAD `ef3f71ad` · Codex RODOU o validador e plantou 6 quebras — todas passaram com 0 issues (a prova de que a barra não foi atingida ainda)
- **veredito do Codex (aceito):** a v3 prova que o modelo é representável e navegável, mas NÃO prova que os controles funcionam — "a sim ainda aceita texto bem-formado como se fosse evidência resolvida"

## Findings reconciliados (todos FATOs verificados)

| id  | sev | o quê                                                                               | destino (bloco) |
| --- | --- | ----------------------------------------------------------------------------------- | --------------- |
| F1  | P0  | schema fail-open: chave com typo é ignorada em silêncio                             | I               |
| F13 | P1  | standalone sem enum de kind; telemetria como texto                                  | I               |
| F3  | P0  | review externo conferido só por prefixo — "externo: qualquer-coisa" passa           | I               |
| F2  | P0  | resolver de outcome não existe (só 4 campos checados)                               | J               |
| F9  | P1  | attester pode ser autocertificação de fato (fonte owned pelo próprio time medido)   | J               |
| F16 | P2  | UI afirma "independente" sem resolver — **CORRIGIDO já** (rótulo honesto)           | ✔               |
| F5  | P0  | profile-declaration: approver/eligibility são texto (approved-by: time-sre passou)  | K               |
| F6  | P0  | sem envelope L8 nos YAML — mutações perigosas sem actor/base-revision/idempotency   | K               |
| F4  | P0  | contenção de contrato (2 intents × acme-user-context) sem decision-point executável | L               |
| F12 | P1  | deps só intra-intent; a coordenação consent×checkout é prosa                        | L               |
| F11 | P1  | sim não computa forma observada/colapso/drift (a derivação da P12 não tem executor) | M               |
| F7  | P1  | follow-ups de incidente são strings — o loop postmortem→intake não fecha            | M               |
| F15 | P2  | matcher não existe na v3 (routed-by é texto)                                        | M               |
| F8  | P1  | apps carregam CDN sem SRI (supply chain em tela de decisão)                         | N               |
| F14 | P1  | generatedAt suja o repo a cada build — **CORRIGIDO já** (hash de conteúdo)          | ✔               |
| F10 | P1  | compatibility-window duplicada (migration-wave × contract) no model.yml             | pacote P12      |

## Blocos de aplicação (aguardam gate; ordem recomendada = a do Codex)

- **Bloco I — schema fail-closed (P0) · ✅ APLICADO:** strict loader com schema fechado por tipo (required · allowed · enums · refs; chave desconhecida = ERRO) + review estruturado (authority derivada exata, não prefixo) + **fixtures adversariais automatizadas** (as 6 quebras do Codex viram testes que DEVEM falhar).
- **Bloco J — resolver de verdade (P0) · ✅ APLICADO:** resolver de outcome completo (refs · janela · unidade · revision · attester · contract-revisions derivadas) + independência REAL do attester (cadeia de ownership: fonte × métrica × nó medido) + UI só afirma o que o resolver provou.
- **Bloco K — authority & envelope (P0) · ✅ APLICADO:** registry de authorities/trust-boundaries (pessoas · times · fontes com owner resolvível) + envelope L8 mínimo nas mutações perigosas (contract-revision · actual-publish · profile-change · verdict · break-glass).
- **Bloco L — coordenação (P1):** fila de revisão por contrato (contract-revision-proposal: breaking? · consumers · owner-approval · decision) — a contenção vira caso resolvível — + deps cross-intent (GlobalRef) com ciclo no grafo inteiro.
- **Bloco M — derivação & fluxo (P1):** observed-form/approach-drift/signal-drift/collapse lint + follow-ups→proposal resolvível (aresta raises) + stub do matcher (score · unknown · evidence · followed/overrode).
- **Bloco N — infra (P1):** vendor/SRI p/ os apps (+ CSP) · separação load→normalize→resolve→lint no tooling.

## Arquitetura (propostas do Codex, aceitas em princípio)

Strict loader + schema registry · resolver separado do loader · **outcomes como primeiro event-log append-only** (começa pequeno, não é big-bang) · contratos como fila de revisão · testes adversariais como fixtures permanentes.
