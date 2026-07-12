# Auditoria rodada 4 — a régua mais alta (o que sobrevive ao envelope)

- Data: 2026-07-01 · agente revisor externo · **apoio, não-autoridade**. Fatos verificados contra o repo (HEAD `8024028e`, ahead 26; CORS `*` em server.ts:18; `/match` client-config em :172; `simsim123` em backend.ts:41; matcher concatena need+capabilities cru — GeminiApiMatcher:19).
- **Incorporado:** a **Lente 9** (fronteiras de confiança & política) + os itens P0 de política/segurança no `features.md`. **Encerra o ciclo de auditoria** → próxima fase = simulação adversarial.

## Prompt

```
Rodada 4 — a mais dura. O modelo v2 ja incorporou rodadas 1-3 (_audits/): taxonomia em familias+
dimensoes + LENTE 8 (envelope). NAO REPITA o achado — cace o que SOBREVIVE ao envelope. Angulos
que rodadas 1-3 NAO cobriram: (1) THREAT MODEL seguranca/privacidade (vazamento por INFERENCIA;
PROMPT INJECTION via register/triage no matcher/agente; agente lendo restricted; supply-chain dos
backends; o hash impede tampering ou e teatro?); (2) FALHAS AI-NATIVE (ator=agente: GlobalRef
alucinado, over-trust no matcher, capabilities plausiveis-mas-erradas, `authority` de um agente,
auditoria com 100 mutacoes/min, loops agente-cria-tria-ativa); (3) GAMING/INCENTIVOS (mis-
classificar, expedite sempre, ignorar loop-budget, declarar incident p/ furar fila; "governance
theater"); (4) CONSISTENCIA INTERNA (as 9 lentes se contradizem? conceito morto/over-modelado? o
envelope conflita com "advisory nunca decide"?); (5) ADOCAO REAL & ESCALA (migrar de Jira/Linear;
tool-pluggable; cold-start; quem MANTEM capabilities; git como log transacional sem transacao
real; O(n) do host/matcher). SAIDA: tabela + top riscos que SOBREVIVEM ao envelope + veredito se
pronto p/ simulacao robusta + "a UNICA maior coisa ainda nao vista". Verifique contra o repo.
```

## Resposta (verbatim, condensado)

**Veredito curto.** O v2 está pronto para uma simulação **adversarial**, mas não para uma "robusta" de maturidade operacional. A Lente 8 resolveu corrida/stale/integridade **declarativa**; não resolveu **confiança adversarial**. O maior buraco: `classification`/`authority`/`hash`/`actor`/`service-class` são **autocertificados**. Sem uma camada explícita de **política, identidade, trust boundary e testes adversariais**, o envelope vira "boa auditoria de mentiras bem-formadas".

**Gaps que sobrevivem ao envelope (essência).**

- **`classification`+`egress`** × OWASP LLM (prompt injection, sensitive disclosure, supply-chain, excessive agency): vazamento por **inferência** (capabilities internas revelam estratégia/arquitetura/clientes mesmo redigidas) → **classificação derivada/taint** + matcher externo só recebe fatias aprovadas.
- **Matcher LLM** × OWASP Prompt Injection: register/triage/capability entram **crus** no prompt → **red-team corpus**; matcher tratado como não-confiável, nunca ação sem validação estrutural.
- **`actor`/`authority`** × SPIFFE / OPA policy-as-code: `actor=agent` não diz quem delegou/por quanto/escopo/kill-switch → modelar **`delegation`** (human principal · agent workload-id · escopo · TTL · policy-id · max-mutations · requiring-human-confirmation).
- **Gate append-only** × OWASP Agentic (human-agent trust exploitation): "advisory nunca decide" enfraquece se o humano carimba 100/min → **risk score + amostragem obrigatória** (acima de impacto, exige evidência independente).
- **Hash/assinatura** × SLSA + Sigstore/Rekor: hash prova integridade do arquivo, não veracidade do conteúdo (agente comprometido assina lixo coerente) → **trusted producers · key rotation · transparency log · verificar policy** antes de aceitar.
- **Capabilities** × service catalog com owners/audit: geradas por IA viram **knowledge poisoning** → `evidence`/`owner-attested-by`/`observed-from`/`last-verified`/`negative-capabilities`; IA só abre PR, não atualiza SSOT.
- **Dimensões** (`service-class`/`change-class`/`classification`) × policy engines: **gaming** (tudo `expedite`; declarar incidente p/ furar fila; baixar classificação p/ usar API) → **quotas e invariantes** (expedite budget · incident exige evento/severidade · downgrade exige approver separado).
- **Backends plugáveis** × OWASP supply-chain/SLSA: Neo4j/Mongo/Ollama/Gemini/CLI viram egress+supply-chain; `simsim123` default → **allowlist · secrets fora do YAML · TLS · pin/SBOM · least-privilege**.
- **CLI delegate matcher** × OWASP Agentic (tool misuse): usa login/plano; injection alcança credenciais → **proibir em sim "robusta" ou sandbox sem rede/home/tokens/tools**.
- **Append-only/archives** × NIST AI RMF: colidem com retenção/segredo acidental/direito de remoção → `retention-class` · `purge-redaction-event` · anexos fora do git · secret scanning.
- **Tool-pluggable/coexistência** × Jira REST (audit/permissions/webhooks): migração cria **split brain** → adapter contract (campo autoritativo por sistema · direção de sync · resolução de conflito · freeze window).
- **Host agrega N `context.json`** × indexadores: **O(N)** custo/latência/prompt-enorme → índice por domínio/classificação · top-k lexical local antes do LLM · cache por `source-commit` · shard por ownership.

**Top riscos que sobrevivem.** (1) confiança autocertificada; (2) prompt injection no plano de governança; (3) egress por inferência; (4) agente como ator sem delegação formal; (5) gaming de classificação/prioridade; (6) capability poisoning; (7) supply-chain dos backends/matchers; (8) governance theater.

**Consistência interna.** A contradição sutil: o tracker diz "docs externos inspiram, não definem" — ok p/ **ontologia**, mas **segurança precisa de controle NORMATIVO versionado**. A saída não é citar OWASP como autoridade, e sim criar artefatos governados locais: `threat-model.yml` · `policy-catalog.yml` · `egress-policy.yml` · `agent-delegation-policy.yml` · `red-team-corpus/`. Senão a L8 mistura metadado de auditoria com controle de segurança.

**Pronto p/ simulação robusta?** Não p/ adoção real; **sim p/ simulação ADVERSARIAL de falsificação**, com os primeiros cenários: register com prompt injection · capability envenenada · agente com autoridade excessiva · matcher externo bloqueado por classificação · `context.json` assinado-mas-malicioso · `expedite` abusado · import Jira/Linear com conflito de SSOT.

**A única maior coisa ainda não vista:** **trust boundary como entidade de 1ª classe.** O modelo tem grafo, envelope, identidade lógica e lifecycle; falta representar **onde termina a confiança, quem pode atravessar a fronteira, com qual prova, e como o sistema reage quando um ator autorizado mente.**
