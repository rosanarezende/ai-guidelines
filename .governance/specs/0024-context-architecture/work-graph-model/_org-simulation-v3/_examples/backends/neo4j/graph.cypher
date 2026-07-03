// Neo4j graph seed generated from the v3 runtime read-model.
MERGE (m:ProjectionMetadata {contentHash: 'c04076d80f7e'})
SET m.schema = 'acme.backend-example/v1', m.nodeCount = 174, m.edgeCount = 374, m.issueCount = 4;

MERGE (n:GovernanceNode:REPO {id: 'acme-analytics'})
SET n.type = 'repo', n.label = 'acme-analytics', n.data = '{"id":"acme-analytics","owner":"time-data","caps":["eventos","métricas","experimentos-fonte"]}', n.dataHash = '4040c3f3a52c';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-analytics::context'})
SET n.type = 'repo-context', n.label = 'acme-analytics context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-analytics","owner":"time-data","role":"event-platform","domain":"measurement","modules":[],"provides":[{"name":"acme-events-schema","kind":"event-schema","status":"active"},{"name":"experiment-event-source","kind":"event-sink","status":"active"},{"name":"conversion-metrics-source","kind":"metric-source","status":"active"}],"consumes":[],"capabilities":[{"text":"Event schema, event collection and experiment exposure tracking.","tags":["eventos","experimentos-fonte"]},{"text":"Conversion and activation measurement inputs for business outcomes.","tags":["metricas","conversao","ativacao"]}],"architecture":{"stack":["node","javascript"],"patterns":["event-schema","in-memory-event-sink"],"boundaries":["metric-source","schema-owner"]},"package":{"name":"@acme-sim/acme-analytics","dependencies":[]},"code":{"entrypoint":"src/index.mjs","exports":["conversionEvent","eventSchema","experimentExposure","inMemoryEventSink","track"],"sourceHash":"d24ebece413a"},"contentHash":"a4f3ff8ec2d5"}', n.dataHash = '6f6eade14a9b';
MERGE (n:GovernanceNode:REPO_CONTRACT {id: 'acme-analytics::contract::acme-events-schema'})
SET n.type = 'repo-contract', n.label = 'acme-events-schema@v1', n.data = '{"schema":"acme.repo-contract/v1","id":"acme-events-schema","revision":"v1","ownerRepo":"acme-analytics","consumers":["acme-mfe-billing","acme-mfe-onboarding","acme-checkout","acme-checkout-api"],"compatibilityWindow":null,"interface":{"kind":"event-schema","version":"v1","fields":[{"name":"name","type":"string","required":true},{"name":"accountId","type":"string","required":true},{"name":"occurredAt","type":"iso-date-time","required":true},{"name":"properties","type":"object","required":false}],"events":["billing_upgrade_viewed","checkout_started","checkout_completed","onboarding_step_seen","experiment_exposure"]},"revisionProposals":[],"source":{"kind":"central-contract","file":"acme-governance/contracts/contracts.yml","contractHash":"708818ce198b"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-analytics\\\\.governance\\\\registry\\\\contracts\\\\acme-events-schema.yml","_repo":"acme-analytics"}', n.dataHash = '31bc03470caf';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-analytics::src/index.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/index.mjs', n.data = '{"repo":"acme-analytics","path":"src/index.mjs"}', n.dataHash = '786c9c7ff810';
MERGE (n:GovernanceNode:REPO {id: 'acme-api-billing'})
SET n.type = 'repo', n.label = 'acme-api-billing', n.data = '{"id":"acme-api-billing","owner":"time-billing","caps":["cobrança","elegibilidade","assinaturas"]}', n.dataHash = '9cdd939183c0';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-api-billing::context'})
SET n.type = 'repo-context', n.label = 'acme-api-billing context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-api-billing","owner":"time-billing","role":"backend-service","domain":"billing","modules":[],"provides":[{"name":"billing-subscription-api","kind":"api","status":"active"},{"name":"billing-eligibility-api","kind":"api","status":"proposed"}],"consumes":[{"contract":"acme-core-api/legacy-billing-api","why":"current-subscription-and-invoices"}],"capabilities":[{"text":"Billing plans, subscriptions and upgrade quotes.","tags":["cobranca","planos","assinaturas"]},{"text":"Eligibility API for contextual cross-sell experiments.","tags":["elegibilidade","upgrade"]}],"architecture":{"stack":["node","javascript"],"patterns":["backend-api","legacy-adapter"],"boundaries":["billing-domain"]},"package":{"name":"@acme-sim/acme-api-billing","dependencies":["@acme-sim/acme-core-api"]},"code":{"entrypoint":"src/index.mjs","exports":["currentSubscription","listPlans","quoteUpgrade","upgradeSubscription"],"sourceHash":"0d757c8a8f51"},"contentHash":"872ca7251a10"}', n.dataHash = '5e942953173f';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-api-billing::src/index.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/index.mjs', n.data = '{"repo":"acme-api-billing","path":"src/index.mjs"}', n.dataHash = '201b2a88a7ad';
MERGE (n:GovernanceNode:REPO {id: 'acme-checkout'})
SET n.type = 'repo', n.label = 'acme-checkout', n.data = '{"id":"acme-checkout","owner":"time-checkout","caps":["checkout-ui","carrinho","cupom","frete"]}', n.dataHash = '07ffdae591bd';
MERGE (n:GovernanceNode:REPO {id: 'acme-checkout-api'})
SET n.type = 'repo', n.label = 'acme-checkout-api', n.data = '{"id":"acme-checkout-api","owner":"time-checkout","caps":["pedidos","pagamento","frete-api"]}', n.dataHash = '977e52f19ccb';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-checkout-api::context'})
SET n.type = 'repo-context', n.label = 'acme-checkout-api context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-checkout-api","owner":"time-checkout","role":"backend-service","domain":"checkout","modules":[],"provides":[{"name":"checkout-order-api","kind":"api","status":"active"},{"name":"freight-api","kind":"api","status":"active"},{"name":"coupon-api","kind":"api","status":"active"}],"consumes":[{"contract":"acme-core-api/legacy-orders-api","why":"create-order-and-reserve-inventory"},{"contract":"acme-core-api/legacy-accounts-api","why":"account-status"},{"contract":"acme-analytics/acme-events-schema","why":"checkout-api-events"}],"capabilities":[{"text":"Checkout order API, payment token seam and freight calculation.","tags":["pedidos","pagamento","frete-api"]},{"text":"Coupon calculation and pricing guardrails.","tags":["cupom","frete"]}],"architecture":{"stack":["node","javascript"],"patterns":["backend-api","legacy-adapter"],"boundaries":["checkout-domain"]},"package":{"name":"@acme-sim/acme-checkout-api","dependencies":["@acme-sim/acme-core-api"]},"code":{"entrypoint":"src/index.mjs","exports":["applyCoupon","calculateFreight","createCheckoutOrder"],"sourceHash":"77fd476a6d38"},"contentHash":"7123dbe17220"}', n.dataHash = '646686d509de';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-checkout-api::src/index.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/index.mjs', n.data = '{"repo":"acme-checkout-api","path":"src/index.mjs"}', n.dataHash = 'ca867bd7e8dc';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-checkout::context'})
SET n.type = 'repo-context', n.label = 'acme-checkout context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-checkout","owner":"time-checkout","role":"microfrontend","domain":"checkout","modules":[],"provides":[{"name":"checkout-ui","kind":"ui-surface","status":"active"}],"consumes":[{"contract":"acme-design-system/acme-design-tokens","why":"visual-contract"},{"contract":"acme-design-system/checkout-components","why":"checkout-summary"},{"contract":"acme-web-host/acme-user-context","why":"recurring-customer-context"},{"contract":"acme-checkout-api/checkout-order-api","why":"submit-checkout"},{"contract":"acme-checkout-api/freight-api","why":"freight-preview"},{"contract":"acme-checkout-api/coupon-api","why":"coupon-validation"},{"contract":"acme-analytics/acme-events-schema","why":"funnel-measurement"}],"capabilities":[{"text":"Checkout UI, cart flow, coupon handling and freight preview.","tags":["checkout-ui","carrinho","cupom","frete"]}],"architecture":{"stack":["node","javascript","html"],"patterns":["microfrontend","checkout-flow","progressive-rollout"],"boundaries":["checkout-ui"]},"package":{"name":"@acme-sim/acme-checkout","dependencies":["@acme-sim/acme-analytics","@acme-sim/acme-checkout-api","@acme-sim/acme-design-system","@acme-sim/acme-web-host"]},"code":{"entrypoint":"src/index.mjs","exports":["renderCheckout","submitCheckout"],"sourceHash":"bd9092274529"},"contentHash":"15fce85abf5e"}', n.dataHash = '352a155336c8';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-checkout::src/index.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/index.mjs', n.data = '{"repo":"acme-checkout","path":"src/index.mjs"}', n.dataHash = 'e8b25d52bb9d';
MERGE (n:GovernanceNode:REPO {id: 'acme-core-api'})
SET n.type = 'repo', n.label = 'acme-core-api', n.data = '{"id":"acme-core-api","owner":"area-platform","caps":["api-legada","integracoes"],"note":"MONOLITO legado — grande demais p/ um time só: donos por MÓDULO (padrão CODEOWNERS)","modules":[{"id":"mod-billing","owner":"time-billing","caps":["cobranca-legada","notas-fiscais"]},{"id":"mod-orders","owner":"time-checkout","caps":["pedidos-legados","estoque"]},{"id":"mod-accounts","owner":"time-identity","caps":["contas","permissoes-legadas"]},{"id":"mod-reports","owner":"time-data","caps":["relatorios-legados"]}]}', n.dataHash = 'fa344827fadf';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-core-api::context'})
SET n.type = 'repo-context', n.label = 'acme-core-api context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-core-api","owner":"area-platform","role":"legacy-monolith","domain":"legacy-core","modules":[{"id":"mod-billing","owner":"time-billing","capabilities":[{"text":"Legacy billing and invoices.","tags":["cobranca-legada","notas-fiscais"]}]},{"id":"mod-orders","owner":"time-checkout","capabilities":[{"text":"Legacy orders and inventory reservations.","tags":["pedidos-legados","estoque"]}]},{"id":"mod-accounts","owner":"time-identity","capabilities":[{"text":"Legacy accounts and permissions.","tags":["contas","permissoes-legadas"]}]},{"id":"mod-reports","owner":"time-data","capabilities":[{"text":"Legacy reports and CSV exports.","tags":["relatorios-legados"]}]}],"provides":[{"name":"legacy-billing-api","kind":"api","status":"active","owner":"time-billing"},{"name":"legacy-orders-api","kind":"api","status":"active","owner":"time-checkout"},{"name":"legacy-accounts-api","kind":"api","status":"active","owner":"time-identity"},{"name":"legacy-reports-api","kind":"api","status":"active","owner":"time-data"}],"consumes":[],"capabilities":[{"text":"Legacy API seams used by migration waves and strangler work.","tags":["api-legada","integracoes"]}],"architecture":{"stack":["node","javascript"],"patterns":["modular-monolith","strangler-seam"],"boundaries":["module-owner-overrides","platform-custodian"]},"package":{"name":"@acme-sim/acme-core-api","dependencies":[]},"code":{"entrypoint":"src/index.mjs","exports":["addPermission","buildRevenueReport","canAccess","createInvoice","createLegacyOrder","exportCsv","getAccount","getLegacyOrder","legacyPlanForAccount","listInvoices","monolithModules","reserveInventory"],"sourceHash":"c3804c97ad17"},"contentHash":"94535e6569b5"}', n.dataHash = 'b8df39825cdb';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-core-api::src/modules/accounts.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/modules/accounts.mjs', n.data = '{"repo":"acme-core-api","path":"src/modules/accounts.mjs"}', n.dataHash = '129adbb9f04c';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-core-api::src/modules/orders.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/modules/orders.mjs', n.data = '{"repo":"acme-core-api","path":"src/modules/orders.mjs"}', n.dataHash = 'd28af671b863';
MERGE (n:GovernanceNode:MODULE {id: 'acme-core-api#mod-accounts'})
SET n.type = 'module', n.label = 'mod-accounts', n.data = '{"id":"mod-accounts","owner":"time-identity","caps":["contas","permissoes-legadas"],"repo":"acme-core-api"}', n.dataHash = '2b8f67a7dd93';
MERGE (n:GovernanceNode:MODULE {id: 'acme-core-api#mod-billing'})
SET n.type = 'module', n.label = 'mod-billing', n.data = '{"id":"mod-billing","owner":"time-billing","caps":["cobranca-legada","notas-fiscais"],"repo":"acme-core-api"}', n.dataHash = '0c4438aa2753';
MERGE (n:GovernanceNode:MODULE {id: 'acme-core-api#mod-orders'})
SET n.type = 'module', n.label = 'mod-orders', n.data = '{"id":"mod-orders","owner":"time-checkout","caps":["pedidos-legados","estoque"],"repo":"acme-core-api"}', n.dataHash = '6adf4be59352';
MERGE (n:GovernanceNode:MODULE {id: 'acme-core-api#mod-reports'})
SET n.type = 'module', n.label = 'mod-reports', n.data = '{"id":"mod-reports","owner":"time-data","caps":["relatorios-legados"],"repo":"acme-core-api"}', n.dataHash = 'f1487096a205';
MERGE (n:GovernanceNode:REPO {id: 'acme-data-pipeline'})
SET n.type = 'repo', n.label = 'acme-data-pipeline', n.data = '{"id":"acme-data-pipeline","owner":"time-data","caps":["etl","warehouse"]}', n.dataHash = '2195edfdc002';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-data-pipeline::context'})
SET n.type = 'repo-context', n.label = 'acme-data-pipeline context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-data-pipeline","owner":"time-data","role":"data-pipeline","domain":"warehouse-and-rollup","modules":[],"provides":[{"name":"warehouse-metrics","kind":"metric-source","status":"active"},{"name":"target-actuals","kind":"outcome-attestation","status":"active"}],"consumes":[{"contract":"acme-analytics/acme-events-schema","why":"materialize-daily-metrics"},{"contract":"acme-analytics/experiment-event-source","why":"read-event-sink"}],"capabilities":[{"text":"ETL and warehouse materialization for target actuals.","tags":["etl","warehouse"]},{"text":"Cost-to-serve, ticket-cost and consent coverage snapshots.","tags":["metricas","outcomes","custo"]}],"architecture":{"stack":["node","javascript"],"patterns":["etl","derived-read-model"],"boundaries":["attestation-source","warehouse"]},"package":{"name":"@acme-sim/acme-data-pipeline","dependencies":["@acme-sim/acme-analytics"]},"code":{"entrypoint":"src/index.mjs","exports":["materializeDailyMetrics","targetActualSnapshot"],"sourceHash":"2f540098d1be"},"contentHash":"ebb7734db1c8"}', n.dataHash = '68144e6aace4';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-data-pipeline::src/index.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/index.mjs', n.data = '{"repo":"acme-data-pipeline","path":"src/index.mjs"}', n.dataHash = '0a701fbbe574';
MERGE (n:GovernanceNode:REPO {id: 'acme-design-system'})
SET n.type = 'repo', n.label = 'acme-design-system', n.data = '{"id":"acme-design-system","owner":"area-platform","caps":["componentes","tokens"],"note":"compartilhado"}', n.dataHash = '5ed4d65b518c';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-design-system::context'})
SET n.type = 'repo-context', n.label = 'acme-design-system context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-design-system","owner":"area-platform","role":"platform-library","domain":"design-platform","modules":[],"provides":[{"name":"acme-design-tokens","kind":"design-contract","status":"active"},{"name":"billing-components","kind":"ui-components","status":"active"},{"name":"checkout-components","kind":"ui-components","status":"active"},{"name":"onboarding-components","kind":"ui-components","status":"active"},{"name":"consent-components","kind":"ui-components","status":"active"}],"consumes":[],"capabilities":[{"text":"Design tokens and shared UI components for product microfrontends.","tags":["componentes","tokens"]},{"text":"Plan cards, checkout summaries, consent banners and onboarding steps.","tags":["billing-ui","checkout-ui","consentimento","onboarding"]}],"architecture":{"stack":["node","javascript","html"],"patterns":["component-library","design-tokens"],"boundaries":["ui-only","no-product-state"]},"package":{"name":"@acme-sim/acme-design-system","dependencies":[]},"code":{"entrypoint":"src/index.mjs","exports":["Button","CheckoutSummary","ConsentBanner","OnboardingStep","PlanCard","renderDesignSystemCatalog","tokens"],"sourceHash":"3b9d3ed058b5"},"contentHash":"6e7215cc880a"}', n.dataHash = 'a0720b120b50';
MERGE (n:GovernanceNode:REPO_CONTRACT {id: 'acme-design-system::contract::acme-design-tokens'})
SET n.type = 'repo-contract', n.label = 'acme-design-tokens@v2', n.data = '{"schema":"acme.repo-contract/v1","id":"acme-design-tokens","revision":"v2","ownerRepo":"acme-design-system","consumers":["acme-mfe-billing","acme-mfe-onboarding","acme-checkout"],"compatibilityWindow":null,"interface":null,"revisionProposals":[],"source":{"kind":"central-contract","file":"acme-governance/contracts/contracts.yml","contractHash":"a99d3b5a3b91"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-design-system\\\\.governance\\\\registry\\\\contracts\\\\acme-design-tokens.yml","_repo":"acme-design-system"}', n.dataHash = 'f4fbdeb64004';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-design-system::src/index.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/index.mjs', n.data = '{"repo":"acme-design-system","path":"src/index.mjs"}', n.dataHash = '85df5a9d3ff9';
MERGE (n:GovernanceNode:CONTRACT {id: 'acme-design-tokens'})
SET n.type = 'contract', n.label = 'acme-design-tokens@v2', n.data = '{"id":"acme-design-tokens","revision":"v2","owner-repo":"acme-design-system","consumers":["acme-mfe-billing","acme-mfe-onboarding","acme-checkout"],"compatibility-window":null}', n.dataHash = 'c867bfbdd29d';
MERGE (n:GovernanceNode:CONTRACT {id: 'acme-events-schema'})
SET n.type = 'contract', n.label = 'acme-events-schema@v1', n.data = '{"id":"acme-events-schema","revision":"v1","owner-repo":"acme-analytics","consumers":["acme-mfe-billing","acme-mfe-onboarding","acme-checkout","acme-checkout-api"],"compatibility-window":null,"interface":{"kind":"event-schema","version":"v1","fields":[{"name":"name","type":"string","required":true},{"name":"accountId","type":"string","required":true},{"name":"occurredAt","type":"iso-date-time","required":true},{"name":"properties","type":"object","required":false}],"events":["billing_upgrade_viewed","checkout_started","checkout_completed","onboarding_step_seen","experiment_exposure"]}}', n.dataHash = 'bb2d4d4ed235';
MERGE (n:GovernanceNode:REPO {id: 'acme-help-center'})
SET n.type = 'repo', n.label = 'acme-help-center', n.data = '{"id":"acme-help-center","owner":"time-support","caps":["ajuda","tickets","chatbot","self-service"]}', n.dataHash = '001ea97830a9';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-help-center::context'})
SET n.type = 'repo-context', n.label = 'acme-help-center context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-help-center","owner":"time-support","role":"support-application","domain":"customer-support","modules":[],"provides":[{"name":"help-center-ui","kind":"ui-surface","status":"active"},{"name":"ticket-api","kind":"api","status":"active"},{"name":"chatbot-api","kind":"api","status":"active"}],"consumes":[{"contract":"acme-web-host/acme-user-context","why":"account-bound-support"},{"contract":"acme-analytics/acme-events-schema","why":"deflection-measurement"}],"capabilities":[{"text":"Help articles, ticket creation and chatbot self-service.","tags":["ajuda","tickets","chatbot","self-service"]}],"architecture":{"stack":["node","javascript"],"patterns":["support-portal","self-service"],"boundaries":["support-domain"]},"package":{"name":"@acme-sim/acme-help-center","dependencies":["@acme-sim/acme-web-host"]},"code":{"entrypoint":"src/index.mjs","exports":["chatbotReply","openTicket","searchArticles"],"sourceHash":"f99909c02b13"},"contentHash":"f4210337bacf"}', n.dataHash = 'a79400277b15';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-help-center::src/index.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/index.mjs', n.data = '{"repo":"acme-help-center","path":"src/index.mjs"}', n.dataHash = 'fa94ecfa3732';
MERGE (n:GovernanceNode:REPO {id: 'acme-identity'})
SET n.type = 'repo', n.label = 'acme-identity', n.data = '{"id":"acme-identity","owner":"time-identity","caps":["auth","login","consentimento","privacidade"]}', n.dataHash = 'bda5d81ec905';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-identity::context'})
SET n.type = 'repo-context', n.label = 'acme-identity context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-identity","owner":"time-identity","role":"backend-service","domain":"identity-and-consent","modules":[],"provides":[{"name":"identity-session-api","kind":"api","status":"active"},{"name":"consent-api","kind":"api","status":"active"}],"consumes":[],"capabilities":[{"text":"Authentication, sessions and user/account context.","tags":["auth","login"]},{"text":"Consent preferences and privacy controls.","tags":["consentimento","privacidade"]}],"architecture":{"stack":["node","javascript"],"patterns":["service-module","in-memory-fixture"],"boundaries":["identity-source","consent-source"]},"package":{"name":"@acme-sim/acme-identity","dependencies":[]},"code":{"entrypoint":"src/index.mjs","exports":["getSession","getUserContext","requireScope","updateConsent"],"sourceHash":"b161a1646dad"},"contentHash":"e2b889b137be"}', n.dataHash = '7c9b5f1f25fb';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-identity::src/index.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/index.mjs', n.data = '{"repo":"acme-identity","path":"src/index.mjs"}', n.dataHash = '76125c63dc20';
MERGE (n:GovernanceNode:REPO {id: 'acme-mfe-billing'})
SET n.type = 'repo', n.label = 'acme-mfe-billing', n.data = '{"id":"acme-mfe-billing","owner":"time-billing","caps":["billing-ui","planos","upgrade"]}', n.dataHash = '6f652ea82198';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-mfe-billing::context'})
SET n.type = 'repo-context', n.label = 'acme-mfe-billing context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-mfe-billing","owner":"time-billing","role":"microfrontend","domain":"billing-growth","modules":[],"provides":[{"name":"billing-upgrade-ui","kind":"ui-surface","status":"active"}],"consumes":[{"contract":"acme-design-system/acme-design-tokens","why":"visual-contract"},{"contract":"acme-design-system/billing-components","why":"plan-card"},{"contract":"acme-web-host/acme-user-context","why":"account-context"},{"contract":"acme-api-billing/billing-subscription-api","why":"plans-and-quotes"},{"contract":"acme-api-billing/billing-eligibility-api","why":"contextual-eligibility"},{"contract":"acme-analytics/acme-events-schema","why":"experiment-measurement"}],"capabilities":[{"text":"Billing upgrade UI, plan cards and contextual CTA experiments.","tags":["billing-ui","planos","upgrade"]}],"architecture":{"stack":["node","javascript","html"],"patterns":["microfrontend","feature-flag","experiment-ui"],"boundaries":["billing-ui"]},"package":{"name":"@acme-sim/acme-mfe-billing","dependencies":["@acme-sim/acme-analytics","@acme-sim/acme-api-billing","@acme-sim/acme-design-system","@acme-sim/acme-web-host"]},"code":{"entrypoint":"src/index.mjs","exports":["previewUpgrade","renderBillingUpgrade"],"sourceHash":"43e4bcc3be17"},"contentHash":"38cfba32f640"}', n.dataHash = '99480ce0f604';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-mfe-billing::src/index.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/index.mjs', n.data = '{"repo":"acme-mfe-billing","path":"src/index.mjs"}', n.dataHash = 'fe5aaf17f0f1';
MERGE (n:GovernanceNode:REPO {id: 'acme-mfe-onboarding'})
SET n.type = 'repo', n.label = 'acme-mfe-onboarding', n.data = '{"id":"acme-mfe-onboarding","owner":"time-onboarding","caps":["onboarding","ativação","tours"]}', n.dataHash = 'dfc59d1f8136';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-mfe-onboarding::context'})
SET n.type = 'repo-context', n.label = 'acme-mfe-onboarding context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-mfe-onboarding","owner":"time-onboarding","role":"microfrontend","domain":"onboarding","modules":[],"provides":[{"name":"onboarding-checklist-ui","kind":"ui-surface","status":"active"}],"consumes":[{"contract":"acme-design-system/acme-design-tokens","why":"visual-contract"},{"contract":"acme-design-system/onboarding-components","why":"onboarding-step"},{"contract":"acme-identity/consent-api","why":"analytics-consent"},{"contract":"acme-web-host/acme-user-context","why":"account-context"},{"contract":"acme-analytics/acme-events-schema","why":"activation-measurement"}],"capabilities":[{"text":"Onboarding checklist, activation tour and consent-aware first-week flows.","tags":["onboarding","ativacao","tours"]}],"architecture":{"stack":["node","javascript","html"],"patterns":["microfrontend","activation-checklist","experiment-ui"],"boundaries":["onboarding-ui"]},"package":{"name":"@acme-sim/acme-mfe-onboarding","dependencies":["@acme-sim/acme-analytics","@acme-sim/acme-design-system","@acme-sim/acme-identity"]},"code":{"entrypoint":"src/index.mjs","exports":["completeOnboardingStep","renderOnboardingTour"],"sourceHash":"dc7e442aeb05"},"contentHash":"8c5deda8131b"}', n.dataHash = '9140215c9ecc';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-mfe-onboarding::src/index.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/index.mjs', n.data = '{"repo":"acme-mfe-onboarding","path":"src/index.mjs"}', n.dataHash = '292eee7f5e6c';
MERGE (n:GovernanceNode:REPO {id: 'acme-obs-stack'})
SET n.type = 'repo', n.label = 'acme-obs-stack', n.data = '{"id":"acme-obs-stack","owner":"time-sre","caps":["alertas","slo","tracing","atesta-outcomes"]}', n.dataHash = 'd97741861d41';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-obs-stack::context'})
SET n.type = 'repo-context', n.label = 'acme-obs-stack context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-obs-stack","owner":"time-sre","role":"observability-platform","domain":"reliability","modules":[],"provides":[{"name":"slo-snapshots","kind":"metric-source","status":"active"},{"name":"incident-alerts","kind":"telemetry-source","status":"active"}],"consumes":[],"capabilities":[{"text":"Alerts, SLOs, tracing and p99 snapshots.","tags":["alertas","slo","tracing"]},{"text":"Operational outcome attestation for latency and incident-count metrics.","tags":["atesta-outcomes","observabilidade"]}],"architecture":{"stack":["node","javascript"],"patterns":["telemetry-source","slo-snapshot"],"boundaries":["incident-source","operational-attester"]},"package":{"name":"@acme-sim/acme-obs-stack","dependencies":[]},"code":{"entrypoint":"src/index.mjs","exports":["incidentAlert","p99Latency","recordTrace","sloSnapshot"],"sourceHash":"06ed6090ba30"},"contentHash":"ef01ac401036"}', n.dataHash = 'cf80735309b7';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-obs-stack::src/index.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/index.mjs', n.data = '{"repo":"acme-obs-stack","path":"src/index.mjs"}', n.dataHash = '4483bdfb1ad9';
MERGE (n:GovernanceNode:CONTRACT {id: 'acme-user-context'})
SET n.type = 'contract', n.label = 'acme-user-context@v3', n.data = '{"id":"acme-user-context","revision":"v3","owner-repo":"acme-web-host","consumers":["acme-mfe-billing","acme-mfe-onboarding","acme-checkout"],"compatibility-window":null,"interface":{"kind":"object","version":"v3","fields":[{"name":"sessionId","type":"string","required":true},{"name":"accountId","type":"string","required":true},{"name":"userContextVersion","type":"string","required":true},{"name":"entitlements","type":"string[]","required":true}]},"revision-proposals":[{"id":"acme-user-context-v4-coordenada","revision":"v4","breaking":true,"intents":["intent-checkout-stack","intent-consent-center"],"consumers":["acme-mfe-billing","acme-mfe-onboarding","acme-checkout"],"owner-approval":"head-platform","decision":"single-revision","compatibility-window":"v3+v4 até consumidores migrarem; janela revisada no release-rollout"}]}', n.dataHash = 'f38e6be8504d';
MERGE (n:GovernanceNode:CONTRACT_REVISION_PROPOSAL {id: 'acme-user-context::acme-user-context-v4-coordenada'})
SET n.type = 'contract-revision-proposal', n.label = 'acme-user-context@v4', n.data = '{"id":"acme-user-context-v4-coordenada","revision":"v4","breaking":true,"intents":["intent-checkout-stack","intent-consent-center"],"consumers":["acme-mfe-billing","acme-mfe-onboarding","acme-checkout"],"owner-approval":"head-platform","decision":"single-revision","compatibility-window":"v3+v4 até consumidores migrarem; janela revisada no release-rollout","contract":"acme-user-context"}', n.dataHash = 'a01d573fa7ab';
MERGE (n:GovernanceNode:REPO {id: 'acme-web-host'})
SET n.type = 'repo', n.label = 'acme-web-host', n.data = '{"id":"acme-web-host","owner":"area-platform","caps":["shell-mfes","contexto-de-usuario","roteamento"],"note":"compartilhado"}', n.dataHash = '7f3a82ff7bf4';
MERGE (n:GovernanceNode:REPO_CONTEXT {id: 'acme-web-host::context'})
SET n.type = 'repo-context', n.label = 'acme-web-host context', n.data = '{"schema":"acme.repo-context/v1","repo":"acme-web-host","owner":"area-platform","role":"platform-shell","domain":"web-platform","modules":[],"provides":[{"name":"acme-user-context","kind":"shared-contract","status":"active"},{"name":"shell-mfes","kind":"runtime-contract","status":"active"}],"consumes":[{"contract":"acme-identity/identity-session-api","why":"resolve-user-session"},{"contract":"acme-identity/consent-api","why":"publish-consent-fields"}],"capabilities":[{"text":"Microfrontend shell, routing and user-context publication.","tags":["shell-mfes","contexto-de-usuario","roteamento"]},{"text":"Shared browser host for billing, checkout, onboarding and support surfaces.","tags":["microfrontend-host","user-context"]}],"architecture":{"stack":["node","javascript","html"],"patterns":["microfrontend-shell","contract-publisher"],"boundaries":["shared-user-context","route-resolution"]},"package":{"name":"@acme-sim/acme-web-host","dependencies":["@acme-sim/acme-identity"]},"code":{"entrypoint":"src/index.mjs","exports":["mountMicroFrontend","publishUserContextContract","resolveUserContext","routeFor"],"sourceHash":"d940f8912958"},"contentHash":"0917694bbc86"}', n.dataHash = '05242680d56e';
MERGE (n:GovernanceNode:REPO_CONTRACT {id: 'acme-web-host::contract::acme-user-context'})
SET n.type = 'repo-contract', n.label = 'acme-user-context@v3', n.data = '{"schema":"acme.repo-contract/v1","id":"acme-user-context","revision":"v3","ownerRepo":"acme-web-host","consumers":["acme-mfe-billing","acme-mfe-onboarding","acme-checkout"],"compatibilityWindow":null,"interface":{"kind":"object","version":"v3","fields":[{"name":"sessionId","type":"string","required":true},{"name":"accountId","type":"string","required":true},{"name":"userContextVersion","type":"string","required":true},{"name":"entitlements","type":"string[]","required":true}]},"revisionProposals":[{"id":"acme-user-context-v4-coordenada","revision":"v4","breaking":true,"intents":["intent-checkout-stack","intent-consent-center"],"consumers":["acme-mfe-billing","acme-mfe-onboarding","acme-checkout"],"owner-approval":"head-platform","decision":"single-revision","compatibility-window":"v3+v4 até consumidores migrarem; janela revisada no release-rollout"}],"source":{"kind":"central-contract","file":"acme-governance/contracts/contracts.yml","contractHash":"0f17dc00de60"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-web-host\\\\.governance\\\\registry\\\\contracts\\\\acme-user-context.yml","_repo":"acme-web-host"}', n.dataHash = 'ba0d7fbc2740';
MERGE (n:GovernanceNode:CODE_TOUCHPOINT {id: 'acme-web-host::src/index.mjs'})
SET n.type = 'code-touchpoint', n.label = 'src/index.mjs', n.data = '{"repo":"acme-web-host","path":"src/index.mjs"}', n.dataHash = '0b34e1e13b6c';
MERGE (n:GovernanceNode:METRIC {id: 'activation-rate'})
SET n.type = 'metric', n.label = 'activation-rate', n.data = '{"id":"activation-rate","unit":"%","source":"acme-analytics","aggregation":"avg","owner":"time-data"}', n.dataHash = '10279111e3bc';
MERGE (n:GovernanceNode:AREA {id: 'area-cx'})
SET n.type = 'area', n.label = 'área de experiência do cliente', n.data = '{"id":"area-cx","title":"área de experiência do cliente","cascades-from":["obj-retention","obj-efficiency"],"driver":"suporte que retém + autoatendimento que barateia","owner":"head-cx"}', n.dataHash = 'd91a59b43253';
MERGE (n:GovernanceNode:AREA {id: 'area-growth'})
SET n.type = 'area', n.label = 'área de growth', n.data = '{"id":"area-growth","title":"área de growth","cascades-from":["obj-revenue","obj-retention"],"driver":"cross-sell entre os produtos + ativação que retém","owner":"head-growth"}', n.dataHash = '67f1adecccab';
MERGE (n:GovernanceNode:AREA {id: 'area-platform'})
SET n.type = 'area', n.label = 'área de plataforma', n.data = '{"id":"area-platform","title":"área de plataforma","cascades-from":["obj-efficiency","obj-trust"],"driver":"eficiência, confiabilidade e privacidade da plataforma","owner":"head-platform"}', n.dataHash = '7cea12919a00';
MERGE (n:GovernanceNode:STANDALONE {id: 'bug-frete'})
SET n.type = 'standalone', n.label = 'fix: bug-frete', n.data = '{"schema":"acme.standalone-work/v1","id":"bug-frete","kind":"fix","repo":"acme-checkout","origin":"suporte reporta: cupom duplo zera o frete","routing":{"matcher":"local-capability-matcher","query":"cupom duplo zera frete","selected-repo":"acme-checkout","decision":"followed","decided-by":"lead-checkout","suggestions":[{"repo":"acme-checkout","score":0.91,"unknown":false,"evidence":["cap:cupom","cap:frete","owner:time-checkout"]},{"repo":"acme-checkout-api","score":0.44,"unknown":true,"evidence":[]}]},"review":"interno","placar":"operational-bucket","source":{"kind":"standalone","file":"repos/acme-checkout/.governance/works/bug-frete.yml"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-checkout\\\\.governance\\\\works\\\\bug-frete.yml","_repo":"acme-checkout"}', n.dataHash = '39e5c9a7fb2b';
MERGE (n:GovernanceNode:METRIC {id: 'churn-rate'})
SET n.type = 'metric', n.label = 'churn-rate', n.data = '{"id":"churn-rate","unit":"%/mês","source":"acme-analytics","aggregation":"avg","owner":"time-data"}', n.dataHash = '22a1d5f3c625';
MERGE (n:GovernanceNode:METRIC {id: 'consent-coverage'})
SET n.type = 'metric', n.label = 'consent-coverage', n.data = '{"id":"consent-coverage","unit":"% de dados com base legal","source":"acme-data-pipeline","aggregation":"avg","owner":"time-data"}', n.dataHash = '9601e3736f3e';
MERGE (n:GovernanceNode:METRIC {id: 'conversion-rate'})
SET n.type = 'metric', n.label = 'conversion-rate', n.data = '{"id":"conversion-rate","unit":"%","source":"acme-analytics","aggregation":"avg","owner":"time-data"}', n.dataHash = '68c5dc5aafbf';
MERGE (n:GovernanceNode:METRIC {id: 'cost-to-serve'})
SET n.type = 'metric', n.label = 'cost-to-serve', n.data = '{"id":"cost-to-serve","unit":"R$/pedido","source":"acme-data-pipeline","aggregation":"avg","owner":"time-data"}', n.dataHash = '5148a9e764ef';
MERGE (n:GovernanceNode:STANDALONE {id: 'dep-bump-host'})
SET n.type = 'standalone', n.label = 'dep-bump: dep-bump-host', n.data = '{"schema":"acme.standalone-work/v1","id":"dep-bump-host","kind":"dep-bump","repo":"acme-web-host","origin":"rotina: lib X 3.x → 4.x","review":"externo: area-platform","placar":"operational-bucket","source":{"kind":"standalone","file":"repos/acme-web-host/.governance/works/dep-bump-host.yml"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-web-host\\\\.governance\\\\works\\\\dep-bump-host.yml","_repo":"acme-web-host"}', n.dataHash = '6d5c8ca894e3';
MERGE (n:GovernanceNode:STANDALONE {id: 'fix-checkout-timeout'})
SET n.type = 'standalone', n.label = 'fix: fix-checkout-timeout', n.data = '{"schema":"acme.standalone-work/v1","id":"fix-checkout-timeout","kind":"fix","repo":"acme-checkout-api","origin":"follow-up de incident:incidente-checkout — reduzir timeout e fallback do checkout","review":"interno","placar":"operational-bucket","source":{"kind":"standalone","file":"repos/acme-checkout-api/.governance/works/fix-checkout-timeout.yml"},"owner":"lead-checkout","started-at":"2027-04-08","base-revision":"acme-checkout-api@7fd8f246b1ca","completed-at":"2027-04-09","source-commit":"acme-checkout-api@fix-timeout-rev3","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs --repo acme-checkout-api","result":"passed","files":["src/routes/checkout.mjs","src/lib/timeout-policy.mjs"]},"verification":{"checked-by":"lead-checkout","result":"passed"},"status":"done","_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-checkout-api\\\\.governance\\\\works\\\\fix-checkout-timeout.yml","_repo":"acme-checkout-api"}', n.dataHash = '45360e19ccbf';
MERGE (n:GovernanceNode:AUTHORITY {id: 'head-cx'})
SET n.type = 'authority', n.label = 'head-cx', n.data = '{"id":"head-cx","kind":"role","of":"area-cx"}', n.dataHash = '2695496cd19a';
MERGE (n:GovernanceNode:AUTHORITY {id: 'head-growth'})
SET n.type = 'authority', n.label = 'head-growth', n.data = '{"id":"head-growth","kind":"role","of":"area-growth"}', n.dataHash = '998a2db59efa';
MERGE (n:GovernanceNode:AUTHORITY {id: 'head-platform'})
SET n.type = 'authority', n.label = 'head-platform', n.data = '{"id":"head-platform","kind":"role","of":"area-platform"}', n.dataHash = '0b1fb41b5415';
MERGE (n:GovernanceNode:METRIC {id: 'incident-count'})
SET n.type = 'metric', n.label = 'incident-count', n.data = '{"id":"incident-count","unit":"incidentes/mês","source":"acme-obs-stack","aggregation":"sum","owner":"time-sre"}', n.dataHash = '22b8ab70c6f7';
MERGE (n:GovernanceNode:INCIDENT {id: 'incidente-checkout'})
SET n.type = 'incident', n.label = 'alta: incidente-checkout', n.data = '{"id":"incidente-checkout","kind":"incident-response","repo":"acme-checkout-api","origin":"alerta do acme-obs-stack às 22:14 — checkout fora do ar (sev alta)","severity":"alta","mttr":"43min","postmortem":"blameless","follow-ups":[{"ref":"standalone:fix-checkout-timeout","kind":"fix","reason":"ajustar timeouts que agravaram a mitigação"},{"ref":"proposal:prop-checkout-hardening","kind":"proposal","reason":"avaliar hardening planejado pós-postmortem"}],"placar":"operational-bucket + MTTR"}', n.dataHash = 'abe4e77cfb84';
MERGE (n:GovernanceNode:INTENT {id: 'intent-checkout-1click'})
SET n.type = 'intent', n.label = 'checkout em 1 clique para clientes recorrentes', n.data = '{"id":"intent-checkout-1click","title":"checkout em 1 clique para clientes recorrentes","team":"time-checkout","authorized-by":"obj-revenue","primary-target":"tgt-checkout-conv","thesis":"tese-cross-sell","approach":"validate-first","hypothesis":"reduzir o checkout a 1 clique p/ recorrentes aumenta a conversão em V%","decision-rule":"roda 3 semanas OU 30k exposições; ganha se conversão ↑ V% sem aumento de estorno","signal":"none","contracts-consumed":["acme-events-schema"],"works":[{"id":"flag-1click","repo":"acme-checkout","purpose":"create","desc":"fluxo de 1 clique atrás da flag (só recorrentes)","review":"interno"},{"id":"api-token-pagamento","repo":"acme-checkout-api","purpose":"create","desc":"token de pagamento salvo p/ recorrentes","review":"interno"},{"id":"baseline-1click","repo":"acme-analytics","purpose":"operate","desc":"eventos + baseline do funil (consome o schema existente, sem revisão)","review":"externo: time-data"}],"next":[{"when":"veredito: ganhou","then":"graduation — 1 clique vira padrão p/ recorrentes","gate":"accept-verdict"},{"when":"veredito: perdeu","then":"cleanup — remove a flag e o token opt-in","gate":"accept-verdict"},{"when":"veredito: inconclusivo","then":"refina a hipótese (segmento menor) OU vira descoberta","gate":"accept-verdict"}],"derived":{"observedApproach":"validate-first","observedSignal":"none","observedForm":"experiment-run","collapse":"unit","repoCount":3,"reason":"multi-repo, validate-first ou contrato acorda coordination unit"}}', n.dataHash = 'd197a0f212c0';
MERGE (n:GovernanceNode:WORK {id: 'intent-checkout-1click::api-token-pagamento'})
SET n.type = 'work', n.label = 'api-token-pagamento', n.data = '{"id":"api-token-pagamento","repo":"acme-checkout-api","purpose":"create","desc":"token de pagamento salvo p/ recorrentes","review":"interno","intent":"intent-checkout-1click"}', n.dataHash = '0ae513e2de31';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-checkout-1click::api-token-pagamento::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-checkout-api/api-token-pagamento', n.data = '{"schema":"acme.repo-work/v1","id":"intent-checkout-1click::api-token-pagamento","intent":"intent-checkout-1click","work":"api-token-pagamento","repo":"acme-checkout-api","purpose":"create","desc":"token de pagamento salvo p/ recorrentes","review":"interno","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-checkout-1click.yml","breakdownHash":"5cbe64ba7be7"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-checkout-api\\\\.governance\\\\works\\\\intent-checkout-1click--api-token-pagamento.yml","_repo":"acme-checkout-api"}', n.dataHash = '670d1dab3989';
MERGE (n:GovernanceNode:WORK {id: 'intent-checkout-1click::baseline-1click'})
SET n.type = 'work', n.label = 'baseline-1click', n.data = '{"id":"baseline-1click","repo":"acme-analytics","purpose":"operate","desc":"eventos + baseline do funil (consome o schema existente, sem revisão)","review":"externo: time-data","intent":"intent-checkout-1click"}', n.dataHash = '70e9edbca651';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-checkout-1click::baseline-1click::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-analytics/baseline-1click', n.data = '{"schema":"acme.repo-work/v1","id":"intent-checkout-1click::baseline-1click","intent":"intent-checkout-1click","work":"baseline-1click","repo":"acme-analytics","purpose":"operate","desc":"eventos + baseline do funil (consome o schema existente, sem revisão)","review":"externo: time-data","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-checkout-1click.yml","breakdownHash":"23e80c3be044"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-analytics\\\\.governance\\\\works\\\\intent-checkout-1click--baseline-1click.yml","_repo":"acme-analytics"}', n.dataHash = '6729b086ac98';
MERGE (n:GovernanceNode:WORK {id: 'intent-checkout-1click::flag-1click'})
SET n.type = 'work', n.label = 'flag-1click', n.data = '{"id":"flag-1click","repo":"acme-checkout","purpose":"create","desc":"fluxo de 1 clique atrás da flag (só recorrentes)","review":"interno","intent":"intent-checkout-1click"}', n.dataHash = 'b0fe2fe12fa3';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-checkout-1click::flag-1click::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-checkout/flag-1click', n.data = '{"schema":"acme.repo-work/v1","id":"intent-checkout-1click::flag-1click","intent":"intent-checkout-1click","work":"flag-1click","repo":"acme-checkout","purpose":"create","desc":"fluxo de 1 clique atrás da flag (só recorrentes)","review":"interno","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-checkout-1click.yml","breakdownHash":"3652af529491"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-checkout\\\\.governance\\\\works\\\\intent-checkout-1click--flag-1click.yml","_repo":"acme-checkout"}', n.dataHash = 'fe93331a05aa';
MERGE (n:GovernanceNode:INTENT {id: 'intent-checkout-stack'})
SET n.type = 'intent', n.label = 'migrar o checkout para o stack novo', n.data = '{"id":"intent-checkout-stack","title":"migrar o checkout para o stack novo","team":"time-checkout","authorized-by":"obj-efficiency","primary-target":"tgt-checkout-stack","thesis":"tese-eficiencia","approach":"direct","signal":"touches-contract","contracts-changed":["acme-user-context"],"works":[{"id":"spike-carrinho","repo":"acme-checkout","purpose":"discover","desc":"EXPLORATION — como migrar o estado do carrinho sem downtime? fate informa a onda 1","timebox":"5d","review":"interno"},{"id":"componentes-ds","repo":"acme-design-system","purpose":"create","desc":"componentes do checkout no stack novo (consome acme-design-tokens sem revisão)","review":"externo: area-platform"},{"id":"porta-fluxo","repo":"acme-checkout","purpose":"sustain","desc":"porta o fluxo principal (de → para) usando os componentes novos","blocked-by":["spike-carrinho"],"delivery-after":["componentes-ds"],"review":"interno"},{"id":"adapta-api","repo":"acme-checkout-api","purpose":"sustain","desc":"adapta os endpoints ao stack novo","review":"interno"},{"id":"estrangula-pedidos","repo":"acme-core-api","module":"mod-orders","purpose":"sustain","desc":"estrangula o fluxo de pedidos do MONOLITO (strangler) — módulo do próprio time","blocked-by":["spike-carrinho"],"review":"interno"},{"id":"revisao-contrato","repo":"acme-web-host","purpose":"sustain","desc":"acme-user-context v3 → v4 COM QUEBRA — abre a janela; mutação compat-window-change (dangerous → alerta q/r/d)","review":"externo: area-platform"},{"id":"monitor-canary","repo":"acme-obs-stack","purpose":"operate","desc":"monitor do canary (guardrails do corte)","delivery-after":["porta-fluxo","adapta-api"],"review":"externo: time-sre"}],"next":[{"when":"onda 1 concluída","then":"janela ABERTA: v3 e v4 convivem; consumidores migram no seu ritmo"},{"when":"consumidores migrados","then":"corte gradual — canary com plano de reversão","gate":"release-rollout"},{"when":"corte completo","then":"fecha a janela, desliga o legado; outcome sobe no placar do custo de servir"}],"derived":{"observedApproach":"direct","observedSignal":"touches-contract","observedForm":"migration-wave","collapse":"unit","repoCount":6,"reason":"multi-repo, validate-first ou contrato acorda coordination unit"}}', n.dataHash = '265dd44133fa';
MERGE (n:GovernanceNode:WORK {id: 'intent-checkout-stack::adapta-api'})
SET n.type = 'work', n.label = 'adapta-api', n.data = '{"id":"adapta-api","repo":"acme-checkout-api","purpose":"sustain","desc":"adapta os endpoints ao stack novo","review":"interno","intent":"intent-checkout-stack"}', n.dataHash = '36fe62533667';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-checkout-stack::adapta-api::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-checkout-api/adapta-api', n.data = '{"schema":"acme.repo-work/v1","id":"intent-checkout-stack::adapta-api","intent":"intent-checkout-stack","work":"adapta-api","repo":"acme-checkout-api","purpose":"sustain","desc":"adapta os endpoints ao stack novo","review":"interno","status":"done","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-checkout-stack.yml","breakdownHash":"5b3fa2012212"},"code":{"touchpoints":["src/index.mjs"]},"owner":"lead-checkout","started-at":"2027-08-10","base-revision":"acme-checkout-api@7123dbe17220","completed-at":"2027-09-04","source-commit":"git:checkout-api-stack-001","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs","result":"passed","files":["src/index.mjs"]},"verification":{"checked-by":"lead-checkout","result":"endpoints de checkout adaptados para o novo stack"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-checkout-api\\\\.governance\\\\works\\\\intent-checkout-stack--adapta-api.yml","_repo":"acme-checkout-api"}', n.dataHash = '7dcee26471ba';
MERGE (n:GovernanceNode:WORK {id: 'intent-checkout-stack::componentes-ds'})
SET n.type = 'work', n.label = 'componentes-ds', n.data = '{"id":"componentes-ds","repo":"acme-design-system","purpose":"create","desc":"componentes do checkout no stack novo (consome acme-design-tokens sem revisão)","review":"externo: area-platform","intent":"intent-checkout-stack"}', n.dataHash = 'd89162b8015c';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-checkout-stack::componentes-ds::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-design-system/componentes-ds', n.data = '{"schema":"acme.repo-work/v1","id":"intent-checkout-stack::componentes-ds","intent":"intent-checkout-stack","work":"componentes-ds","repo":"acme-design-system","purpose":"create","desc":"componentes do checkout no stack novo (consome acme-design-tokens sem revisão)","review":"externo: area-platform","status":"done","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-checkout-stack.yml","breakdownHash":"987a9b0c2de6"},"code":{"touchpoints":["src/index.mjs"]},"owner":"head-platform","started-at":"2027-08-03","base-revision":"acme-design-system@6e7215cc880a","completed-at":"2027-08-18","source-commit":"git:design-system-checkout-components-001","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs","result":"passed","files":["src/index.mjs"]},"verification":{"checked-by":"head-platform","result":"componentes do checkout publicados com tokens compatíveis"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-design-system\\\\.governance\\\\works\\\\intent-checkout-stack--componentes-ds.yml","_repo":"acme-design-system"}', n.dataHash = '6f4ee62a4728';
MERGE (n:GovernanceNode:WORK {id: 'intent-checkout-stack::estrangula-pedidos'})
SET n.type = 'work', n.label = 'estrangula-pedidos', n.data = '{"id":"estrangula-pedidos","repo":"acme-core-api","module":"mod-orders","purpose":"sustain","desc":"estrangula o fluxo de pedidos do MONOLITO (strangler) — módulo do próprio time","blocked-by":["spike-carrinho"],"review":"interno","intent":"intent-checkout-stack"}', n.dataHash = '911c8501ce10';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-checkout-stack::estrangula-pedidos::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-core-api/estrangula-pedidos', n.data = '{"schema":"acme.repo-work/v1","id":"intent-checkout-stack::estrangula-pedidos","intent":"intent-checkout-stack","work":"estrangula-pedidos","repo":"acme-core-api","purpose":"sustain","desc":"estrangula o fluxo de pedidos do MONOLITO (strangler) — módulo do próprio time","review":"interno","status":"done","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-checkout-stack.yml","breakdownHash":"221f7d022672"},"code":{"touchpoints":["src/modules/orders.mjs"]},"module":"mod-orders","owner":"lead-checkout","started-at":"2027-08-12","base-revision":"acme-core-api@94535e6569b5","completed-at":"2027-09-12","source-commit":"git:core-api-orders-strangler-001","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs","result":"passed","files":["src/modules/orders.mjs"]},"verification":{"checked-by":"lead-checkout","result":"módulo de pedidos estrangulado para o fluxo novo"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-core-api\\\\.governance\\\\works\\\\intent-checkout-stack--estrangula-pedidos.yml","_repo":"acme-core-api"}', n.dataHash = '8324e70624de';
MERGE (n:GovernanceNode:WORK {id: 'intent-checkout-stack::monitor-canary'})
SET n.type = 'work', n.label = 'monitor-canary', n.data = '{"id":"monitor-canary","repo":"acme-obs-stack","purpose":"operate","desc":"monitor do canary (guardrails do corte)","delivery-after":["porta-fluxo","adapta-api"],"review":"externo: time-sre","intent":"intent-checkout-stack"}', n.dataHash = 'b111c70198fb';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-checkout-stack::monitor-canary::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-obs-stack/monitor-canary', n.data = '{"schema":"acme.repo-work/v1","id":"intent-checkout-stack::monitor-canary","intent":"intent-checkout-stack","work":"monitor-canary","repo":"acme-obs-stack","purpose":"operate","desc":"monitor do canary (guardrails do corte)","review":"externo: time-sre","status":"done","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-checkout-stack.yml","breakdownHash":"de92d0945cc0"},"code":{"touchpoints":["src/index.mjs"]},"owner":"lead-sre","started-at":"2027-09-01","base-revision":"acme-obs-stack@ef01ac401036","completed-at":"2027-09-20","source-commit":"git:obs-stack-checkout-canary-001","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs","result":"passed","files":["src/index.mjs"]},"verification":{"checked-by":"lead-sre","result":"guardrails de canary publicados para rollout do checkout stack"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-obs-stack\\\\.governance\\\\works\\\\intent-checkout-stack--monitor-canary.yml","_repo":"acme-obs-stack"}', n.dataHash = 'cb81ba0de28a';
MERGE (n:GovernanceNode:WORK {id: 'intent-checkout-stack::porta-fluxo'})
SET n.type = 'work', n.label = 'porta-fluxo', n.data = '{"id":"porta-fluxo","repo":"acme-checkout","purpose":"sustain","desc":"porta o fluxo principal (de → para) usando os componentes novos","blocked-by":["spike-carrinho"],"delivery-after":["componentes-ds"],"review":"interno","intent":"intent-checkout-stack"}', n.dataHash = 'b0e43c2a7f52';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-checkout-stack::porta-fluxo::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-checkout/porta-fluxo', n.data = '{"schema":"acme.repo-work/v1","id":"intent-checkout-stack::porta-fluxo","intent":"intent-checkout-stack","work":"porta-fluxo","repo":"acme-checkout","purpose":"sustain","desc":"porta o fluxo principal (de → para) usando os componentes novos","review":"interno","status":"done","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-checkout-stack.yml","breakdownHash":"a81e4bcdf481"},"code":{"touchpoints":["src/index.mjs"]},"owner":"lead-checkout","started-at":"2027-08-18","base-revision":"acme-checkout@15fce85abf5e","completed-at":"2027-09-08","source-commit":"git:checkout-stack-flow-001","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs","result":"passed","files":["src/index.mjs"]},"verification":{"checked-by":"lead-checkout","result":"fluxo principal portado e integrado ao novo stack"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-checkout\\\\.governance\\\\works\\\\intent-checkout-stack--porta-fluxo.yml","_repo":"acme-checkout"}', n.dataHash = 'ab74813ac2ed';
MERGE (n:GovernanceNode:WORK {id: 'intent-checkout-stack::revisao-contrato'})
SET n.type = 'work', n.label = 'revisao-contrato', n.data = '{"id":"revisao-contrato","repo":"acme-web-host","purpose":"sustain","desc":"acme-user-context v3 → v4 COM QUEBRA — abre a janela; mutação compat-window-change (dangerous → alerta q/r/d)","review":"externo: area-platform","intent":"intent-checkout-stack"}', n.dataHash = 'e128b26a08d8';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-checkout-stack::revisao-contrato::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-web-host/revisao-contrato', n.data = '{"schema":"acme.repo-work/v1","id":"intent-checkout-stack::revisao-contrato","intent":"intent-checkout-stack","work":"revisao-contrato","repo":"acme-web-host","purpose":"sustain","desc":"acme-user-context v3 → v4 COM QUEBRA — abre a janela; mutação compat-window-change (dangerous → alerta q/r/d)","review":"externo: area-platform","status":"done","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-checkout-stack.yml","breakdownHash":"b393543f8f0b"},"code":{"touchpoints":["src/index.mjs"]},"owner":"head-platform","started-at":"2027-08-08","base-revision":"acme-web-host@0917694bbc86","completed-at":"2027-09-15","source-commit":"git:web-host-user-context-v4-001","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs","result":"passed","files":["src/index.mjs"]},"verification":{"checked-by":"head-platform","result":"acme-user-context v4 revisado com janela de compatibilidade coordenada"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-web-host\\\\.governance\\\\works\\\\intent-checkout-stack--revisao-contrato.yml","_repo":"acme-web-host"}', n.dataHash = '8b623dc2e7d5';
MERGE (n:GovernanceNode:WORK {id: 'intent-checkout-stack::spike-carrinho'})
SET n.type = 'work', n.label = 'spike-carrinho', n.data = '{"id":"spike-carrinho","repo":"acme-checkout","purpose":"discover","desc":"EXPLORATION — como migrar o estado do carrinho sem downtime? fate informa a onda 1","timebox":"5d","review":"interno","intent":"intent-checkout-stack"}', n.dataHash = 'ee133f62e7c0';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-checkout-stack::spike-carrinho::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-checkout/spike-carrinho', n.data = '{"schema":"acme.repo-work/v1","id":"intent-checkout-stack::spike-carrinho","intent":"intent-checkout-stack","work":"spike-carrinho","repo":"acme-checkout","purpose":"discover","desc":"EXPLORATION — como migrar o estado do carrinho sem downtime? fate informa a onda 1","review":"interno","status":"done","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-checkout-stack.yml","breakdownHash":"5f48ae2a00da"},"code":{"touchpoints":["src/index.mjs"]},"owner":"lead-checkout","started-at":"2027-08-01","base-revision":"acme-checkout@15fce85abf5e","completed-at":"2027-08-05","source-commit":"git:checkout-stack-spike-001","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs","result":"passed","files":["src/index.mjs"]},"verification":{"checked-by":"lead-checkout","result":"estratégia de migração do carrinho validada sem downtime"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-checkout\\\\.governance\\\\works\\\\intent-checkout-stack--spike-carrinho.yml","_repo":"acme-checkout"}', n.dataHash = 'c4c732bae135';
MERGE (n:GovernanceNode:INTENT {id: 'intent-consent-center'})
SET n.type = 'intent', n.label = 'central de consentimento e base legal por dado', n.data = '{"id":"intent-consent-center","title":"central de consentimento e base legal por dado","team":"time-identity","authorized-by":"obj-trust","primary-target":"tgt-identity-consent","thesis":"tese-privacidade","approach":"direct","signal":"touches-contract","contracts-changed":["acme-user-context"],"depends-on":["intent-checkout-stack"],"works":[{"id":"central-consentimento","repo":"acme-identity","purpose":"create","desc":"central de consentimento (ver/dar/revogar) + registro de base legal","review":"interno"},{"id":"contexto-consentimento","repo":"acme-web-host","purpose":"sustain","desc":"acme-user-context ganha campos de consentimento — COORDENAR com a onda do checkout (mesmo contrato, mesma janela)","blocked-by":["central-consentimento"],"review":"externo: area-platform"},{"id":"propagar-base-legal","repo":"acme-data-pipeline","purpose":"sustain","desc":"warehouse propaga a base legal por dado (consent-coverage nasce daqui)","delivery-after":["central-consentimento"],"review":"externo: time-data"}],"next":[{"when":"central no ar","then":"campos entram no contrato — revisão COORDENADA com a v4 do checkout","gate":"release-rollout"},{"when":"cobertura de base legal em 100%","then":"outcome sobe no placar de confiança"},{"when":"conflito de janela com o checkout","then":"decision explícita: uma revisão v4 única OU janelas encadeadas"}],"derived":{"observedApproach":"direct","observedSignal":"touches-contract","observedForm":"migration-wave","collapse":"unit","repoCount":3,"reason":"multi-repo, validate-first ou contrato acorda coordination unit"}}', n.dataHash = 'd5a91bdb3aba';
MERGE (n:GovernanceNode:WORK {id: 'intent-consent-center::central-consentimento'})
SET n.type = 'work', n.label = 'central-consentimento', n.data = '{"id":"central-consentimento","repo":"acme-identity","purpose":"create","desc":"central de consentimento (ver/dar/revogar) + registro de base legal","review":"interno","intent":"intent-consent-center"}', n.dataHash = '5118d2f54ac5';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-consent-center::central-consentimento::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-identity/central-consentimento', n.data = '{"schema":"acme.repo-work/v1","id":"intent-consent-center::central-consentimento","intent":"intent-consent-center","work":"central-consentimento","repo":"acme-identity","purpose":"create","desc":"central de consentimento (ver/dar/revogar) + registro de base legal","review":"interno","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-consent-center.yml","breakdownHash":"94815db34003"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-identity\\\\.governance\\\\works\\\\intent-consent-center--central-consentimento.yml","_repo":"acme-identity"}', n.dataHash = '3ea814be3c04';
MERGE (n:GovernanceNode:WORK {id: 'intent-consent-center::contexto-consentimento'})
SET n.type = 'work', n.label = 'contexto-consentimento', n.data = '{"id":"contexto-consentimento","repo":"acme-web-host","purpose":"sustain","desc":"acme-user-context ganha campos de consentimento — COORDENAR com a onda do checkout (mesmo contrato, mesma janela)","blocked-by":["central-consentimento"],"review":"externo: area-platform","intent":"intent-consent-center"}', n.dataHash = '226877d884a8';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-consent-center::contexto-consentimento::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-web-host/contexto-consentimento', n.data = '{"schema":"acme.repo-work/v1","id":"intent-consent-center::contexto-consentimento","intent":"intent-consent-center","work":"contexto-consentimento","repo":"acme-web-host","purpose":"sustain","desc":"acme-user-context ganha campos de consentimento — COORDENAR com a onda do checkout (mesmo contrato, mesma janela)","review":"externo: area-platform","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-consent-center.yml","breakdownHash":"57a8e6be79cb"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-web-host\\\\.governance\\\\works\\\\intent-consent-center--contexto-consentimento.yml","_repo":"acme-web-host"}', n.dataHash = '7ba90d620f2a';
MERGE (n:GovernanceNode:WORK {id: 'intent-consent-center::propagar-base-legal'})
SET n.type = 'work', n.label = 'propagar-base-legal', n.data = '{"id":"propagar-base-legal","repo":"acme-data-pipeline","purpose":"sustain","desc":"warehouse propaga a base legal por dado (consent-coverage nasce daqui)","delivery-after":["central-consentimento"],"review":"externo: time-data","intent":"intent-consent-center"}', n.dataHash = '6f875e131cf7';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-consent-center::propagar-base-legal::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-data-pipeline/propagar-base-legal', n.data = '{"schema":"acme.repo-work/v1","id":"intent-consent-center::propagar-base-legal","intent":"intent-consent-center","work":"propagar-base-legal","repo":"acme-data-pipeline","purpose":"sustain","desc":"warehouse propaga a base legal por dado (consent-coverage nasce daqui)","review":"externo: time-data","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-consent-center.yml","breakdownHash":"b99fc5d63501"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-data-pipeline\\\\.governance\\\\works\\\\intent-consent-center--propagar-base-legal.yml","_repo":"acme-data-pipeline"}', n.dataHash = 'b47d3503ff34';
MERGE (n:GovernanceNode:INTENT {id: 'intent-cta-upgrade'})
SET n.type = 'intent', n.label = 'CTA contextual de upgrade no billing', n.data = '{"id":"intent-cta-upgrade","title":"CTA contextual de upgrade no billing","team":"time-billing","authorized-by":"obj-revenue","primary-target":"tgt-billing-conv","thesis":"tese-cross-sell","approach":"validate-first","hypothesis":"um CTA contextual no billing aumenta a conversão de cross-sell em X%","decision-rule":"roda 4 semanas OU 50k exposições; ganha se conversão ↑ X% sem churn ↑","signal":"none","contracts-consumed":["acme-events-schema"],"works":[{"id":"spike-elegibilidade","repo":"acme-api-billing","purpose":"discover","desc":"EXPLORATION — dá p/ reusar o motor de elegibilidade que já existe? pergunta falsificável + fate","timebox":"3d","review":"interno"},{"id":"api-elegibilidade","repo":"acme-api-billing","purpose":"create","desc":"elegibilidade + endpoint (o fate do spike decide: reusar × construir)","blocked-by":["spike-elegibilidade"],"review":"interno"},{"id":"ui-cta","repo":"acme-mfe-billing","purpose":"create","desc":"UI do CTA atrás da flag — constrói em paralelo com mock; a integração espera o endpoint","delivery-after":["api-elegibilidade"],"review":"interno"},{"id":"contas-legadas","repo":"acme-core-api","module":"mod-accounts","purpose":"sustain","desc":"expõe leitura de contas legadas p/ a elegibilidade — MONOLITO: o dono é o do MÓDULO","review":"externo: time-identity"},{"id":"baseline-eventos","repo":"acme-analytics","purpose":"operate","desc":"instrumenta com o schema EXISTENTE (consome sem revisão); pronto ANTES de ligar a flag","review":"externo: time-data"}],"next":[{"when":"veredito: ganhou","then":"graduation — efetiva a variante; outcome soma no placar","gate":"accept-verdict"},{"when":"veredito: perdeu","then":"cleanup — remove flag/variante; aprendizado registrado","gate":"accept-verdict"},{"when":"veredito: inconclusivo","then":"novo experimento refinado OU vira descoberta","gate":"accept-verdict"}],"derived":{"observedApproach":"validate-first","observedSignal":"none","observedForm":"experiment-run","collapse":"unit","repoCount":4,"reason":"multi-repo, validate-first ou contrato acorda coordination unit"}}', n.dataHash = '21148e44871c';
MERGE (n:GovernanceNode:WORK {id: 'intent-cta-upgrade::api-elegibilidade'})
SET n.type = 'work', n.label = 'api-elegibilidade', n.data = '{"id":"api-elegibilidade","repo":"acme-api-billing","purpose":"create","desc":"elegibilidade + endpoint (o fate do spike decide: reusar × construir)","blocked-by":["spike-elegibilidade"],"review":"interno","intent":"intent-cta-upgrade"}', n.dataHash = '5bc6d7dd7398';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-cta-upgrade::api-elegibilidade::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-api-billing/api-elegibilidade', n.data = '{"schema":"acme.repo-work/v1","id":"intent-cta-upgrade::api-elegibilidade","intent":"intent-cta-upgrade","work":"api-elegibilidade","repo":"acme-api-billing","purpose":"create","desc":"elegibilidade + endpoint (o fate do spike decide: reusar × construir)","review":"interno","status":"done","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-cta-upgrade.yml","breakdownHash":"6a62facbd48d"},"code":{"touchpoints":["src/index.mjs"]},"owner":"lead-billing","started-at":"2027-01-06","base-revision":"acme-api-billing@ctx-v1","completed-at":"2027-01-12","source-commit":"git:api-billing-eligibility-001","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs","result":"passed","files":["src/index.mjs"]},"verification":{"checked-by":"lead-billing","result":"endpoint de elegibilidade coberto pela fixture de billing"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-api-billing\\\\.governance\\\\works\\\\intent-cta-upgrade--api-elegibilidade.yml","_repo":"acme-api-billing"}', n.dataHash = 'b34bc6a94f8e';
MERGE (n:GovernanceNode:WORK {id: 'intent-cta-upgrade::baseline-eventos'})
SET n.type = 'work', n.label = 'baseline-eventos', n.data = '{"id":"baseline-eventos","repo":"acme-analytics","purpose":"operate","desc":"instrumenta com o schema EXISTENTE (consome sem revisão); pronto ANTES de ligar a flag","review":"externo: time-data","intent":"intent-cta-upgrade"}', n.dataHash = 'fe4c63dc89d6';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-cta-upgrade::baseline-eventos::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-analytics/baseline-eventos', n.data = '{"schema":"acme.repo-work/v1","id":"intent-cta-upgrade::baseline-eventos","intent":"intent-cta-upgrade","work":"baseline-eventos","repo":"acme-analytics","purpose":"operate","desc":"instrumenta com o schema EXISTENTE (consome sem revisão); pronto ANTES de ligar a flag","review":"externo: time-data","status":"done","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-cta-upgrade.yml","breakdownHash":"5c870e399a68"},"code":{"touchpoints":["src/index.mjs"]},"owner":"lead-data","started-at":"2027-01-03","base-revision":"acme-analytics@ctx-v1","completed-at":"2027-01-10","source-commit":"git:analytics-baseline-cta-001","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs","result":"passed","files":["src/index.mjs"]},"verification":{"checked-by":"lead-data","result":"baseline e eventos de exposicao/conversao prontos antes da flag"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-analytics\\\\.governance\\\\works\\\\intent-cta-upgrade--baseline-eventos.yml","_repo":"acme-analytics"}', n.dataHash = 'd6463a9612c2';
MERGE (n:GovernanceNode:WORK {id: 'intent-cta-upgrade::contas-legadas'})
SET n.type = 'work', n.label = 'contas-legadas', n.data = '{"id":"contas-legadas","repo":"acme-core-api","module":"mod-accounts","purpose":"sustain","desc":"expõe leitura de contas legadas p/ a elegibilidade — MONOLITO: o dono é o do MÓDULO","review":"externo: time-identity","intent":"intent-cta-upgrade"}', n.dataHash = 'd5fea09131fb';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-cta-upgrade::contas-legadas::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-core-api/contas-legadas', n.data = '{"schema":"acme.repo-work/v1","id":"intent-cta-upgrade::contas-legadas","intent":"intent-cta-upgrade","work":"contas-legadas","repo":"acme-core-api","purpose":"sustain","desc":"expõe leitura de contas legadas p/ a elegibilidade — MONOLITO: o dono é o do MÓDULO","review":"externo: time-identity","status":"done","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-cta-upgrade.yml","breakdownHash":"56cab9e860e6"},"code":{"touchpoints":["src/modules/accounts.mjs"]},"module":"mod-accounts","owner":"lead-identity","started-at":"2027-01-05","base-revision":"acme-core-api@ctx-v1","completed-at":"2027-01-11","source-commit":"git:core-api-accounts-seam-001","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs","result":"passed","files":["src/modules/accounts.mjs"]},"verification":{"checked-by":"lead-identity","result":"seam de contas legado exposto sem mover ownership do modulo"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-core-api\\\\.governance\\\\works\\\\intent-cta-upgrade--contas-legadas.yml","_repo":"acme-core-api"}', n.dataHash = '233db726bb42';
MERGE (n:GovernanceNode:WORK {id: 'intent-cta-upgrade::spike-elegibilidade'})
SET n.type = 'work', n.label = 'spike-elegibilidade', n.data = '{"id":"spike-elegibilidade","repo":"acme-api-billing","purpose":"discover","desc":"EXPLORATION — dá p/ reusar o motor de elegibilidade que já existe? pergunta falsificável + fate","timebox":"3d","review":"interno","intent":"intent-cta-upgrade"}', n.dataHash = '7d4d800e789a';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-cta-upgrade::spike-elegibilidade::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-api-billing/spike-elegibilidade', n.data = '{"schema":"acme.repo-work/v1","id":"intent-cta-upgrade::spike-elegibilidade","intent":"intent-cta-upgrade","work":"spike-elegibilidade","repo":"acme-api-billing","purpose":"discover","desc":"EXPLORATION — dá p/ reusar o motor de elegibilidade que já existe? pergunta falsificável + fate","review":"interno","status":"done","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-cta-upgrade.yml","breakdownHash":"6ca57a180976"},"code":{"touchpoints":["src/index.mjs"]},"owner":"lead-billing","started-at":"2027-01-03","base-revision":"acme-api-billing@ctx-v1","completed-at":"2027-01-06","source-commit":"git:api-billing-spike-001","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs","result":"passed","files":["src/index.mjs"]},"verification":{"checked-by":"lead-billing","result":"elegibilidade existente reaproveitada para o endpoint"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-api-billing\\\\.governance\\\\works\\\\intent-cta-upgrade--spike-elegibilidade.yml","_repo":"acme-api-billing"}', n.dataHash = '288d12d14a38';
MERGE (n:GovernanceNode:WORK {id: 'intent-cta-upgrade::ui-cta'})
SET n.type = 'work', n.label = 'ui-cta', n.data = '{"id":"ui-cta","repo":"acme-mfe-billing","purpose":"create","desc":"UI do CTA atrás da flag — constrói em paralelo com mock; a integração espera o endpoint","delivery-after":["api-elegibilidade"],"review":"interno","intent":"intent-cta-upgrade"}', n.dataHash = '5a6de00dfee7';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-cta-upgrade::ui-cta::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-mfe-billing/ui-cta', n.data = '{"schema":"acme.repo-work/v1","id":"intent-cta-upgrade::ui-cta","intent":"intent-cta-upgrade","work":"ui-cta","repo":"acme-mfe-billing","purpose":"create","desc":"UI do CTA atrás da flag — constrói em paralelo com mock; a integração espera o endpoint","review":"interno","status":"done","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-cta-upgrade.yml","breakdownHash":"dfa6744f17e8"},"code":{"touchpoints":["src/index.mjs"]},"owner":"lead-billing","started-at":"2027-01-08","base-revision":"acme-mfe-billing@ctx-v1","completed-at":"2027-01-18","source-commit":"git:mfe-billing-cta-001","evidence":{"kind":"code-fixture","command":"node _tools/check-code-fixtures.mjs","result":"passed","files":["src/index.mjs"]},"verification":{"checked-by":"lead-billing","result":"CTA renderiza atras de flag e integra com quote de billing"},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-mfe-billing\\\\.governance\\\\works\\\\intent-cta-upgrade--ui-cta.yml","_repo":"acme-mfe-billing"}', n.dataHash = '11ea1c0ab57b';
MERGE (n:GovernanceNode:INTENT {id: 'intent-help-selfservice'})
SET n.type = 'intent', n.label = 'autoatendimento: central de ajuda que resolve sem ticket', n.data = '{"id":"intent-help-selfservice","title":"autoatendimento: central de ajuda que resolve sem ticket","team":"time-support","authorized-by":"obj-efficiency","primary-target":"tgt-support-cost","thesis":"tese-self-service","approach":"direct","signal":"none","contracts-consumed":["acme-events-schema"],"works":[{"id":"base-conhecimento","repo":"acme-help-center","purpose":"create","desc":"base de conhecimento estruturada + busca","review":"interno"},{"id":"chatbot-deflexao","repo":"acme-help-center","purpose":"create","desc":"chatbot de deflexão (responde antes de abrir ticket)","delivery-after":["base-conhecimento"],"review":"interno"},{"id":"eventos-deflexao","repo":"acme-analytics","purpose":"operate","desc":"mede deflexão × custo por ticket (consome o schema existente)","review":"externo: time-data"}],"next":[{"when":"base no ar","then":"chatbot entra por cima; deflexão medida por coorte"},{"when":"custo por ticket caiu R%","then":"outcome sobe no placar de eficiência"},{"when":"satisfação caiu junto","then":"escala: vira experimento (validate-first) de formato"}],"derived":{"observedApproach":"direct","observedSignal":"none","observedForm":"delivery-slice","collapse":"unit","repoCount":2,"reason":"multi-repo, validate-first ou contrato acorda coordination unit"}}', n.dataHash = 'bce54edbace6';
MERGE (n:GovernanceNode:WORK {id: 'intent-help-selfservice::base-conhecimento'})
SET n.type = 'work', n.label = 'base-conhecimento', n.data = '{"id":"base-conhecimento","repo":"acme-help-center","purpose":"create","desc":"base de conhecimento estruturada + busca","review":"interno","intent":"intent-help-selfservice"}', n.dataHash = 'ef330c735f87';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-help-selfservice::base-conhecimento::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-help-center/base-conhecimento', n.data = '{"schema":"acme.repo-work/v1","id":"intent-help-selfservice::base-conhecimento","intent":"intent-help-selfservice","work":"base-conhecimento","repo":"acme-help-center","purpose":"create","desc":"base de conhecimento estruturada + busca","review":"interno","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-help-selfservice.yml","breakdownHash":"5c5f10e7d9bc"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-help-center\\\\.governance\\\\works\\\\intent-help-selfservice--base-conhecimento.yml","_repo":"acme-help-center"}', n.dataHash = 'aece9ff5fcc6';
MERGE (n:GovernanceNode:WORK {id: 'intent-help-selfservice::chatbot-deflexao'})
SET n.type = 'work', n.label = 'chatbot-deflexao', n.data = '{"id":"chatbot-deflexao","repo":"acme-help-center","purpose":"create","desc":"chatbot de deflexão (responde antes de abrir ticket)","delivery-after":["base-conhecimento"],"review":"interno","intent":"intent-help-selfservice"}', n.dataHash = 'ec38d3b1bef2';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-help-selfservice::chatbot-deflexao::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-help-center/chatbot-deflexao', n.data = '{"schema":"acme.repo-work/v1","id":"intent-help-selfservice::chatbot-deflexao","intent":"intent-help-selfservice","work":"chatbot-deflexao","repo":"acme-help-center","purpose":"create","desc":"chatbot de deflexão (responde antes de abrir ticket)","review":"interno","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-help-selfservice.yml","breakdownHash":"aaf0a8c5a8a1"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-help-center\\\\.governance\\\\works\\\\intent-help-selfservice--chatbot-deflexao.yml","_repo":"acme-help-center"}', n.dataHash = 'd3b0b8380370';
MERGE (n:GovernanceNode:WORK {id: 'intent-help-selfservice::eventos-deflexao'})
SET n.type = 'work', n.label = 'eventos-deflexao', n.data = '{"id":"eventos-deflexao","repo":"acme-analytics","purpose":"operate","desc":"mede deflexão × custo por ticket (consome o schema existente)","review":"externo: time-data","intent":"intent-help-selfservice"}', n.dataHash = 'b82479adffad';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-help-selfservice::eventos-deflexao::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-analytics/eventos-deflexao', n.data = '{"schema":"acme.repo-work/v1","id":"intent-help-selfservice::eventos-deflexao","intent":"intent-help-selfservice","work":"eventos-deflexao","repo":"acme-analytics","purpose":"operate","desc":"mede deflexão × custo por ticket (consome o schema existente)","review":"externo: time-data","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-help-selfservice.yml","breakdownHash":"d44a9abfd9b9"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-analytics\\\\.governance\\\\works\\\\intent-help-selfservice--eventos-deflexao.yml","_repo":"acme-analytics"}', n.dataHash = '104bccbc51c6';
MERGE (n:GovernanceNode:INTENT {id: 'intent-onboarding-checklist'})
SET n.type = 'intent', n.label = 'checklist guiado de ativação na primeira semana', n.data = '{"id":"intent-onboarding-checklist","title":"checklist guiado de ativação na primeira semana","team":"time-onboarding","authorized-by":"obj-retention","primary-target":"tgt-onboarding-churn","thesis":"tese-onboarding-retencao","approach":"validate-first","hypothesis":"um checklist guiado na 1ª semana aumenta a ativação e derruba o churn em P p.p.","decision-rule":"roda 6 semanas; ganha se churn dos expostos cair P p.p. sem queda de NPS","signal":"none","contracts-consumed":["acme-events-schema"],"works":[{"id":"flag-checklist","repo":"acme-mfe-onboarding","purpose":"create","desc":"checklist guiado atrás da flag (coorte da 1ª semana)","review":"interno"},{"id":"baseline-ativacao","repo":"acme-analytics","purpose":"operate","desc":"coortes de ativação × churn (consome o schema existente); pronto antes da flag","review":"externo: time-data"}],"next":[{"when":"veredito: ganhou","then":"graduation — checklist vira padrão do onboarding","gate":"accept-verdict"},{"when":"veredito: perdeu","then":"cleanup — remove flag; aprendizado registrado","gate":"accept-verdict"},{"when":"veredito: inconclusivo","then":"refina coorte OU vira descoberta","gate":"accept-verdict"}],"derived":{"observedApproach":"validate-first","observedSignal":"none","observedForm":"experiment-run","collapse":"unit","repoCount":2,"reason":"multi-repo, validate-first ou contrato acorda coordination unit"}}', n.dataHash = 'bf45f97b6a0e';
MERGE (n:GovernanceNode:WORK {id: 'intent-onboarding-checklist::baseline-ativacao'})
SET n.type = 'work', n.label = 'baseline-ativacao', n.data = '{"id":"baseline-ativacao","repo":"acme-analytics","purpose":"operate","desc":"coortes de ativação × churn (consome o schema existente); pronto antes da flag","review":"externo: time-data","intent":"intent-onboarding-checklist"}', n.dataHash = '7d68bcf9026d';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-onboarding-checklist::baseline-ativacao::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-analytics/baseline-ativacao', n.data = '{"schema":"acme.repo-work/v1","id":"intent-onboarding-checklist::baseline-ativacao","intent":"intent-onboarding-checklist","work":"baseline-ativacao","repo":"acme-analytics","purpose":"operate","desc":"coortes de ativação × churn (consome o schema existente); pronto antes da flag","review":"externo: time-data","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-onboarding-checklist.yml","breakdownHash":"9c770512563e"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-analytics\\\\.governance\\\\works\\\\intent-onboarding-checklist--baseline-ativacao.yml","_repo":"acme-analytics"}', n.dataHash = '2cf829fdbe5e';
MERGE (n:GovernanceNode:WORK {id: 'intent-onboarding-checklist::flag-checklist'})
SET n.type = 'work', n.label = 'flag-checklist', n.data = '{"id":"flag-checklist","repo":"acme-mfe-onboarding","purpose":"create","desc":"checklist guiado atrás da flag (coorte da 1ª semana)","review":"interno","intent":"intent-onboarding-checklist"}', n.dataHash = '185f263d5907';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-onboarding-checklist::flag-checklist::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-mfe-onboarding/flag-checklist', n.data = '{"schema":"acme.repo-work/v1","id":"intent-onboarding-checklist::flag-checklist","intent":"intent-onboarding-checklist","work":"flag-checklist","repo":"acme-mfe-onboarding","purpose":"create","desc":"checklist guiado atrás da flag (coorte da 1ª semana)","review":"interno","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-onboarding-checklist.yml","breakdownHash":"f15ba6a81fc6"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-mfe-onboarding\\\\.governance\\\\works\\\\intent-onboarding-checklist--flag-checklist.yml","_repo":"acme-mfe-onboarding"}', n.dataHash = '8f1c51fdb25d';
MERGE (n:GovernanceNode:INTENT {id: 'intent-p99-hardening'})
SET n.type = 'intent', n.label = 'derrubar o p99 da plataforma (timeouts, retries, cache)', n.data = '{"id":"intent-p99-hardening","title":"derrubar o p99 da plataforma (timeouts, retries, cache)","team":"time-sre","authorized-by":"obj-efficiency","primary-target":"tgt-sre-p99","approach":"direct","signal":"operational-target","works":[{"id":"guardrails-p99","repo":"acme-obs-stack","purpose":"operate","desc":"guardrails de p99 + alertas — MEDIR ANTES de mexer (baseline); a fonte que ATESTA os outcomes","review":"interno"},{"id":"timeouts-api","repo":"acme-checkout-api","purpose":"sustain","desc":"timeouts + retries (preventivo) — codifica em paralelo; NÃO LIGA antes do baseline","delivery-after":["guardrails-p99"],"review":"externo: time-checkout"},{"id":"cache-contexto","repo":"acme-web-host","purpose":"sustain","desc":"cache do contexto de usuário (sem mudar o contrato — só a implementação)","delivery-after":["guardrails-p99"],"review":"externo: area-platform"}],"next":[{"when":"peças concluídas","then":"outcomes sobem no placar OPERACIONAL — attester independente (obs-stack)"},{"when":"p99 cedeu","then":"guardrails viram monitoramento permanente; a intent fecha"},{"when":"p99 NÃO cedeu","then":"escala: vira descoberta (investigar causa) OU experimento de performance (validate-first)"}],"derived":{"observedApproach":"direct","observedSignal":"operational-target","observedForm":"operational-sustain","collapse":"collapsed","repoCount":3,"reason":"scaling-law colapsa em repo-work/standalone"}}', n.dataHash = '652dbe251272';
MERGE (n:GovernanceNode:WORK {id: 'intent-p99-hardening::cache-contexto'})
SET n.type = 'work', n.label = 'cache-contexto', n.data = '{"id":"cache-contexto","repo":"acme-web-host","purpose":"sustain","desc":"cache do contexto de usuário (sem mudar o contrato — só a implementação)","delivery-after":["guardrails-p99"],"review":"externo: area-platform","intent":"intent-p99-hardening"}', n.dataHash = '398326d1005e';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-p99-hardening::cache-contexto::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-web-host/cache-contexto', n.data = '{"schema":"acme.repo-work/v1","id":"intent-p99-hardening::cache-contexto","intent":"intent-p99-hardening","work":"cache-contexto","repo":"acme-web-host","purpose":"sustain","desc":"cache do contexto de usuário (sem mudar o contrato — só a implementação)","review":"externo: area-platform","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-p99-hardening.yml","breakdownHash":"0f70c6be27fd"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-web-host\\\\.governance\\\\works\\\\intent-p99-hardening--cache-contexto.yml","_repo":"acme-web-host"}', n.dataHash = '22dda534b3b2';
MERGE (n:GovernanceNode:WORK {id: 'intent-p99-hardening::guardrails-p99'})
SET n.type = 'work', n.label = 'guardrails-p99', n.data = '{"id":"guardrails-p99","repo":"acme-obs-stack","purpose":"operate","desc":"guardrails de p99 + alertas — MEDIR ANTES de mexer (baseline); a fonte que ATESTA os outcomes","review":"interno","intent":"intent-p99-hardening"}', n.dataHash = '377da9dc6d48';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-p99-hardening::guardrails-p99::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-obs-stack/guardrails-p99', n.data = '{"schema":"acme.repo-work/v1","id":"intent-p99-hardening::guardrails-p99","intent":"intent-p99-hardening","work":"guardrails-p99","repo":"acme-obs-stack","purpose":"operate","desc":"guardrails de p99 + alertas — MEDIR ANTES de mexer (baseline); a fonte que ATESTA os outcomes","review":"interno","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-p99-hardening.yml","breakdownHash":"ef3a17e773a8"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-obs-stack\\\\.governance\\\\works\\\\intent-p99-hardening--guardrails-p99.yml","_repo":"acme-obs-stack"}', n.dataHash = '3936287238f4';
MERGE (n:GovernanceNode:WORK {id: 'intent-p99-hardening::timeouts-api'})
SET n.type = 'work', n.label = 'timeouts-api', n.data = '{"id":"timeouts-api","repo":"acme-checkout-api","purpose":"sustain","desc":"timeouts + retries (preventivo) — codifica em paralelo; NÃO LIGA antes do baseline","delivery-after":["guardrails-p99"],"review":"externo: time-checkout","intent":"intent-p99-hardening"}', n.dataHash = '0cb64a172d8b';
MERGE (n:GovernanceNode:REPO_WORK_ACK {id: 'intent-p99-hardening::timeouts-api::repo-ack'})
SET n.type = 'repo-work-ack', n.label = 'acme-checkout-api/timeouts-api', n.data = '{"schema":"acme.repo-work/v1","id":"intent-p99-hardening::timeouts-api","intent":"intent-p99-hardening","work":"timeouts-api","repo":"acme-checkout-api","purpose":"sustain","desc":"timeouts + retries (preventivo) — codifica em paralelo; NÃO LIGA antes do baseline","review":"externo: time-checkout","status":"acknowledged","source":{"kind":"central-breakdown","file":"acme-governance/intents/intent-p99-hardening.yml","breakdownHash":"af8bd5f8d7e5"},"code":{"touchpoints":["src/index.mjs"]},"_file":"C:\\\\Users\\\\Rosana\\\\dev\\\\ai-guidelines\\\\.governance\\\\specs\\\\0024-context-architecture\\\\work-graph-model\\\\_org-simulation-v3\\\\repos\\\\acme-checkout-api\\\\.governance\\\\works\\\\intent-p99-hardening--timeouts-api.yml","_repo":"acme-checkout-api"}', n.dataHash = 'c51b1ee10a0c';
MERGE (n:GovernanceNode:AUTHORITY {id: 'lead-billing'})
SET n.type = 'authority', n.label = 'lead-billing', n.data = '{"id":"lead-billing","kind":"role","of":"time-billing"}', n.dataHash = '76628f9041b5';
MERGE (n:GovernanceNode:AUTHORITY {id: 'lead-checkout'})
SET n.type = 'authority', n.label = 'lead-checkout', n.data = '{"id":"lead-checkout","kind":"role","of":"time-checkout"}', n.dataHash = '2e2bd6534b98';
MERGE (n:GovernanceNode:AUTHORITY {id: 'lead-data'})
SET n.type = 'authority', n.label = 'lead-data', n.data = '{"id":"lead-data","kind":"role","of":"time-data"}', n.dataHash = '7e1afe922ae4';
MERGE (n:GovernanceNode:AUTHORITY {id: 'lead-identity'})
SET n.type = 'authority', n.label = 'lead-identity', n.data = '{"id":"lead-identity","kind":"role","of":"time-identity"}', n.dataHash = '8e44389360d4';
MERGE (n:GovernanceNode:AUTHORITY {id: 'lead-onboarding'})
SET n.type = 'authority', n.label = 'lead-onboarding', n.data = '{"id":"lead-onboarding","kind":"role","of":"time-onboarding"}', n.dataHash = '882b43e6378c';
MERGE (n:GovernanceNode:AUTHORITY {id: 'lead-sre'})
SET n.type = 'authority', n.label = 'lead-sre', n.data = '{"id":"lead-sre","kind":"role","of":"time-sre"}', n.dataHash = '22d1b54d7110';
MERGE (n:GovernanceNode:AUTHORITY {id: 'lead-support'})
SET n.type = 'authority', n.label = 'lead-support', n.data = '{"id":"lead-support","kind":"role","of":"time-support"}', n.dataHash = 'db98d927d76c';
MERGE (n:GovernanceNode:OBJECTIVE {id: 'obj-efficiency'})
SET n.type = 'objective', n.label = 'reduzir o custo de servir', n.data = '{"id":"obj-efficiency","level":"company","title":"reduzir o custo de servir","period":"2027","owner":"sponsor-acme","status":"active"}', n.dataHash = '2b02517c5833';
MERGE (n:GovernanceNode:OBJECTIVE {id: 'obj-retention'})
SET n.type = 'objective', n.label = 'reter clientes (derrubar o churn)', n.data = '{"id":"obj-retention","level":"company","title":"reter clientes (derrubar o churn)","period":"2027","owner":"sponsor-acme","status":"active"}', n.dataHash = '3a3b14909f4d';
MERGE (n:GovernanceNode:OBJECTIVE {id: 'obj-revenue'})
SET n.type = 'objective', n.label = 'crescer receita via cross-sell', n.data = '{"id":"obj-revenue","level":"company","title":"crescer receita via cross-sell","period":"2027","owner":"sponsor-acme","status":"active"}', n.dataHash = '55a3e5b8efd7';
MERGE (n:GovernanceNode:OBJECTIVE {id: 'obj-trust'})
SET n.type = 'objective', n.label = 'confiança: privacidade e conformidade por padrão', n.data = '{"id":"obj-trust","level":"company","title":"confiança: privacidade e conformidade por padrão","period":"2027","owner":"sponsor-acme","status":"active"}', n.dataHash = '4849d645e332';
MERGE (n:GovernanceNode:ORIGIN {id: 'origin:bug-frete'})
SET n.type = 'origin', n.label = 'suporte reporta: cupom duplo zera o frete', n.data = '{"text":"suporte reporta: cupom duplo zera o frete","target":"bug-frete"}', n.dataHash = '381ce5f55fcd';
MERGE (n:GovernanceNode:ORIGIN {id: 'origin:dep-bump-host'})
SET n.type = 'origin', n.label = 'rotina: lib X 3.x → 4.x', n.data = '{"text":"rotina: lib X 3.x → 4.x","target":"dep-bump-host"}', n.dataHash = '55c3db4e788c';
MERGE (n:GovernanceNode:OUTCOME {id: 'out-checkout-stack-2027h2'})
SET n.type = 'outcome', n.label = 'cost-to-serve: -11.8 R$/pedido', n.data = '{"id":"out-checkout-stack-2027h2","emitted-by":"intent-checkout-stack","source":"acme-data-pipeline/cost-to-serve@warehouse-rev77","window":{"start":"2027-07-01","end":"2027-12-31"},"metric":"cost-to-serve","value":"-11.8 R$/pedido","aggregation":"avg","attested-by":"acme-data-pipeline","revision":"warehouse@rev77","contract-revisions":["acme-user-context@v4"],"contributes-to":"tgt-checkout-stack","envelope":{"actor":"tool:r4-second-outcome","authority":"head-platform","issued-at":"2027-10-20","idempotency-key":"out-checkout-stack-2027h2","nonce":"nonce-out-checkout-stack-2027h2"}}', n.dataHash = '7b1b6d5c6b31';
MERGE (n:GovernanceNode:OUTCOME {id: 'out-cta-upgrade-2027q1'})
SET n.type = 'outcome', n.label = 'conversion-rate: +2.4 %', n.data = '{"id":"out-cta-upgrade-2027q1","emitted-by":"intent-cta-upgrade","source":"acme-analytics/conversion-rate@warehouse-rev42","window":{"start":"2027-01-01","end":"2027-03-31"},"metric":"conversion-rate","value":"+2.4 %","aggregation":"avg","attested-by":"acme-analytics","revision":"warehouse@rev42","contract-revisions":[],"contributes-to":"tgt-billing-conv","envelope":{"actor":"ana-dev","authority":"pm-growth","issued-at":"2027-04-02","idempotency-key":"out-cta-upgrade-2027q1","nonce":"nonce-out-cta-upgrade-2027q1"}}', n.dataHash = 'd9cf9a4c7a1a';
MERGE (n:GovernanceNode:OUTCOME {id: 'out-fix-checkout-timeout-2027h1'})
SET n.type = 'outcome', n.label = 'incident-count: -1 incidentes/mês', n.data = '{"id":"out-fix-checkout-timeout-2027h1","emitted-by":"fix-checkout-timeout","source":"acme-obs-stack/incident-count@obs-rev19","window":{"start":"2027-04-01","end":"2027-04-30"},"metric":"incident-count","value":"-1 incidentes/mês","aggregation":"sum","attested-by":"acme-obs-stack","revision":"obs@rev19","contract-revisions":[],"contributes-to":"tgt-sre-incidents","envelope":{"actor":"tool:r5-operational-outcome","authority":"lead-sre","issued-at":"2027-04-10","idempotency-key":"out-fix-checkout-timeout-2027h1","nonce":"nonce-out-fix-checkout-timeout-2027h1"}}', n.dataHash = '03017caed5d0';
MERGE (n:GovernanceNode:METRIC {id: 'p99-latency'})
SET n.type = 'metric', n.label = 'p99-latency', n.data = '{"id":"p99-latency","unit":"ms","source":"acme-obs-stack","aggregation":"p99","owner":"time-sre"}', n.dataHash = '99fe4529166b';
MERGE (n:GovernanceNode:AUTHORITY {id: 'pm-growth'})
SET n.type = 'authority', n.label = 'pm-growth', n.data = '{"id":"pm-growth","kind":"role","of":"area-growth"}', n.dataHash = '30bdda478f4d';
MERGE (n:GovernanceNode:PROPOSAL {id: 'prop-checkout-hardening'})
SET n.type = 'proposal', n.label = 'hardening planejado do checkout pós-incidente', n.data = '{"id":"prop-checkout-hardening","title":"hardening planejado do checkout pós-incidente","raised-by":"incident:incidente-checkout","authorized-by":"obj-efficiency","target":"tgt-sre-incidents","status":"proposed","note":"vem do postmortem do incidente; pode virar intent reliability/operacional ou ser descartada no gate"}', n.dataHash = 'c37ba642569e';
MERGE (n:GovernanceNode:ACCESS_REQUEST {id: 'req-billing-read-own-context'})
SET n.type = 'access-request', n.label = 'read-context: acme-mfe-billing', n.data = '{"id":"req-billing-read-own-context","actor":"lead-billing","action":"read-context","repo":"acme-mfe-billing","decision":"allow","via":"host-local-query","reason":"lead do time dono consulta o contexto publicado do próprio repo"}', n.dataHash = '9157008a5abf';
MERGE (n:GovernanceNode:AUTHORITY {id: 'sponsor-acme'})
SET n.type = 'authority', n.label = 'sponsor-acme', n.data = '{"id":"sponsor-acme","kind":"sponsor","note":"aprova perfil e objetivos company — fora da operação"}', n.dataHash = 'aeceee6f301c';
MERGE (n:GovernanceNode:THESIS {id: 'tese-cross-sell'})
SET n.type = 'thesis', n.label = 'ofertar o produto B à base do produto A, evidenciando o uso conjunto, move a conversão', n.data = '{"id":"tese-cross-sell","frames":"obj-revenue","says":"ofertar o produto B à base do produto A, evidenciando o uso conjunto, move a conversão","owner":"head-growth"}', n.dataHash = '30ff276c071a';
MERGE (n:GovernanceNode:THESIS {id: 'tese-eficiencia'})
SET n.type = 'thesis', n.label = 'padronizar o stack e endurecer a plataforma derrubam o custo por pedido', n.data = '{"id":"tese-eficiencia","frames":"obj-efficiency","says":"padronizar o stack e endurecer a plataforma derrubam o custo por pedido","owner":"head-platform"}', n.dataHash = '93d4e432c117';
MERGE (n:GovernanceNode:THESIS {id: 'tese-onboarding-retencao'})
SET n.type = 'thesis', n.label = 'cliente ativado na primeira semana cancela muito menos — ativação precoce é retenção', n.data = '{"id":"tese-onboarding-retencao","frames":"obj-retention","says":"cliente ativado na primeira semana cancela muito menos — ativação precoce é retenção","owner":"head-growth"}', n.dataHash = 'a4876e171ee3';
MERGE (n:GovernanceNode:THESIS {id: 'tese-pricing-anual'})
SET n.type = 'thesis', n.label = 'planos anuais com desconto aumentam a receita por cliente e antecipam caixa', n.data = '{"id":"tese-pricing-anual","frames":"obj-revenue","says":"planos anuais com desconto aumentam a receita por cliente e antecipam caixa","owner":"head-growth"}', n.dataHash = '88d7ff0d7cbe';
MERGE (n:GovernanceNode:THESIS {id: 'tese-privacidade'})
SET n.type = 'thesis', n.label = 'minimizar dados coletados e dar controle ao cliente reduz risco e constrói confiança', n.data = '{"id":"tese-privacidade","frames":"obj-trust","says":"minimizar dados coletados e dar controle ao cliente reduz risco e constrói confiança","owner":"head-platform"}', n.dataHash = 'c26ba4968f59';
MERGE (n:GovernanceNode:THESIS {id: 'tese-self-service'})
SET n.type = 'thesis', n.label = 'autoatendimento bem feito derruba o custo por ticket sem piorar a satisfação', n.data = '{"id":"tese-self-service","frames":"obj-efficiency","says":"autoatendimento bem feito derruba o custo por ticket sem piorar a satisfação","owner":"head-cx"}', n.dataHash = '129fecf12e7e';
MERGE (n:GovernanceNode:THESIS {id: 'tese-suporte-retencao'})
SET n.type = 'thesis', n.label = 'resolver rápido no suporte reduz churn — tempo de resolução prevê cancelamento', n.data = '{"id":"tese-suporte-retencao","frames":"obj-retention","says":"resolver rápido no suporte reduz churn — tempo de resolução prevê cancelamento","owner":"head-cx"}', n.dataHash = 'f2c3878290fa';
MERGE (n:GovernanceNode:TARGET {id: 'tgt-billing-conv'})
SET n.type = 'target', n.label = '+X% de conversão de cross-sell', n.data = '{"id":"tgt-billing-conv","node":"time-billing","metric":"conversion-rate","period":"2027-H1","expected":"+X% de conversão de cross-sell","definer":"pm-growth","attester":"acme-analytics","contributes-to":"obj-revenue","status":"active"}', n.dataHash = 'd153a855cb61';
MERGE (n:GovernanceNode:TARGET {id: 'tgt-checkout-conv'})
SET n.type = 'target', n.label = '+V% de conversão no checkout (1 clique)', n.data = '{"id":"tgt-checkout-conv","node":"time-checkout","metric":"conversion-rate","period":"2027-H1","expected":"+V% de conversão no checkout (1 clique)","definer":"pm-growth","attester":"acme-analytics","contributes-to":"obj-revenue","status":"active"}', n.dataHash = 'e209ec5043b3';
MERGE (n:GovernanceNode:TARGET {id: 'tgt-checkout-stack'})
SET n.type = 'target', n.label = 'checkout no stack novo até o fim do H2 (-W% de custo)', n.data = '{"id":"tgt-checkout-stack","node":"time-checkout","metric":"cost-to-serve","period":"2027-H2","expected":"checkout no stack novo até o fim do H2 (-W% de custo)","definer":"head-platform","attester":"acme-data-pipeline","contributes-to":"obj-efficiency","status":"active"}', n.dataHash = 'b12779676772';
MERGE (n:GovernanceNode:TARGET {id: 'tgt-data-cost'})
SET n.type = 'target', n.label = '-Z% no custo da infra de dados', n.data = '{"id":"tgt-data-cost","node":"time-data","metric":"cost-to-serve","period":"2027-H1","expected":"-Z% no custo da infra de dados","definer":"head-platform","attester":"acme-data-pipeline","contributes-to":"obj-efficiency","status":"active","attestation-collapse":{"reason":"time-data mede a propria fonte operacional (acme-data-pipeline); trocar a fonte seria artificial nesta sim","approved-by":"sponsor-acme","review-at":"2027-01-15","visibility":"dashboard-badge"}}', n.dataHash = '5670cab6d8b8';
MERGE (n:GovernanceNode:TARGET {id: 'tgt-identity-consent'})
SET n.type = 'target', n.label = '100% dos dados com base legal registrada', n.data = '{"id":"tgt-identity-consent","node":"time-identity","metric":"consent-coverage","period":"2027-H1","expected":"100% dos dados com base legal registrada","definer":"head-platform","attester":"acme-data-pipeline","contributes-to":"obj-trust","status":"active"}', n.dataHash = '3cc643717a67';
MERGE (n:GovernanceNode:TARGET {id: 'tgt-onboarding-act'})
SET n.type = 'target', n.label = '+Y% de ativação', n.data = '{"id":"tgt-onboarding-act","node":"time-onboarding","metric":"activation-rate","period":"2027-H1","expected":"+Y% de ativação","definer":"pm-growth","attester":"acme-analytics","contributes-to":"obj-revenue","status":"active"}', n.dataHash = 'bd431bc1b1af';
MERGE (n:GovernanceNode:TARGET {id: 'tgt-onboarding-churn'})
SET n.type = 'target', n.label = '-P p.p. de churn nos ativados na 1ª semana', n.data = '{"id":"tgt-onboarding-churn","node":"time-onboarding","metric":"churn-rate","period":"2027-H1","expected":"-P p.p. de churn nos ativados na 1ª semana","definer":"pm-growth","attester":"acme-analytics","contributes-to":"obj-retention","status":"active"}', n.dataHash = 'f76bf1b17b4f';
MERGE (n:GovernanceNode:TARGET {id: 'tgt-sre-incidents'})
SET n.type = 'target', n.label = '-30% de incidentes', n.data = '{"id":"tgt-sre-incidents","node":"time-sre","metric":"incident-count","period":"2027-H1","expected":"-30% de incidentes","definer":"head-platform","attester":"acme-obs-stack","contributes-to":"obj-efficiency","status":"active","attestation-collapse":{"reason":"time-sre atesta incidentes pela propria stack de observabilidade; colapso e intencional e visivel","approved-by":"sponsor-acme","review-at":"2027-01-15","visibility":"dashboard-badge"}}', n.dataHash = '198f2cba9344';
MERGE (n:GovernanceNode:TARGET {id: 'tgt-sre-p99'})
SET n.type = 'target', n.label = 'p99 abaixo de N ms', n.data = '{"id":"tgt-sre-p99","node":"time-sre","metric":"p99-latency","period":"2027-H1","expected":"p99 abaixo de N ms","definer":"head-platform","attester":"acme-obs-stack","contributes-to":"obj-efficiency","status":"active","attestation-collapse":{"reason":"time-sre atesta SLO pela propria stack de observabilidade; independencia externa seria antieconomica nesta sim","approved-by":"sponsor-acme","review-at":"2027-01-15","visibility":"dashboard-badge"}}', n.dataHash = 'e380e3d222cb';
MERGE (n:GovernanceNode:TARGET {id: 'tgt-support-churn'})
SET n.type = 'target', n.label = '-Q p.p. de churn entre quem abre ticket', n.data = '{"id":"tgt-support-churn","node":"time-support","metric":"churn-rate","period":"2027-H1","expected":"-Q p.p. de churn entre quem abre ticket","definer":"head-cx","attester":"acme-analytics","contributes-to":"obj-retention","status":"active"}', n.dataHash = '330226053fcb';
MERGE (n:GovernanceNode:TARGET {id: 'tgt-support-cost'})
SET n.type = 'target', n.label = '-R% no custo por ticket via autoatendimento', n.data = '{"id":"tgt-support-cost","node":"time-support","metric":"ticket-cost","period":"2027-H2","expected":"-R% no custo por ticket via autoatendimento","definer":"head-cx","attester":"acme-data-pipeline","contributes-to":"obj-efficiency","status":"active"}', n.dataHash = '7d8d4263ca87';
MERGE (n:GovernanceNode:METRIC {id: 'ticket-cost'})
SET n.type = 'metric', n.label = 'ticket-cost', n.data = '{"id":"ticket-cost","unit":"R$/ticket","source":"acme-data-pipeline","aggregation":"avg","owner":"time-data"}', n.dataHash = 'e5fe9d858998';
MERGE (n:GovernanceNode:TEAM {id: 'time-billing'})
SET n.type = 'team', n.label = 'time-billing', n.data = '{"id":"time-billing","area":"area-growth","lead":"lead-billing"}', n.dataHash = 'ff9dade0302c';
MERGE (n:GovernanceNode:TEAM {id: 'time-checkout'})
SET n.type = 'team', n.label = 'time-checkout', n.data = '{"id":"time-checkout","area":"area-platform","lead":"lead-checkout"}', n.dataHash = '4e5f909dc12a';
MERGE (n:GovernanceNode:TEAM {id: 'time-data'})
SET n.type = 'team', n.label = 'time-data', n.data = '{"id":"time-data","area":"area-platform","lead":"lead-data"}', n.dataHash = '4d24b2ee4970';
MERGE (n:GovernanceNode:TEAM {id: 'time-identity'})
SET n.type = 'team', n.label = 'time-identity', n.data = '{"id":"time-identity","area":"area-platform","lead":"lead-identity"}', n.dataHash = '343ee0145081';
MERGE (n:GovernanceNode:TEAM {id: 'time-onboarding'})
SET n.type = 'team', n.label = 'time-onboarding', n.data = '{"id":"time-onboarding","area":"area-growth","lead":"lead-onboarding"}', n.dataHash = '0f6b2dbe175f';
MERGE (n:GovernanceNode:TEAM {id: 'time-sre'})
SET n.type = 'team', n.label = 'time-sre', n.data = '{"id":"time-sre","area":"area-platform","lead":"lead-sre"}', n.dataHash = 'd5e93cd63c43';
MERGE (n:GovernanceNode:TEAM {id: 'time-support'})
SET n.type = 'team', n.label = 'time-support', n.data = '{"id":"time-support","area":"area-cx","lead":"lead-support"}', n.dataHash = 'd11ea3847aea';
MERGE (n:GovernanceNode:VERDICT {id: 'verdict-cta-upgrade-2027q1'})
SET n.type = 'verdict', n.label = 'won: intent-cta-upgrade', n.data = '{"id":"verdict-cta-upgrade-2027q1","intent":"intent-cta-upgrade","outcome":"out-cta-upgrade-2027q1","verdict":"won","decided-by":"pm-growth","decided-at":"2027-04-10","decision-rule":"roda 4 semanas OU 50k exposições; ganha se conversão ↑ X% sem churn ↑","evidence":["outcome:out-cta-upgrade-2027q1","resolver:valid-outcome"],"next":"graduation"}', n.dataHash = 'f3af22544c0e';

MATCH (source:GovernanceNode {id: 'pm-growth'}), (target:GovernanceNode {id: 'verdict-cta-upgrade-2027q1'})
MERGE (source)-[r:ACCEPTS_VERDICT {id: 'accepts-verdict:pm-growth->verdict-cta-upgrade-2027q1'}]->(target)
SET r.type = 'accepts-verdict';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click::api-token-pagamento::repo-ack'}), (target:GovernanceNode {id: 'intent-checkout-1click::api-token-pagamento'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-checkout-1click::api-token-pagamento::repo-ack->intent-checkout-1click::api-token-pagamento'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click::baseline-1click::repo-ack'}), (target:GovernanceNode {id: 'intent-checkout-1click::baseline-1click'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-checkout-1click::baseline-1click::repo-ack->intent-checkout-1click::baseline-1click'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click::flag-1click::repo-ack'}), (target:GovernanceNode {id: 'intent-checkout-1click::flag-1click'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-checkout-1click::flag-1click::repo-ack->intent-checkout-1click::flag-1click'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::adapta-api::repo-ack'}), (target:GovernanceNode {id: 'intent-checkout-stack::adapta-api'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-checkout-stack::adapta-api::repo-ack->intent-checkout-stack::adapta-api'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::componentes-ds::repo-ack'}), (target:GovernanceNode {id: 'intent-checkout-stack::componentes-ds'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-checkout-stack::componentes-ds::repo-ack->intent-checkout-stack::componentes-ds'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::estrangula-pedidos::repo-ack'}), (target:GovernanceNode {id: 'intent-checkout-stack::estrangula-pedidos'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-checkout-stack::estrangula-pedidos::repo-ack->intent-checkout-stack::estrangula-pedidos'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::monitor-canary::repo-ack'}), (target:GovernanceNode {id: 'intent-checkout-stack::monitor-canary'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-checkout-stack::monitor-canary::repo-ack->intent-checkout-stack::monitor-canary'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::porta-fluxo::repo-ack'}), (target:GovernanceNode {id: 'intent-checkout-stack::porta-fluxo'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-checkout-stack::porta-fluxo::repo-ack->intent-checkout-stack::porta-fluxo'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::revisao-contrato::repo-ack'}), (target:GovernanceNode {id: 'intent-checkout-stack::revisao-contrato'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-checkout-stack::revisao-contrato::repo-ack->intent-checkout-stack::revisao-contrato'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::spike-carrinho::repo-ack'}), (target:GovernanceNode {id: 'intent-checkout-stack::spike-carrinho'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-checkout-stack::spike-carrinho::repo-ack->intent-checkout-stack::spike-carrinho'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-consent-center::central-consentimento::repo-ack'}), (target:GovernanceNode {id: 'intent-consent-center::central-consentimento'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-consent-center::central-consentimento::repo-ack->intent-consent-center::central-consentimento'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-consent-center::contexto-consentimento::repo-ack'}), (target:GovernanceNode {id: 'intent-consent-center::contexto-consentimento'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-consent-center::contexto-consentimento::repo-ack->intent-consent-center::contexto-consentimento'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-consent-center::propagar-base-legal::repo-ack'}), (target:GovernanceNode {id: 'intent-consent-center::propagar-base-legal'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-consent-center::propagar-base-legal::repo-ack->intent-consent-center::propagar-base-legal'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::api-elegibilidade::repo-ack'}), (target:GovernanceNode {id: 'intent-cta-upgrade::api-elegibilidade'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-cta-upgrade::api-elegibilidade::repo-ack->intent-cta-upgrade::api-elegibilidade'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::baseline-eventos::repo-ack'}), (target:GovernanceNode {id: 'intent-cta-upgrade::baseline-eventos'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-cta-upgrade::baseline-eventos::repo-ack->intent-cta-upgrade::baseline-eventos'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::contas-legadas::repo-ack'}), (target:GovernanceNode {id: 'intent-cta-upgrade::contas-legadas'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-cta-upgrade::contas-legadas::repo-ack->intent-cta-upgrade::contas-legadas'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::spike-elegibilidade::repo-ack'}), (target:GovernanceNode {id: 'intent-cta-upgrade::spike-elegibilidade'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-cta-upgrade::spike-elegibilidade::repo-ack->intent-cta-upgrade::spike-elegibilidade'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::ui-cta::repo-ack'}), (target:GovernanceNode {id: 'intent-cta-upgrade::ui-cta'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-cta-upgrade::ui-cta::repo-ack->intent-cta-upgrade::ui-cta'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice::base-conhecimento::repo-ack'}), (target:GovernanceNode {id: 'intent-help-selfservice::base-conhecimento'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-help-selfservice::base-conhecimento::repo-ack->intent-help-selfservice::base-conhecimento'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice::chatbot-deflexao::repo-ack'}), (target:GovernanceNode {id: 'intent-help-selfservice::chatbot-deflexao'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-help-selfservice::chatbot-deflexao::repo-ack->intent-help-selfservice::chatbot-deflexao'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice::eventos-deflexao::repo-ack'}), (target:GovernanceNode {id: 'intent-help-selfservice::eventos-deflexao'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-help-selfservice::eventos-deflexao::repo-ack->intent-help-selfservice::eventos-deflexao'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-onboarding-checklist::baseline-ativacao::repo-ack'}), (target:GovernanceNode {id: 'intent-onboarding-checklist::baseline-ativacao'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-onboarding-checklist::baseline-ativacao::repo-ack->intent-onboarding-checklist::baseline-ativacao'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-onboarding-checklist::flag-checklist::repo-ack'}), (target:GovernanceNode {id: 'intent-onboarding-checklist::flag-checklist'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-onboarding-checklist::flag-checklist::repo-ack->intent-onboarding-checklist::flag-checklist'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening::cache-contexto::repo-ack'}), (target:GovernanceNode {id: 'intent-p99-hardening::cache-contexto'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-p99-hardening::cache-contexto::repo-ack->intent-p99-hardening::cache-contexto'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening::guardrails-p99::repo-ack'}), (target:GovernanceNode {id: 'intent-p99-hardening::guardrails-p99'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-p99-hardening::guardrails-p99::repo-ack->intent-p99-hardening::guardrails-p99'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening::timeouts-api::repo-ack'}), (target:GovernanceNode {id: 'intent-p99-hardening::timeouts-api'})
MERGE (source)-[r:ACKNOWLEDGES_WORK {id: 'acknowledges-work:intent-p99-hardening::timeouts-api::repo-ack->intent-p99-hardening::timeouts-api'}]->(target)
SET r.type = 'acknowledges-work';
MATCH (source:GovernanceNode {id: 'acme-user-context::acme-user-context-v4-coordenada'}), (target:GovernanceNode {id: 'acme-checkout'})
MERGE (source)-[r:AFFECTS_CONSUMER {id: 'affects-consumer:acme-user-context::acme-user-context-v4-coordenada->acme-checkout'}]->(target)
SET r.type = 'affects-consumer';
MATCH (source:GovernanceNode {id: 'acme-user-context::acme-user-context-v4-coordenada'}), (target:GovernanceNode {id: 'acme-mfe-billing'})
MERGE (source)-[r:AFFECTS_CONSUMER {id: 'affects-consumer:acme-user-context::acme-user-context-v4-coordenada->acme-mfe-billing'}]->(target)
SET r.type = 'affects-consumer';
MATCH (source:GovernanceNode {id: 'acme-user-context::acme-user-context-v4-coordenada'}), (target:GovernanceNode {id: 'acme-mfe-onboarding'})
MERGE (source)-[r:AFFECTS_CONSUMER {id: 'affects-consumer:acme-user-context::acme-user-context-v4-coordenada->acme-mfe-onboarding'}]->(target)
SET r.type = 'affects-consumer';
MATCH (source:GovernanceNode {id: 'req-billing-read-own-context'}), (target:GovernanceNode {id: 'acme-mfe-billing'})
MERGE (source)-[r:ALLOWED_READ {id: 'allowed-read:req-billing-read-own-context->acme-mfe-billing'}]->(target)
SET r.type = 'allowed-read';
MATCH (source:GovernanceNode {id: 'sponsor-acme'}), (target:GovernanceNode {id: 'tgt-data-cost'})
MERGE (source)-[r:APPROVES_COLLAPSE {id: 'approves-collapse:sponsor-acme->tgt-data-cost'}]->(target)
SET r.type = 'approves-collapse';
MATCH (source:GovernanceNode {id: 'sponsor-acme'}), (target:GovernanceNode {id: 'tgt-sre-incidents'})
MERGE (source)-[r:APPROVES_COLLAPSE {id: 'approves-collapse:sponsor-acme->tgt-sre-incidents'}]->(target)
SET r.type = 'approves-collapse';
MATCH (source:GovernanceNode {id: 'sponsor-acme'}), (target:GovernanceNode {id: 'tgt-sre-p99'})
MERGE (source)-[r:APPROVES_COLLAPSE {id: 'approves-collapse:sponsor-acme->tgt-sre-p99'}]->(target)
SET r.type = 'approves-collapse';
MATCH (source:GovernanceNode {id: 'head-platform'}), (target:GovernanceNode {id: 'acme-user-context::acme-user-context-v4-coordenada'})
MERGE (source)-[r:APPROVES {id: 'approves:head-platform->acme-user-context::acme-user-context-v4-coordenada'}]->(target)
SET r.type = 'approves';
MATCH (source:GovernanceNode {id: 'out-checkout-stack-2027h2'}), (target:GovernanceNode {id: 'acme-data-pipeline'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:out-checkout-stack-2027h2->acme-data-pipeline'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'out-cta-upgrade-2027q1'}), (target:GovernanceNode {id: 'acme-analytics'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:out-cta-upgrade-2027q1->acme-analytics'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'out-fix-checkout-timeout-2027h1'}), (target:GovernanceNode {id: 'acme-obs-stack'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:out-fix-checkout-timeout-2027h1->acme-obs-stack'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'tgt-billing-conv'}), (target:GovernanceNode {id: 'acme-analytics'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:tgt-billing-conv->acme-analytics'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'tgt-checkout-conv'}), (target:GovernanceNode {id: 'acme-analytics'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:tgt-checkout-conv->acme-analytics'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'tgt-checkout-stack'}), (target:GovernanceNode {id: 'acme-data-pipeline'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:tgt-checkout-stack->acme-data-pipeline'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'tgt-data-cost'}), (target:GovernanceNode {id: 'acme-data-pipeline'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:tgt-data-cost->acme-data-pipeline'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'tgt-identity-consent'}), (target:GovernanceNode {id: 'acme-data-pipeline'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:tgt-identity-consent->acme-data-pipeline'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'tgt-onboarding-act'}), (target:GovernanceNode {id: 'acme-analytics'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:tgt-onboarding-act->acme-analytics'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'tgt-onboarding-churn'}), (target:GovernanceNode {id: 'acme-analytics'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:tgt-onboarding-churn->acme-analytics'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'tgt-sre-incidents'}), (target:GovernanceNode {id: 'acme-obs-stack'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:tgt-sre-incidents->acme-obs-stack'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'tgt-sre-p99'}), (target:GovernanceNode {id: 'acme-obs-stack'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:tgt-sre-p99->acme-obs-stack'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'tgt-support-churn'}), (target:GovernanceNode {id: 'acme-analytics'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:tgt-support-churn->acme-analytics'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'tgt-support-cost'}), (target:GovernanceNode {id: 'acme-data-pipeline'})
MERGE (source)-[r:ATTESTED_BY {id: 'attested-by:tgt-support-cost->acme-data-pipeline'}]->(target)
SET r.type = 'attested-by';
MATCH (source:GovernanceNode {id: 'head-platform'}), (target:GovernanceNode {id: 'out-checkout-stack-2027h2'})
MERGE (source)-[r:AUTHORIZES_MUTATION {id: 'authorizes-mutation:head-platform->out-checkout-stack-2027h2'}]->(target)
SET r.type = 'authorizes-mutation';
MATCH (source:GovernanceNode {id: 'lead-sre'}), (target:GovernanceNode {id: 'out-fix-checkout-timeout-2027h1'})
MERGE (source)-[r:AUTHORIZES_MUTATION {id: 'authorizes-mutation:lead-sre->out-fix-checkout-timeout-2027h1'}]->(target)
SET r.type = 'authorizes-mutation';
MATCH (source:GovernanceNode {id: 'pm-growth'}), (target:GovernanceNode {id: 'out-cta-upgrade-2027q1'})
MERGE (source)-[r:AUTHORIZES_MUTATION {id: 'authorizes-mutation:pm-growth->out-cta-upgrade-2027q1'}]->(target)
SET r.type = 'authorizes-mutation';
MATCH (source:GovernanceNode {id: 'obj-efficiency'}), (target:GovernanceNode {id: 'intent-checkout-stack'})
MERGE (source)-[r:AUTHORIZES {id: 'authorizes:obj-efficiency->intent-checkout-stack'}]->(target)
SET r.type = 'authorizes';
MATCH (source:GovernanceNode {id: 'obj-efficiency'}), (target:GovernanceNode {id: 'intent-help-selfservice'})
MERGE (source)-[r:AUTHORIZES {id: 'authorizes:obj-efficiency->intent-help-selfservice'}]->(target)
SET r.type = 'authorizes';
MATCH (source:GovernanceNode {id: 'obj-efficiency'}), (target:GovernanceNode {id: 'intent-p99-hardening'})
MERGE (source)-[r:AUTHORIZES {id: 'authorizes:obj-efficiency->intent-p99-hardening'}]->(target)
SET r.type = 'authorizes';
MATCH (source:GovernanceNode {id: 'obj-efficiency'}), (target:GovernanceNode {id: 'prop-checkout-hardening'})
MERGE (source)-[r:AUTHORIZES {id: 'authorizes:obj-efficiency->prop-checkout-hardening'}]->(target)
SET r.type = 'authorizes';
MATCH (source:GovernanceNode {id: 'obj-retention'}), (target:GovernanceNode {id: 'intent-onboarding-checklist'})
MERGE (source)-[r:AUTHORIZES {id: 'authorizes:obj-retention->intent-onboarding-checklist'}]->(target)
SET r.type = 'authorizes';
MATCH (source:GovernanceNode {id: 'obj-revenue'}), (target:GovernanceNode {id: 'intent-checkout-1click'})
MERGE (source)-[r:AUTHORIZES {id: 'authorizes:obj-revenue->intent-checkout-1click'}]->(target)
SET r.type = 'authorizes';
MATCH (source:GovernanceNode {id: 'obj-revenue'}), (target:GovernanceNode {id: 'intent-cta-upgrade'})
MERGE (source)-[r:AUTHORIZES {id: 'authorizes:obj-revenue->intent-cta-upgrade'}]->(target)
SET r.type = 'authorizes';
MATCH (source:GovernanceNode {id: 'obj-trust'}), (target:GovernanceNode {id: 'intent-consent-center'})
MERGE (source)-[r:AUTHORIZES {id: 'authorizes:obj-trust->intent-consent-center'}]->(target)
SET r.type = 'authorizes';
MATCH (source:GovernanceNode {id: 'acme-analytics::contract::acme-events-schema'}), (target:GovernanceNode {id: 'acme-events-schema'})
MERGE (source)-[r:BACKS_CONTRACT {id: 'backs-contract:acme-analytics::contract::acme-events-schema->acme-events-schema'}]->(target)
SET r.type = 'backs-contract';
MATCH (source:GovernanceNode {id: 'acme-design-system::contract::acme-design-tokens'}), (target:GovernanceNode {id: 'acme-design-tokens'})
MERGE (source)-[r:BACKS_CONTRACT {id: 'backs-contract:acme-design-system::contract::acme-design-tokens->acme-design-tokens'}]->(target)
SET r.type = 'backs-contract';
MATCH (source:GovernanceNode {id: 'acme-web-host::contract::acme-user-context'}), (target:GovernanceNode {id: 'acme-user-context'})
MERGE (source)-[r:BACKS_CONTRACT {id: 'backs-contract:acme-web-host::contract::acme-user-context->acme-user-context'}]->(target)
SET r.type = 'backs-contract';
MATCH (source:GovernanceNode {id: 'head-cx'}), (target:GovernanceNode {id: 'area-cx'})
MERGE (source)-[r:BELONGS_TO {id: 'belongs-to:head-cx->area-cx'}]->(target)
SET r.type = 'belongs-to';
MATCH (source:GovernanceNode {id: 'head-growth'}), (target:GovernanceNode {id: 'area-growth'})
MERGE (source)-[r:BELONGS_TO {id: 'belongs-to:head-growth->area-growth'}]->(target)
SET r.type = 'belongs-to';
MATCH (source:GovernanceNode {id: 'head-platform'}), (target:GovernanceNode {id: 'area-platform'})
MERGE (source)-[r:BELONGS_TO {id: 'belongs-to:head-platform->area-platform'}]->(target)
SET r.type = 'belongs-to';
MATCH (source:GovernanceNode {id: 'lead-billing'}), (target:GovernanceNode {id: 'time-billing'})
MERGE (source)-[r:BELONGS_TO {id: 'belongs-to:lead-billing->time-billing'}]->(target)
SET r.type = 'belongs-to';
MATCH (source:GovernanceNode {id: 'lead-checkout'}), (target:GovernanceNode {id: 'time-checkout'})
MERGE (source)-[r:BELONGS_TO {id: 'belongs-to:lead-checkout->time-checkout'}]->(target)
SET r.type = 'belongs-to';
MATCH (source:GovernanceNode {id: 'lead-data'}), (target:GovernanceNode {id: 'time-data'})
MERGE (source)-[r:BELONGS_TO {id: 'belongs-to:lead-data->time-data'}]->(target)
SET r.type = 'belongs-to';
MATCH (source:GovernanceNode {id: 'lead-identity'}), (target:GovernanceNode {id: 'time-identity'})
MERGE (source)-[r:BELONGS_TO {id: 'belongs-to:lead-identity->time-identity'}]->(target)
SET r.type = 'belongs-to';
MATCH (source:GovernanceNode {id: 'lead-onboarding'}), (target:GovernanceNode {id: 'time-onboarding'})
MERGE (source)-[r:BELONGS_TO {id: 'belongs-to:lead-onboarding->time-onboarding'}]->(target)
SET r.type = 'belongs-to';
MATCH (source:GovernanceNode {id: 'lead-sre'}), (target:GovernanceNode {id: 'time-sre'})
MERGE (source)-[r:BELONGS_TO {id: 'belongs-to:lead-sre->time-sre'}]->(target)
SET r.type = 'belongs-to';
MATCH (source:GovernanceNode {id: 'lead-support'}), (target:GovernanceNode {id: 'time-support'})
MERGE (source)-[r:BELONGS_TO {id: 'belongs-to:lead-support->time-support'}]->(target)
SET r.type = 'belongs-to';
MATCH (source:GovernanceNode {id: 'pm-growth'}), (target:GovernanceNode {id: 'area-growth'})
MERGE (source)-[r:BELONGS_TO {id: 'belongs-to:pm-growth->area-growth'}]->(target)
SET r.type = 'belongs-to';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::estrangula-pedidos'}), (target:GovernanceNode {id: 'intent-checkout-stack::spike-carrinho'})
MERGE (source)-[r:BLOCKED_BY {id: 'blocked-by:intent-checkout-stack::estrangula-pedidos->intent-checkout-stack::spike-carrinho'}]->(target)
SET r.type = 'blocked-by';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::porta-fluxo'}), (target:GovernanceNode {id: 'intent-checkout-stack::spike-carrinho'})
MERGE (source)-[r:BLOCKED_BY {id: 'blocked-by:intent-checkout-stack::porta-fluxo->intent-checkout-stack::spike-carrinho'}]->(target)
SET r.type = 'blocked-by';
MATCH (source:GovernanceNode {id: 'intent-consent-center::contexto-consentimento'}), (target:GovernanceNode {id: 'intent-consent-center::central-consentimento'})
MERGE (source)-[r:BLOCKED_BY {id: 'blocked-by:intent-consent-center::contexto-consentimento->intent-consent-center::central-consentimento'}]->(target)
SET r.type = 'blocked-by';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::api-elegibilidade'}), (target:GovernanceNode {id: 'intent-cta-upgrade::spike-elegibilidade'})
MERGE (source)-[r:BLOCKED_BY {id: 'blocked-by:intent-cta-upgrade::api-elegibilidade->intent-cta-upgrade::spike-elegibilidade'}]->(target)
SET r.type = 'blocked-by';
MATCH (source:GovernanceNode {id: 'obj-efficiency'}), (target:GovernanceNode {id: 'area-cx'})
MERGE (source)-[r:CASCADES_TO {id: 'cascades-to:obj-efficiency->area-cx'}]->(target)
SET r.type = 'cascades-to';
MATCH (source:GovernanceNode {id: 'obj-efficiency'}), (target:GovernanceNode {id: 'area-platform'})
MERGE (source)-[r:CASCADES_TO {id: 'cascades-to:obj-efficiency->area-platform'}]->(target)
SET r.type = 'cascades-to';
MATCH (source:GovernanceNode {id: 'obj-retention'}), (target:GovernanceNode {id: 'area-cx'})
MERGE (source)-[r:CASCADES_TO {id: 'cascades-to:obj-retention->area-cx'}]->(target)
SET r.type = 'cascades-to';
MATCH (source:GovernanceNode {id: 'obj-retention'}), (target:GovernanceNode {id: 'area-growth'})
MERGE (source)-[r:CASCADES_TO {id: 'cascades-to:obj-retention->area-growth'}]->(target)
SET r.type = 'cascades-to';
MATCH (source:GovernanceNode {id: 'obj-revenue'}), (target:GovernanceNode {id: 'area-growth'})
MERGE (source)-[r:CASCADES_TO {id: 'cascades-to:obj-revenue->area-growth'}]->(target)
SET r.type = 'cascades-to';
MATCH (source:GovernanceNode {id: 'obj-trust'}), (target:GovernanceNode {id: 'area-platform'})
MERGE (source)-[r:CASCADES_TO {id: 'cascades-to:obj-trust->area-platform'}]->(target)
SET r.type = 'cascades-to';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack'}), (target:GovernanceNode {id: 'acme-user-context'})
MERGE (source)-[r:CHANGES {id: 'changes:intent-checkout-stack->acme-user-context'}]->(target)
SET r.type = 'changes';
MATCH (source:GovernanceNode {id: 'intent-consent-center'}), (target:GovernanceNode {id: 'acme-user-context'})
MERGE (source)-[r:CHANGES {id: 'changes:intent-consent-center->acme-user-context'}]->(target)
SET r.type = 'changes';
MATCH (source:GovernanceNode {id: 'acme-design-tokens'}), (target:GovernanceNode {id: 'acme-checkout'})
MERGE (source)-[r:CONSUMED_BY {id: 'consumed-by:acme-design-tokens->acme-checkout'}]->(target)
SET r.type = 'consumed-by';
MATCH (source:GovernanceNode {id: 'acme-design-tokens'}), (target:GovernanceNode {id: 'acme-mfe-billing'})
MERGE (source)-[r:CONSUMED_BY {id: 'consumed-by:acme-design-tokens->acme-mfe-billing'}]->(target)
SET r.type = 'consumed-by';
MATCH (source:GovernanceNode {id: 'acme-design-tokens'}), (target:GovernanceNode {id: 'acme-mfe-onboarding'})
MERGE (source)-[r:CONSUMED_BY {id: 'consumed-by:acme-design-tokens->acme-mfe-onboarding'}]->(target)
SET r.type = 'consumed-by';
MATCH (source:GovernanceNode {id: 'acme-events-schema'}), (target:GovernanceNode {id: 'acme-checkout'})
MERGE (source)-[r:CONSUMED_BY {id: 'consumed-by:acme-events-schema->acme-checkout'}]->(target)
SET r.type = 'consumed-by';
MATCH (source:GovernanceNode {id: 'acme-events-schema'}), (target:GovernanceNode {id: 'acme-checkout-api'})
MERGE (source)-[r:CONSUMED_BY {id: 'consumed-by:acme-events-schema->acme-checkout-api'}]->(target)
SET r.type = 'consumed-by';
MATCH (source:GovernanceNode {id: 'acme-events-schema'}), (target:GovernanceNode {id: 'acme-mfe-billing'})
MERGE (source)-[r:CONSUMED_BY {id: 'consumed-by:acme-events-schema->acme-mfe-billing'}]->(target)
SET r.type = 'consumed-by';
MATCH (source:GovernanceNode {id: 'acme-events-schema'}), (target:GovernanceNode {id: 'acme-mfe-onboarding'})
MERGE (source)-[r:CONSUMED_BY {id: 'consumed-by:acme-events-schema->acme-mfe-onboarding'}]->(target)
SET r.type = 'consumed-by';
MATCH (source:GovernanceNode {id: 'acme-user-context'}), (target:GovernanceNode {id: 'acme-checkout'})
MERGE (source)-[r:CONSUMED_BY {id: 'consumed-by:acme-user-context->acme-checkout'}]->(target)
SET r.type = 'consumed-by';
MATCH (source:GovernanceNode {id: 'acme-user-context'}), (target:GovernanceNode {id: 'acme-mfe-billing'})
MERGE (source)-[r:CONSUMED_BY {id: 'consumed-by:acme-user-context->acme-mfe-billing'}]->(target)
SET r.type = 'consumed-by';
MATCH (source:GovernanceNode {id: 'acme-user-context'}), (target:GovernanceNode {id: 'acme-mfe-onboarding'})
MERGE (source)-[r:CONSUMED_BY {id: 'consumed-by:acme-user-context->acme-mfe-onboarding'}]->(target)
SET r.type = 'consumed-by';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click'}), (target:GovernanceNode {id: 'acme-events-schema'})
MERGE (source)-[r:CONSUMES {id: 'consumes:intent-checkout-1click->acme-events-schema'}]->(target)
SET r.type = 'consumes';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade'}), (target:GovernanceNode {id: 'acme-events-schema'})
MERGE (source)-[r:CONSUMES {id: 'consumes:intent-cta-upgrade->acme-events-schema'}]->(target)
SET r.type = 'consumes';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice'}), (target:GovernanceNode {id: 'acme-events-schema'})
MERGE (source)-[r:CONSUMES {id: 'consumes:intent-help-selfservice->acme-events-schema'}]->(target)
SET r.type = 'consumes';
MATCH (source:GovernanceNode {id: 'intent-onboarding-checklist'}), (target:GovernanceNode {id: 'acme-events-schema'})
MERGE (source)-[r:CONSUMES {id: 'consumes:intent-onboarding-checklist->acme-events-schema'}]->(target)
SET r.type = 'consumes';
MATCH (source:GovernanceNode {id: 'acme-analytics'}), (target:GovernanceNode {id: 'acme-analytics::src/index.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-analytics->acme-analytics::src/index.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-api-billing'}), (target:GovernanceNode {id: 'acme-api-billing::src/index.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-api-billing->acme-api-billing::src/index.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-checkout'}), (target:GovernanceNode {id: 'acme-checkout::src/index.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-checkout->acme-checkout::src/index.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-checkout-api'}), (target:GovernanceNode {id: 'acme-checkout-api::src/index.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-checkout-api->acme-checkout-api::src/index.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-core-api'}), (target:GovernanceNode {id: 'acme-core-api::src/modules/accounts.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-core-api->acme-core-api::src/modules/accounts.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-core-api'}), (target:GovernanceNode {id: 'acme-core-api::src/modules/orders.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-core-api->acme-core-api::src/modules/orders.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-data-pipeline'}), (target:GovernanceNode {id: 'acme-data-pipeline::src/index.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-data-pipeline->acme-data-pipeline::src/index.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-design-system'}), (target:GovernanceNode {id: 'acme-design-system::src/index.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-design-system->acme-design-system::src/index.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-help-center'}), (target:GovernanceNode {id: 'acme-help-center::src/index.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-help-center->acme-help-center::src/index.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-identity'}), (target:GovernanceNode {id: 'acme-identity::src/index.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-identity->acme-identity::src/index.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-mfe-billing'}), (target:GovernanceNode {id: 'acme-mfe-billing::src/index.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-mfe-billing->acme-mfe-billing::src/index.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-mfe-onboarding'}), (target:GovernanceNode {id: 'acme-mfe-onboarding::src/index.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-mfe-onboarding->acme-mfe-onboarding::src/index.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-obs-stack'}), (target:GovernanceNode {id: 'acme-obs-stack::src/index.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-obs-stack->acme-obs-stack::src/index.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'acme-web-host'}), (target:GovernanceNode {id: 'acme-web-host::src/index.mjs'})
MERGE (source)-[r:CONTAINS_CODE {id: 'contains-code:acme-web-host->acme-web-host::src/index.mjs'}]->(target)
SET r.type = 'contains-code';
MATCH (source:GovernanceNode {id: 'out-checkout-stack-2027h2'}), (target:GovernanceNode {id: 'tgt-checkout-stack'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:out-checkout-stack-2027h2->tgt-checkout-stack'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'out-cta-upgrade-2027q1'}), (target:GovernanceNode {id: 'tgt-billing-conv'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:out-cta-upgrade-2027q1->tgt-billing-conv'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'out-fix-checkout-timeout-2027h1'}), (target:GovernanceNode {id: 'tgt-sre-incidents'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:out-fix-checkout-timeout-2027h1->tgt-sre-incidents'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'tgt-billing-conv'}), (target:GovernanceNode {id: 'obj-revenue'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:tgt-billing-conv->obj-revenue'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'tgt-checkout-conv'}), (target:GovernanceNode {id: 'obj-revenue'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:tgt-checkout-conv->obj-revenue'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'tgt-checkout-stack'}), (target:GovernanceNode {id: 'obj-efficiency'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:tgt-checkout-stack->obj-efficiency'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'tgt-data-cost'}), (target:GovernanceNode {id: 'obj-efficiency'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:tgt-data-cost->obj-efficiency'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'tgt-identity-consent'}), (target:GovernanceNode {id: 'obj-trust'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:tgt-identity-consent->obj-trust'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'tgt-onboarding-act'}), (target:GovernanceNode {id: 'obj-revenue'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:tgt-onboarding-act->obj-revenue'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'tgt-onboarding-churn'}), (target:GovernanceNode {id: 'obj-retention'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:tgt-onboarding-churn->obj-retention'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'tgt-sre-incidents'}), (target:GovernanceNode {id: 'obj-efficiency'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:tgt-sre-incidents->obj-efficiency'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'tgt-sre-p99'}), (target:GovernanceNode {id: 'obj-efficiency'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:tgt-sre-p99->obj-efficiency'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'tgt-support-churn'}), (target:GovernanceNode {id: 'obj-retention'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:tgt-support-churn->obj-retention'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'tgt-support-cost'}), (target:GovernanceNode {id: 'obj-efficiency'})
MERGE (source)-[r:CONTRIBUTES_TO {id: 'contributes-to:tgt-support-cost->obj-efficiency'}]->(target)
SET r.type = 'contributes-to';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack'}), (target:GovernanceNode {id: 'acme-user-context::acme-user-context-v4-coordenada'})
MERGE (source)-[r:COORDINATES {id: 'coordinates:intent-checkout-stack->acme-user-context::acme-user-context-v4-coordenada'}]->(target)
SET r.type = 'coordinates';
MATCH (source:GovernanceNode {id: 'intent-consent-center'}), (target:GovernanceNode {id: 'acme-user-context::acme-user-context-v4-coordenada'})
MERGE (source)-[r:COORDINATES {id: 'coordinates:intent-consent-center->acme-user-context::acme-user-context-v4-coordenada'}]->(target)
SET r.type = 'coordinates';
MATCH (source:GovernanceNode {id: 'head-cx'}), (target:GovernanceNode {id: 'tgt-support-churn'})
MERGE (source)-[r:DEFINES {id: 'defines:head-cx->tgt-support-churn'}]->(target)
SET r.type = 'defines';
MATCH (source:GovernanceNode {id: 'head-cx'}), (target:GovernanceNode {id: 'tgt-support-cost'})
MERGE (source)-[r:DEFINES {id: 'defines:head-cx->tgt-support-cost'}]->(target)
SET r.type = 'defines';
MATCH (source:GovernanceNode {id: 'head-platform'}), (target:GovernanceNode {id: 'tgt-checkout-stack'})
MERGE (source)-[r:DEFINES {id: 'defines:head-platform->tgt-checkout-stack'}]->(target)
SET r.type = 'defines';
MATCH (source:GovernanceNode {id: 'head-platform'}), (target:GovernanceNode {id: 'tgt-data-cost'})
MERGE (source)-[r:DEFINES {id: 'defines:head-platform->tgt-data-cost'}]->(target)
SET r.type = 'defines';
MATCH (source:GovernanceNode {id: 'head-platform'}), (target:GovernanceNode {id: 'tgt-identity-consent'})
MERGE (source)-[r:DEFINES {id: 'defines:head-platform->tgt-identity-consent'}]->(target)
SET r.type = 'defines';
MATCH (source:GovernanceNode {id: 'head-platform'}), (target:GovernanceNode {id: 'tgt-sre-incidents'})
MERGE (source)-[r:DEFINES {id: 'defines:head-platform->tgt-sre-incidents'}]->(target)
SET r.type = 'defines';
MATCH (source:GovernanceNode {id: 'head-platform'}), (target:GovernanceNode {id: 'tgt-sre-p99'})
MERGE (source)-[r:DEFINES {id: 'defines:head-platform->tgt-sre-p99'}]->(target)
SET r.type = 'defines';
MATCH (source:GovernanceNode {id: 'pm-growth'}), (target:GovernanceNode {id: 'tgt-billing-conv'})
MERGE (source)-[r:DEFINES {id: 'defines:pm-growth->tgt-billing-conv'}]->(target)
SET r.type = 'defines';
MATCH (source:GovernanceNode {id: 'pm-growth'}), (target:GovernanceNode {id: 'tgt-checkout-conv'})
MERGE (source)-[r:DEFINES {id: 'defines:pm-growth->tgt-checkout-conv'}]->(target)
SET r.type = 'defines';
MATCH (source:GovernanceNode {id: 'pm-growth'}), (target:GovernanceNode {id: 'tgt-onboarding-act'})
MERGE (source)-[r:DEFINES {id: 'defines:pm-growth->tgt-onboarding-act'}]->(target)
SET r.type = 'defines';
MATCH (source:GovernanceNode {id: 'pm-growth'}), (target:GovernanceNode {id: 'tgt-onboarding-churn'})
MERGE (source)-[r:DEFINES {id: 'defines:pm-growth->tgt-onboarding-churn'}]->(target)
SET r.type = 'defines';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::monitor-canary'}), (target:GovernanceNode {id: 'intent-checkout-stack::adapta-api'})
MERGE (source)-[r:DELIVERY_AFTER {id: 'delivery-after:intent-checkout-stack::monitor-canary->intent-checkout-stack::adapta-api'}]->(target)
SET r.type = 'delivery-after';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::monitor-canary'}), (target:GovernanceNode {id: 'intent-checkout-stack::porta-fluxo'})
MERGE (source)-[r:DELIVERY_AFTER {id: 'delivery-after:intent-checkout-stack::monitor-canary->intent-checkout-stack::porta-fluxo'}]->(target)
SET r.type = 'delivery-after';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::porta-fluxo'}), (target:GovernanceNode {id: 'intent-checkout-stack::componentes-ds'})
MERGE (source)-[r:DELIVERY_AFTER {id: 'delivery-after:intent-checkout-stack::porta-fluxo->intent-checkout-stack::componentes-ds'}]->(target)
SET r.type = 'delivery-after';
MATCH (source:GovernanceNode {id: 'intent-consent-center::propagar-base-legal'}), (target:GovernanceNode {id: 'intent-consent-center::central-consentimento'})
MERGE (source)-[r:DELIVERY_AFTER {id: 'delivery-after:intent-consent-center::propagar-base-legal->intent-consent-center::central-consentimento'}]->(target)
SET r.type = 'delivery-after';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::ui-cta'}), (target:GovernanceNode {id: 'intent-cta-upgrade::api-elegibilidade'})
MERGE (source)-[r:DELIVERY_AFTER {id: 'delivery-after:intent-cta-upgrade::ui-cta->intent-cta-upgrade::api-elegibilidade'}]->(target)
SET r.type = 'delivery-after';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice::chatbot-deflexao'}), (target:GovernanceNode {id: 'intent-help-selfservice::base-conhecimento'})
MERGE (source)-[r:DELIVERY_AFTER {id: 'delivery-after:intent-help-selfservice::chatbot-deflexao->intent-help-selfservice::base-conhecimento'}]->(target)
SET r.type = 'delivery-after';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening::cache-contexto'}), (target:GovernanceNode {id: 'intent-p99-hardening::guardrails-p99'})
MERGE (source)-[r:DELIVERY_AFTER {id: 'delivery-after:intent-p99-hardening::cache-contexto->intent-p99-hardening::guardrails-p99'}]->(target)
SET r.type = 'delivery-after';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening::timeouts-api'}), (target:GovernanceNode {id: 'intent-p99-hardening::guardrails-p99'})
MERGE (source)-[r:DELIVERY_AFTER {id: 'delivery-after:intent-p99-hardening::timeouts-api->intent-p99-hardening::guardrails-p99'}]->(target)
SET r.type = 'delivery-after';
MATCH (source:GovernanceNode {id: 'intent-consent-center'}), (target:GovernanceNode {id: 'intent-checkout-stack'})
MERGE (source)-[r:DEPENDS_ON {id: 'depends-on:intent-consent-center->intent-checkout-stack'}]->(target)
SET r.type = 'depends-on';
MATCH (source:GovernanceNode {id: 'fix-checkout-timeout'}), (target:GovernanceNode {id: 'out-fix-checkout-timeout-2027h1'})
MERGE (source)-[r:EMITS {id: 'emits:fix-checkout-timeout->out-fix-checkout-timeout-2027h1'}]->(target)
SET r.type = 'emits';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack'}), (target:GovernanceNode {id: 'out-checkout-stack-2027h2'})
MERGE (source)-[r:EMITS {id: 'emits:intent-checkout-stack->out-checkout-stack-2027h2'}]->(target)
SET r.type = 'emits';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade'}), (target:GovernanceNode {id: 'out-cta-upgrade-2027q1'})
MERGE (source)-[r:EMITS {id: 'emits:intent-cta-upgrade->out-cta-upgrade-2027q1'}]->(target)
SET r.type = 'emits';
MATCH (source:GovernanceNode {id: 'acme-analytics::contract::acme-events-schema'}), (target:GovernanceNode {id: 'acme-analytics::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:acme-analytics::contract::acme-events-schema->acme-analytics::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'acme-design-system::contract::acme-design-tokens'}), (target:GovernanceNode {id: 'acme-design-system::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:acme-design-system::contract::acme-design-tokens->acme-design-system::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'acme-web-host::contract::acme-user-context'}), (target:GovernanceNode {id: 'acme-web-host::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:acme-web-host::contract::acme-user-context->acme-web-host::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click::api-token-pagamento::repo-ack'}), (target:GovernanceNode {id: 'acme-checkout-api::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-checkout-1click::api-token-pagamento::repo-ack->acme-checkout-api::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click::baseline-1click::repo-ack'}), (target:GovernanceNode {id: 'acme-analytics::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-checkout-1click::baseline-1click::repo-ack->acme-analytics::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click::flag-1click::repo-ack'}), (target:GovernanceNode {id: 'acme-checkout::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-checkout-1click::flag-1click::repo-ack->acme-checkout::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::adapta-api::repo-ack'}), (target:GovernanceNode {id: 'acme-checkout-api::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-checkout-stack::adapta-api::repo-ack->acme-checkout-api::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::componentes-ds::repo-ack'}), (target:GovernanceNode {id: 'acme-design-system::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-checkout-stack::componentes-ds::repo-ack->acme-design-system::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::estrangula-pedidos::repo-ack'}), (target:GovernanceNode {id: 'acme-core-api::src/modules/orders.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-checkout-stack::estrangula-pedidos::repo-ack->acme-core-api::src/modules/orders.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::monitor-canary::repo-ack'}), (target:GovernanceNode {id: 'acme-obs-stack::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-checkout-stack::monitor-canary::repo-ack->acme-obs-stack::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::porta-fluxo::repo-ack'}), (target:GovernanceNode {id: 'acme-checkout::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-checkout-stack::porta-fluxo::repo-ack->acme-checkout::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::revisao-contrato::repo-ack'}), (target:GovernanceNode {id: 'acme-web-host::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-checkout-stack::revisao-contrato::repo-ack->acme-web-host::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::spike-carrinho::repo-ack'}), (target:GovernanceNode {id: 'acme-checkout::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-checkout-stack::spike-carrinho::repo-ack->acme-checkout::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-consent-center::central-consentimento::repo-ack'}), (target:GovernanceNode {id: 'acme-identity::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-consent-center::central-consentimento::repo-ack->acme-identity::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-consent-center::contexto-consentimento::repo-ack'}), (target:GovernanceNode {id: 'acme-web-host::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-consent-center::contexto-consentimento::repo-ack->acme-web-host::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-consent-center::propagar-base-legal::repo-ack'}), (target:GovernanceNode {id: 'acme-data-pipeline::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-consent-center::propagar-base-legal::repo-ack->acme-data-pipeline::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::api-elegibilidade::repo-ack'}), (target:GovernanceNode {id: 'acme-api-billing::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-cta-upgrade::api-elegibilidade::repo-ack->acme-api-billing::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::baseline-eventos::repo-ack'}), (target:GovernanceNode {id: 'acme-analytics::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-cta-upgrade::baseline-eventos::repo-ack->acme-analytics::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::contas-legadas::repo-ack'}), (target:GovernanceNode {id: 'acme-core-api::src/modules/accounts.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-cta-upgrade::contas-legadas::repo-ack->acme-core-api::src/modules/accounts.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::spike-elegibilidade::repo-ack'}), (target:GovernanceNode {id: 'acme-api-billing::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-cta-upgrade::spike-elegibilidade::repo-ack->acme-api-billing::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::ui-cta::repo-ack'}), (target:GovernanceNode {id: 'acme-mfe-billing::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-cta-upgrade::ui-cta::repo-ack->acme-mfe-billing::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice::base-conhecimento::repo-ack'}), (target:GovernanceNode {id: 'acme-help-center::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-help-selfservice::base-conhecimento::repo-ack->acme-help-center::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice::chatbot-deflexao::repo-ack'}), (target:GovernanceNode {id: 'acme-help-center::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-help-selfservice::chatbot-deflexao::repo-ack->acme-help-center::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice::eventos-deflexao::repo-ack'}), (target:GovernanceNode {id: 'acme-analytics::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-help-selfservice::eventos-deflexao::repo-ack->acme-analytics::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-onboarding-checklist::baseline-ativacao::repo-ack'}), (target:GovernanceNode {id: 'acme-analytics::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-onboarding-checklist::baseline-ativacao::repo-ack->acme-analytics::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-onboarding-checklist::flag-checklist::repo-ack'}), (target:GovernanceNode {id: 'acme-mfe-onboarding::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-onboarding-checklist::flag-checklist::repo-ack->acme-mfe-onboarding::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening::cache-contexto::repo-ack'}), (target:GovernanceNode {id: 'acme-web-host::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-p99-hardening::cache-contexto::repo-ack->acme-web-host::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening::guardrails-p99::repo-ack'}), (target:GovernanceNode {id: 'acme-obs-stack::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-p99-hardening::guardrails-p99::repo-ack->acme-obs-stack::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening::timeouts-api::repo-ack'}), (target:GovernanceNode {id: 'acme-checkout-api::src/index.mjs'})
MERGE (source)-[r:EVIDENCED_BY {id: 'evidenced-by:intent-p99-hardening::timeouts-api::repo-ack->acme-checkout-api::src/index.mjs'}]->(target)
SET r.type = 'evidenced-by';
MATCH (source:GovernanceNode {id: 'obj-efficiency'}), (target:GovernanceNode {id: 'tese-eficiencia'})
MERGE (source)-[r:FRAMED_BY {id: 'framed-by:obj-efficiency->tese-eficiencia'}]->(target)
SET r.type = 'framed-by';
MATCH (source:GovernanceNode {id: 'obj-efficiency'}), (target:GovernanceNode {id: 'tese-self-service'})
MERGE (source)-[r:FRAMED_BY {id: 'framed-by:obj-efficiency->tese-self-service'}]->(target)
SET r.type = 'framed-by';
MATCH (source:GovernanceNode {id: 'obj-retention'}), (target:GovernanceNode {id: 'tese-onboarding-retencao'})
MERGE (source)-[r:FRAMED_BY {id: 'framed-by:obj-retention->tese-onboarding-retencao'}]->(target)
SET r.type = 'framed-by';
MATCH (source:GovernanceNode {id: 'obj-retention'}), (target:GovernanceNode {id: 'tese-suporte-retencao'})
MERGE (source)-[r:FRAMED_BY {id: 'framed-by:obj-retention->tese-suporte-retencao'}]->(target)
SET r.type = 'framed-by';
MATCH (source:GovernanceNode {id: 'obj-revenue'}), (target:GovernanceNode {id: 'tese-cross-sell'})
MERGE (source)-[r:FRAMED_BY {id: 'framed-by:obj-revenue->tese-cross-sell'}]->(target)
SET r.type = 'framed-by';
MATCH (source:GovernanceNode {id: 'obj-revenue'}), (target:GovernanceNode {id: 'tese-pricing-anual'})
MERGE (source)-[r:FRAMED_BY {id: 'framed-by:obj-revenue->tese-pricing-anual'}]->(target)
SET r.type = 'framed-by';
MATCH (source:GovernanceNode {id: 'obj-trust'}), (target:GovernanceNode {id: 'tese-privacidade'})
MERGE (source)-[r:FRAMED_BY {id: 'framed-by:obj-trust->tese-privacidade'}]->(target)
SET r.type = 'framed-by';
MATCH (source:GovernanceNode {id: 'acme-checkout-api'}), (target:GovernanceNode {id: 'incidente-checkout'})
MERGE (source)-[r:HANDLES_INCIDENT {id: 'handles-incident:acme-checkout-api->incidente-checkout'}]->(target)
SET r.type = 'handles-incident';
MATCH (source:GovernanceNode {id: 'acme-core-api'}), (target:GovernanceNode {id: 'acme-core-api#mod-accounts'})
MERGE (source)-[r:HAS_MODULE {id: 'has-module:acme-core-api->acme-core-api#mod-accounts'}]->(target)
SET r.type = 'has-module';
MATCH (source:GovernanceNode {id: 'acme-core-api'}), (target:GovernanceNode {id: 'acme-core-api#mod-billing'})
MERGE (source)-[r:HAS_MODULE {id: 'has-module:acme-core-api->acme-core-api#mod-billing'}]->(target)
SET r.type = 'has-module';
MATCH (source:GovernanceNode {id: 'acme-core-api'}), (target:GovernanceNode {id: 'acme-core-api#mod-orders'})
MERGE (source)-[r:HAS_MODULE {id: 'has-module:acme-core-api->acme-core-api#mod-orders'}]->(target)
SET r.type = 'has-module';
MATCH (source:GovernanceNode {id: 'acme-core-api'}), (target:GovernanceNode {id: 'acme-core-api#mod-reports'})
MERGE (source)-[r:HAS_MODULE {id: 'has-module:acme-core-api->acme-core-api#mod-reports'}]->(target)
SET r.type = 'has-module';
MATCH (source:GovernanceNode {id: 'acme-user-context'}), (target:GovernanceNode {id: 'acme-user-context::acme-user-context-v4-coordenada'})
MERGE (source)-[r:HAS_REVISION_PROPOSAL {id: 'has-revision-proposal:acme-user-context->acme-user-context::acme-user-context-v4-coordenada'}]->(target)
SET r.type = 'has-revision-proposal';
MATCH (source:GovernanceNode {id: 'time-billing'}), (target:GovernanceNode {id: 'tgt-billing-conv'})
MERGE (source)-[r:HAS_TARGET {id: 'has-target:time-billing->tgt-billing-conv'}]->(target)
SET r.type = 'has-target';
MATCH (source:GovernanceNode {id: 'time-checkout'}), (target:GovernanceNode {id: 'tgt-checkout-conv'})
MERGE (source)-[r:HAS_TARGET {id: 'has-target:time-checkout->tgt-checkout-conv'}]->(target)
SET r.type = 'has-target';
MATCH (source:GovernanceNode {id: 'time-checkout'}), (target:GovernanceNode {id: 'tgt-checkout-stack'})
MERGE (source)-[r:HAS_TARGET {id: 'has-target:time-checkout->tgt-checkout-stack'}]->(target)
SET r.type = 'has-target';
MATCH (source:GovernanceNode {id: 'time-data'}), (target:GovernanceNode {id: 'tgt-data-cost'})
MERGE (source)-[r:HAS_TARGET {id: 'has-target:time-data->tgt-data-cost'}]->(target)
SET r.type = 'has-target';
MATCH (source:GovernanceNode {id: 'time-identity'}), (target:GovernanceNode {id: 'tgt-identity-consent'})
MERGE (source)-[r:HAS_TARGET {id: 'has-target:time-identity->tgt-identity-consent'}]->(target)
SET r.type = 'has-target';
MATCH (source:GovernanceNode {id: 'time-onboarding'}), (target:GovernanceNode {id: 'tgt-onboarding-act'})
MERGE (source)-[r:HAS_TARGET {id: 'has-target:time-onboarding->tgt-onboarding-act'}]->(target)
SET r.type = 'has-target';
MATCH (source:GovernanceNode {id: 'time-onboarding'}), (target:GovernanceNode {id: 'tgt-onboarding-churn'})
MERGE (source)-[r:HAS_TARGET {id: 'has-target:time-onboarding->tgt-onboarding-churn'}]->(target)
SET r.type = 'has-target';
MATCH (source:GovernanceNode {id: 'time-sre'}), (target:GovernanceNode {id: 'tgt-sre-incidents'})
MERGE (source)-[r:HAS_TARGET {id: 'has-target:time-sre->tgt-sre-incidents'}]->(target)
SET r.type = 'has-target';
MATCH (source:GovernanceNode {id: 'time-sre'}), (target:GovernanceNode {id: 'tgt-sre-p99'})
MERGE (source)-[r:HAS_TARGET {id: 'has-target:time-sre->tgt-sre-p99'}]->(target)
SET r.type = 'has-target';
MATCH (source:GovernanceNode {id: 'time-support'}), (target:GovernanceNode {id: 'tgt-support-churn'})
MERGE (source)-[r:HAS_TARGET {id: 'has-target:time-support->tgt-support-churn'}]->(target)
SET r.type = 'has-target';
MATCH (source:GovernanceNode {id: 'time-support'}), (target:GovernanceNode {id: 'tgt-support-cost'})
MERGE (source)-[r:HAS_TARGET {id: 'has-target:time-support->tgt-support-cost'}]->(target)
SET r.type = 'has-target';
MATCH (source:GovernanceNode {id: 'area-cx'}), (target:GovernanceNode {id: 'time-support'})
MERGE (source)-[r:HAS_TEAM {id: 'has-team:area-cx->time-support'}]->(target)
SET r.type = 'has-team';
MATCH (source:GovernanceNode {id: 'area-growth'}), (target:GovernanceNode {id: 'time-billing'})
MERGE (source)-[r:HAS_TEAM {id: 'has-team:area-growth->time-billing'}]->(target)
SET r.type = 'has-team';
MATCH (source:GovernanceNode {id: 'area-growth'}), (target:GovernanceNode {id: 'time-onboarding'})
MERGE (source)-[r:HAS_TEAM {id: 'has-team:area-growth->time-onboarding'}]->(target)
SET r.type = 'has-team';
MATCH (source:GovernanceNode {id: 'area-platform'}), (target:GovernanceNode {id: 'time-checkout'})
MERGE (source)-[r:HAS_TEAM {id: 'has-team:area-platform->time-checkout'}]->(target)
SET r.type = 'has-team';
MATCH (source:GovernanceNode {id: 'area-platform'}), (target:GovernanceNode {id: 'time-data'})
MERGE (source)-[r:HAS_TEAM {id: 'has-team:area-platform->time-data'}]->(target)
SET r.type = 'has-team';
MATCH (source:GovernanceNode {id: 'area-platform'}), (target:GovernanceNode {id: 'time-identity'})
MERGE (source)-[r:HAS_TEAM {id: 'has-team:area-platform->time-identity'}]->(target)
SET r.type = 'has-team';
MATCH (source:GovernanceNode {id: 'area-platform'}), (target:GovernanceNode {id: 'time-sre'})
MERGE (source)-[r:HAS_TEAM {id: 'has-team:area-platform->time-sre'}]->(target)
SET r.type = 'has-team';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade'}), (target:GovernanceNode {id: 'verdict-cta-upgrade-2027q1'})
MERGE (source)-[r:HAS_VERDICT {id: 'has-verdict:intent-cta-upgrade->verdict-cta-upgrade-2027q1'}]->(target)
SET r.type = 'has-verdict';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::estrangula-pedidos'}), (target:GovernanceNode {id: 'acme-core-api#mod-orders'})
MERGE (source)-[r:IN_MODULE {id: 'in-module:intent-checkout-stack::estrangula-pedidos->acme-core-api#mod-orders'}]->(target)
SET r.type = 'in-module';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::contas-legadas'}), (target:GovernanceNode {id: 'acme-core-api#mod-accounts'})
MERGE (source)-[r:IN_MODULE {id: 'in-module:intent-cta-upgrade::contas-legadas->acme-core-api#mod-accounts'}]->(target)
SET r.type = 'in-module';
MATCH (source:GovernanceNode {id: 'bug-frete'}), (target:GovernanceNode {id: 'acme-checkout'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:bug-frete->acme-checkout'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'dep-bump-host'}), (target:GovernanceNode {id: 'acme-web-host'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:dep-bump-host->acme-web-host'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'fix-checkout-timeout'}), (target:GovernanceNode {id: 'acme-checkout-api'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:fix-checkout-timeout->acme-checkout-api'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click::api-token-pagamento'}), (target:GovernanceNode {id: 'acme-checkout-api'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-checkout-1click::api-token-pagamento->acme-checkout-api'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click::baseline-1click'}), (target:GovernanceNode {id: 'acme-analytics'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-checkout-1click::baseline-1click->acme-analytics'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click::flag-1click'}), (target:GovernanceNode {id: 'acme-checkout'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-checkout-1click::flag-1click->acme-checkout'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::adapta-api'}), (target:GovernanceNode {id: 'acme-checkout-api'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-checkout-stack::adapta-api->acme-checkout-api'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::componentes-ds'}), (target:GovernanceNode {id: 'acme-design-system'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-checkout-stack::componentes-ds->acme-design-system'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::estrangula-pedidos'}), (target:GovernanceNode {id: 'acme-core-api'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-checkout-stack::estrangula-pedidos->acme-core-api'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::monitor-canary'}), (target:GovernanceNode {id: 'acme-obs-stack'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-checkout-stack::monitor-canary->acme-obs-stack'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::porta-fluxo'}), (target:GovernanceNode {id: 'acme-checkout'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-checkout-stack::porta-fluxo->acme-checkout'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::revisao-contrato'}), (target:GovernanceNode {id: 'acme-web-host'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-checkout-stack::revisao-contrato->acme-web-host'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack::spike-carrinho'}), (target:GovernanceNode {id: 'acme-checkout'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-checkout-stack::spike-carrinho->acme-checkout'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-consent-center::central-consentimento'}), (target:GovernanceNode {id: 'acme-identity'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-consent-center::central-consentimento->acme-identity'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-consent-center::contexto-consentimento'}), (target:GovernanceNode {id: 'acme-web-host'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-consent-center::contexto-consentimento->acme-web-host'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-consent-center::propagar-base-legal'}), (target:GovernanceNode {id: 'acme-data-pipeline'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-consent-center::propagar-base-legal->acme-data-pipeline'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::api-elegibilidade'}), (target:GovernanceNode {id: 'acme-api-billing'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-cta-upgrade::api-elegibilidade->acme-api-billing'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::baseline-eventos'}), (target:GovernanceNode {id: 'acme-analytics'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-cta-upgrade::baseline-eventos->acme-analytics'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::contas-legadas'}), (target:GovernanceNode {id: 'acme-core-api'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-cta-upgrade::contas-legadas->acme-core-api'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::spike-elegibilidade'}), (target:GovernanceNode {id: 'acme-api-billing'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-cta-upgrade::spike-elegibilidade->acme-api-billing'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade::ui-cta'}), (target:GovernanceNode {id: 'acme-mfe-billing'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-cta-upgrade::ui-cta->acme-mfe-billing'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice::base-conhecimento'}), (target:GovernanceNode {id: 'acme-help-center'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-help-selfservice::base-conhecimento->acme-help-center'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice::chatbot-deflexao'}), (target:GovernanceNode {id: 'acme-help-center'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-help-selfservice::chatbot-deflexao->acme-help-center'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice::eventos-deflexao'}), (target:GovernanceNode {id: 'acme-analytics'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-help-selfservice::eventos-deflexao->acme-analytics'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-onboarding-checklist::baseline-ativacao'}), (target:GovernanceNode {id: 'acme-analytics'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-onboarding-checklist::baseline-ativacao->acme-analytics'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-onboarding-checklist::flag-checklist'}), (target:GovernanceNode {id: 'acme-mfe-onboarding'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-onboarding-checklist::flag-checklist->acme-mfe-onboarding'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening::cache-contexto'}), (target:GovernanceNode {id: 'acme-web-host'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-p99-hardening::cache-contexto->acme-web-host'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening::guardrails-p99'}), (target:GovernanceNode {id: 'acme-obs-stack'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-p99-hardening::guardrails-p99->acme-obs-stack'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening::timeouts-api'}), (target:GovernanceNode {id: 'acme-checkout-api'})
MERGE (source)-[r:IN_REPO {id: 'in-repo:intent-p99-hardening::timeouts-api->acme-checkout-api'}]->(target)
SET r.type = 'in-repo';
MATCH (source:GovernanceNode {id: 'tese-cross-sell'}), (target:GovernanceNode {id: 'intent-checkout-1click'})
MERGE (source)-[r:INFORMS {id: 'informs:tese-cross-sell->intent-checkout-1click'}]->(target)
SET r.type = 'informs';
MATCH (source:GovernanceNode {id: 'tese-cross-sell'}), (target:GovernanceNode {id: 'intent-cta-upgrade'})
MERGE (source)-[r:INFORMS {id: 'informs:tese-cross-sell->intent-cta-upgrade'}]->(target)
SET r.type = 'informs';
MATCH (source:GovernanceNode {id: 'tese-eficiencia'}), (target:GovernanceNode {id: 'intent-checkout-stack'})
MERGE (source)-[r:INFORMS {id: 'informs:tese-eficiencia->intent-checkout-stack'}]->(target)
SET r.type = 'informs';
MATCH (source:GovernanceNode {id: 'tese-onboarding-retencao'}), (target:GovernanceNode {id: 'intent-onboarding-checklist'})
MERGE (source)-[r:INFORMS {id: 'informs:tese-onboarding-retencao->intent-onboarding-checklist'}]->(target)
SET r.type = 'informs';
MATCH (source:GovernanceNode {id: 'tese-privacidade'}), (target:GovernanceNode {id: 'intent-consent-center'})
MERGE (source)-[r:INFORMS {id: 'informs:tese-privacidade->intent-consent-center'}]->(target)
SET r.type = 'informs';
MATCH (source:GovernanceNode {id: 'tese-self-service'}), (target:GovernanceNode {id: 'intent-help-selfservice'})
MERGE (source)-[r:INFORMS {id: 'informs:tese-self-service->intent-help-selfservice'}]->(target)
SET r.type = 'informs';
MATCH (source:GovernanceNode {id: 'out-checkout-stack-2027h2'}), (target:GovernanceNode {id: 'cost-to-serve'})
MERGE (source)-[r:MEASURES {id: 'measures:out-checkout-stack-2027h2->cost-to-serve'}]->(target)
SET r.type = 'measures';
MATCH (source:GovernanceNode {id: 'out-cta-upgrade-2027q1'}), (target:GovernanceNode {id: 'conversion-rate'})
MERGE (source)-[r:MEASURES {id: 'measures:out-cta-upgrade-2027q1->conversion-rate'}]->(target)
SET r.type = 'measures';
MATCH (source:GovernanceNode {id: 'out-fix-checkout-timeout-2027h1'}), (target:GovernanceNode {id: 'incident-count'})
MERGE (source)-[r:MEASURES {id: 'measures:out-fix-checkout-timeout-2027h1->incident-count'}]->(target)
SET r.type = 'measures';
MATCH (source:GovernanceNode {id: 'area-platform'}), (target:GovernanceNode {id: 'acme-core-api'})
MERGE (source)-[r:OWNS {id: 'owns:area-platform->acme-core-api'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'area-platform'}), (target:GovernanceNode {id: 'acme-design-system'})
MERGE (source)-[r:OWNS {id: 'owns:area-platform->acme-design-system'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'area-platform'}), (target:GovernanceNode {id: 'acme-web-host'})
MERGE (source)-[r:OWNS {id: 'owns:area-platform->acme-web-host'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-billing'}), (target:GovernanceNode {id: 'acme-api-billing'})
MERGE (source)-[r:OWNS {id: 'owns:time-billing->acme-api-billing'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-billing'}), (target:GovernanceNode {id: 'acme-core-api#mod-billing'})
MERGE (source)-[r:OWNS {id: 'owns:time-billing->acme-core-api#mod-billing'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-billing'}), (target:GovernanceNode {id: 'acme-mfe-billing'})
MERGE (source)-[r:OWNS {id: 'owns:time-billing->acme-mfe-billing'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-checkout'}), (target:GovernanceNode {id: 'acme-checkout'})
MERGE (source)-[r:OWNS {id: 'owns:time-checkout->acme-checkout'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-checkout'}), (target:GovernanceNode {id: 'acme-checkout-api'})
MERGE (source)-[r:OWNS {id: 'owns:time-checkout->acme-checkout-api'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-checkout'}), (target:GovernanceNode {id: 'acme-core-api#mod-orders'})
MERGE (source)-[r:OWNS {id: 'owns:time-checkout->acme-core-api#mod-orders'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-data'}), (target:GovernanceNode {id: 'acme-analytics'})
MERGE (source)-[r:OWNS {id: 'owns:time-data->acme-analytics'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-data'}), (target:GovernanceNode {id: 'acme-core-api#mod-reports'})
MERGE (source)-[r:OWNS {id: 'owns:time-data->acme-core-api#mod-reports'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-data'}), (target:GovernanceNode {id: 'acme-data-pipeline'})
MERGE (source)-[r:OWNS {id: 'owns:time-data->acme-data-pipeline'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-identity'}), (target:GovernanceNode {id: 'acme-core-api#mod-accounts'})
MERGE (source)-[r:OWNS {id: 'owns:time-identity->acme-core-api#mod-accounts'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-identity'}), (target:GovernanceNode {id: 'acme-identity'})
MERGE (source)-[r:OWNS {id: 'owns:time-identity->acme-identity'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-onboarding'}), (target:GovernanceNode {id: 'acme-mfe-onboarding'})
MERGE (source)-[r:OWNS {id: 'owns:time-onboarding->acme-mfe-onboarding'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-sre'}), (target:GovernanceNode {id: 'acme-obs-stack'})
MERGE (source)-[r:OWNS {id: 'owns:time-sre->acme-obs-stack'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'time-support'}), (target:GovernanceNode {id: 'acme-help-center'})
MERGE (source)-[r:OWNS {id: 'owns:time-support->acme-help-center'}]->(target)
SET r.type = 'owns';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click'}), (target:GovernanceNode {id: 'intent-checkout-1click::api-token-pagamento'})
MERGE (source)-[r:PIECE {id: 'piece:intent-checkout-1click->intent-checkout-1click::api-token-pagamento'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click'}), (target:GovernanceNode {id: 'intent-checkout-1click::baseline-1click'})
MERGE (source)-[r:PIECE {id: 'piece:intent-checkout-1click->intent-checkout-1click::baseline-1click'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click'}), (target:GovernanceNode {id: 'intent-checkout-1click::flag-1click'})
MERGE (source)-[r:PIECE {id: 'piece:intent-checkout-1click->intent-checkout-1click::flag-1click'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack'}), (target:GovernanceNode {id: 'intent-checkout-stack::adapta-api'})
MERGE (source)-[r:PIECE {id: 'piece:intent-checkout-stack->intent-checkout-stack::adapta-api'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack'}), (target:GovernanceNode {id: 'intent-checkout-stack::componentes-ds'})
MERGE (source)-[r:PIECE {id: 'piece:intent-checkout-stack->intent-checkout-stack::componentes-ds'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack'}), (target:GovernanceNode {id: 'intent-checkout-stack::estrangula-pedidos'})
MERGE (source)-[r:PIECE {id: 'piece:intent-checkout-stack->intent-checkout-stack::estrangula-pedidos'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack'}), (target:GovernanceNode {id: 'intent-checkout-stack::monitor-canary'})
MERGE (source)-[r:PIECE {id: 'piece:intent-checkout-stack->intent-checkout-stack::monitor-canary'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack'}), (target:GovernanceNode {id: 'intent-checkout-stack::porta-fluxo'})
MERGE (source)-[r:PIECE {id: 'piece:intent-checkout-stack->intent-checkout-stack::porta-fluxo'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack'}), (target:GovernanceNode {id: 'intent-checkout-stack::revisao-contrato'})
MERGE (source)-[r:PIECE {id: 'piece:intent-checkout-stack->intent-checkout-stack::revisao-contrato'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack'}), (target:GovernanceNode {id: 'intent-checkout-stack::spike-carrinho'})
MERGE (source)-[r:PIECE {id: 'piece:intent-checkout-stack->intent-checkout-stack::spike-carrinho'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-consent-center'}), (target:GovernanceNode {id: 'intent-consent-center::central-consentimento'})
MERGE (source)-[r:PIECE {id: 'piece:intent-consent-center->intent-consent-center::central-consentimento'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-consent-center'}), (target:GovernanceNode {id: 'intent-consent-center::contexto-consentimento'})
MERGE (source)-[r:PIECE {id: 'piece:intent-consent-center->intent-consent-center::contexto-consentimento'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-consent-center'}), (target:GovernanceNode {id: 'intent-consent-center::propagar-base-legal'})
MERGE (source)-[r:PIECE {id: 'piece:intent-consent-center->intent-consent-center::propagar-base-legal'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade'}), (target:GovernanceNode {id: 'intent-cta-upgrade::api-elegibilidade'})
MERGE (source)-[r:PIECE {id: 'piece:intent-cta-upgrade->intent-cta-upgrade::api-elegibilidade'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade'}), (target:GovernanceNode {id: 'intent-cta-upgrade::baseline-eventos'})
MERGE (source)-[r:PIECE {id: 'piece:intent-cta-upgrade->intent-cta-upgrade::baseline-eventos'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade'}), (target:GovernanceNode {id: 'intent-cta-upgrade::contas-legadas'})
MERGE (source)-[r:PIECE {id: 'piece:intent-cta-upgrade->intent-cta-upgrade::contas-legadas'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade'}), (target:GovernanceNode {id: 'intent-cta-upgrade::spike-elegibilidade'})
MERGE (source)-[r:PIECE {id: 'piece:intent-cta-upgrade->intent-cta-upgrade::spike-elegibilidade'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade'}), (target:GovernanceNode {id: 'intent-cta-upgrade::ui-cta'})
MERGE (source)-[r:PIECE {id: 'piece:intent-cta-upgrade->intent-cta-upgrade::ui-cta'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice'}), (target:GovernanceNode {id: 'intent-help-selfservice::base-conhecimento'})
MERGE (source)-[r:PIECE {id: 'piece:intent-help-selfservice->intent-help-selfservice::base-conhecimento'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice'}), (target:GovernanceNode {id: 'intent-help-selfservice::chatbot-deflexao'})
MERGE (source)-[r:PIECE {id: 'piece:intent-help-selfservice->intent-help-selfservice::chatbot-deflexao'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice'}), (target:GovernanceNode {id: 'intent-help-selfservice::eventos-deflexao'})
MERGE (source)-[r:PIECE {id: 'piece:intent-help-selfservice->intent-help-selfservice::eventos-deflexao'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-onboarding-checklist'}), (target:GovernanceNode {id: 'intent-onboarding-checklist::baseline-ativacao'})
MERGE (source)-[r:PIECE {id: 'piece:intent-onboarding-checklist->intent-onboarding-checklist::baseline-ativacao'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-onboarding-checklist'}), (target:GovernanceNode {id: 'intent-onboarding-checklist::flag-checklist'})
MERGE (source)-[r:PIECE {id: 'piece:intent-onboarding-checklist->intent-onboarding-checklist::flag-checklist'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening'}), (target:GovernanceNode {id: 'intent-p99-hardening::cache-contexto'})
MERGE (source)-[r:PIECE {id: 'piece:intent-p99-hardening->intent-p99-hardening::cache-contexto'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening'}), (target:GovernanceNode {id: 'intent-p99-hardening::guardrails-p99'})
MERGE (source)-[r:PIECE {id: 'piece:intent-p99-hardening->intent-p99-hardening::guardrails-p99'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening'}), (target:GovernanceNode {id: 'intent-p99-hardening::timeouts-api'})
MERGE (source)-[r:PIECE {id: 'piece:intent-p99-hardening->intent-p99-hardening::timeouts-api'}]->(target)
SET r.type = 'piece';
MATCH (source:GovernanceNode {id: 'intent-checkout-1click'}), (target:GovernanceNode {id: 'tgt-checkout-conv'})
MERGE (source)-[r:PRIMARY_TARGET {id: 'primary-target:intent-checkout-1click->tgt-checkout-conv'}]->(target)
SET r.type = 'primary-target';
MATCH (source:GovernanceNode {id: 'intent-checkout-stack'}), (target:GovernanceNode {id: 'tgt-checkout-stack'})
MERGE (source)-[r:PRIMARY_TARGET {id: 'primary-target:intent-checkout-stack->tgt-checkout-stack'}]->(target)
SET r.type = 'primary-target';
MATCH (source:GovernanceNode {id: 'intent-consent-center'}), (target:GovernanceNode {id: 'tgt-identity-consent'})
MERGE (source)-[r:PRIMARY_TARGET {id: 'primary-target:intent-consent-center->tgt-identity-consent'}]->(target)
SET r.type = 'primary-target';
MATCH (source:GovernanceNode {id: 'intent-cta-upgrade'}), (target:GovernanceNode {id: 'tgt-billing-conv'})
MERGE (source)-[r:PRIMARY_TARGET {id: 'primary-target:intent-cta-upgrade->tgt-billing-conv'}]->(target)
SET r.type = 'primary-target';
MATCH (source:GovernanceNode {id: 'intent-help-selfservice'}), (target:GovernanceNode {id: 'tgt-support-cost'})
MERGE (source)-[r:PRIMARY_TARGET {id: 'primary-target:intent-help-selfservice->tgt-support-cost'}]->(target)
SET r.type = 'primary-target';
MATCH (source:GovernanceNode {id: 'intent-onboarding-checklist'}), (target:GovernanceNode {id: 'tgt-onboarding-churn'})
MERGE (source)-[r:PRIMARY_TARGET {id: 'primary-target:intent-onboarding-checklist->tgt-onboarding-churn'}]->(target)
SET r.type = 'primary-target';
MATCH (source:GovernanceNode {id: 'intent-p99-hardening'}), (target:GovernanceNode {id: 'tgt-sre-p99'})
MERGE (source)-[r:PRIMARY_TARGET {id: 'primary-target:intent-p99-hardening->tgt-sre-p99'}]->(target)
SET r.type = 'primary-target';
MATCH (source:GovernanceNode {id: 'prop-checkout-hardening'}), (target:GovernanceNode {id: 'tgt-sre-incidents'})
MERGE (source)-[r:PROPOSES_FOR {id: 'proposes-for:prop-checkout-hardening->tgt-sre-incidents'}]->(target)
SET r.type = 'proposes-for';
MATCH (source:GovernanceNode {id: 'acme-analytics'}), (target:GovernanceNode {id: 'acme-analytics::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-analytics->acme-analytics::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-api-billing'}), (target:GovernanceNode {id: 'acme-api-billing::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-api-billing->acme-api-billing::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-checkout'}), (target:GovernanceNode {id: 'acme-checkout::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-checkout->acme-checkout::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-checkout-api'}), (target:GovernanceNode {id: 'acme-checkout-api::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-checkout-api->acme-checkout-api::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-core-api'}), (target:GovernanceNode {id: 'acme-core-api::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-core-api->acme-core-api::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-data-pipeline'}), (target:GovernanceNode {id: 'acme-data-pipeline::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-data-pipeline->acme-data-pipeline::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-design-system'}), (target:GovernanceNode {id: 'acme-design-system::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-design-system->acme-design-system::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-help-center'}), (target:GovernanceNode {id: 'acme-help-center::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-help-center->acme-help-center::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-identity'}), (target:GovernanceNode {id: 'acme-identity::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-identity->acme-identity::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-mfe-billing'}), (target:GovernanceNode {id: 'acme-mfe-billing::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-mfe-billing->acme-mfe-billing::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-mfe-onboarding'}), (target:GovernanceNode {id: 'acme-mfe-onboarding::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-mfe-onboarding->acme-mfe-onboarding::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-obs-stack'}), (target:GovernanceNode {id: 'acme-obs-stack::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-obs-stack->acme-obs-stack::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-web-host'}), (target:GovernanceNode {id: 'acme-web-host::context'})
MERGE (source)-[r:PUBLISHES_CONTEXT {id: 'publishes-context:acme-web-host->acme-web-host::context'}]->(target)
SET r.type = 'publishes-context';
MATCH (source:GovernanceNode {id: 'acme-analytics'}), (target:GovernanceNode {id: 'acme-analytics::contract::acme-events-schema'})
MERGE (source)-[r:PUBLISHES_CONTRACT_REGISTRY {id: 'publishes-contract-registry:acme-analytics->acme-analytics::contract::acme-events-schema'}]->(target)
SET r.type = 'publishes-contract-registry';
MATCH (source:GovernanceNode {id: 'acme-design-system'}), (target:GovernanceNode {id: 'acme-design-system::contract::acme-design-tokens'})
MERGE (source)-[r:PUBLISHES_CONTRACT_REGISTRY {id: 'publishes-contract-registry:acme-design-system->acme-design-system::contract::acme-design-tokens'}]->(target)
SET r.type = 'publishes-contract-registry';
MATCH (source:GovernanceNode {id: 'acme-web-host'}), (target:GovernanceNode {id: 'acme-web-host::contract::acme-user-context'})
MERGE (source)-[r:PUBLISHES_CONTRACT_REGISTRY {id: 'publishes-contract-registry:acme-web-host->acme-web-host::contract::acme-user-context'}]->(target)
SET r.type = 'publishes-contract-registry';
MATCH (source:GovernanceNode {id: 'acme-analytics'}), (target:GovernanceNode {id: 'intent-checkout-1click::baseline-1click::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-analytics->intent-checkout-1click::baseline-1click::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-analytics'}), (target:GovernanceNode {id: 'intent-cta-upgrade::baseline-eventos::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-analytics->intent-cta-upgrade::baseline-eventos::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-analytics'}), (target:GovernanceNode {id: 'intent-help-selfservice::eventos-deflexao::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-analytics->intent-help-selfservice::eventos-deflexao::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-analytics'}), (target:GovernanceNode {id: 'intent-onboarding-checklist::baseline-ativacao::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-analytics->intent-onboarding-checklist::baseline-ativacao::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-api-billing'}), (target:GovernanceNode {id: 'intent-cta-upgrade::api-elegibilidade::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-api-billing->intent-cta-upgrade::api-elegibilidade::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-api-billing'}), (target:GovernanceNode {id: 'intent-cta-upgrade::spike-elegibilidade::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-api-billing->intent-cta-upgrade::spike-elegibilidade::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-checkout'}), (target:GovernanceNode {id: 'intent-checkout-1click::flag-1click::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-checkout->intent-checkout-1click::flag-1click::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-checkout'}), (target:GovernanceNode {id: 'intent-checkout-stack::porta-fluxo::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-checkout->intent-checkout-stack::porta-fluxo::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-checkout'}), (target:GovernanceNode {id: 'intent-checkout-stack::spike-carrinho::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-checkout->intent-checkout-stack::spike-carrinho::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-checkout-api'}), (target:GovernanceNode {id: 'intent-checkout-1click::api-token-pagamento::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-checkout-api->intent-checkout-1click::api-token-pagamento::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-checkout-api'}), (target:GovernanceNode {id: 'intent-checkout-stack::adapta-api::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-checkout-api->intent-checkout-stack::adapta-api::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-checkout-api'}), (target:GovernanceNode {id: 'intent-p99-hardening::timeouts-api::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-checkout-api->intent-p99-hardening::timeouts-api::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-core-api'}), (target:GovernanceNode {id: 'intent-checkout-stack::estrangula-pedidos::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-core-api->intent-checkout-stack::estrangula-pedidos::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-core-api'}), (target:GovernanceNode {id: 'intent-cta-upgrade::contas-legadas::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-core-api->intent-cta-upgrade::contas-legadas::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-data-pipeline'}), (target:GovernanceNode {id: 'intent-consent-center::propagar-base-legal::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-data-pipeline->intent-consent-center::propagar-base-legal::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-design-system'}), (target:GovernanceNode {id: 'intent-checkout-stack::componentes-ds::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-design-system->intent-checkout-stack::componentes-ds::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-help-center'}), (target:GovernanceNode {id: 'intent-help-selfservice::base-conhecimento::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-help-center->intent-help-selfservice::base-conhecimento::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-help-center'}), (target:GovernanceNode {id: 'intent-help-selfservice::chatbot-deflexao::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-help-center->intent-help-selfservice::chatbot-deflexao::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-identity'}), (target:GovernanceNode {id: 'intent-consent-center::central-consentimento::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-identity->intent-consent-center::central-consentimento::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-mfe-billing'}), (target:GovernanceNode {id: 'intent-cta-upgrade::ui-cta::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-mfe-billing->intent-cta-upgrade::ui-cta::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-mfe-onboarding'}), (target:GovernanceNode {id: 'intent-onboarding-checklist::flag-checklist::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-mfe-onboarding->intent-onboarding-checklist::flag-checklist::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-obs-stack'}), (target:GovernanceNode {id: 'intent-checkout-stack::monitor-canary::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-obs-stack->intent-checkout-stack::monitor-canary::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-obs-stack'}), (target:GovernanceNode {id: 'intent-p99-hardening::guardrails-p99::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-obs-stack->intent-p99-hardening::guardrails-p99::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-web-host'}), (target:GovernanceNode {id: 'intent-checkout-stack::revisao-contrato::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-web-host->intent-checkout-stack::revisao-contrato::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-web-host'}), (target:GovernanceNode {id: 'intent-consent-center::contexto-consentimento::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-web-host->intent-consent-center::contexto-consentimento::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-web-host'}), (target:GovernanceNode {id: 'intent-p99-hardening::cache-contexto::repo-ack'})
MERGE (source)-[r:PUBLISHES_WORK {id: 'publishes-work:acme-web-host->intent-p99-hardening::cache-contexto::repo-ack'}]->(target)
SET r.type = 'publishes-work';
MATCH (source:GovernanceNode {id: 'acme-analytics'}), (target:GovernanceNode {id: 'acme-events-schema'})
MERGE (source)-[r:PUBLISHES {id: 'publishes:acme-analytics->acme-events-schema'}]->(target)
SET r.type = 'publishes';
MATCH (source:GovernanceNode {id: 'acme-design-system'}), (target:GovernanceNode {id: 'acme-design-tokens'})
MERGE (source)-[r:PUBLISHES {id: 'publishes:acme-design-system->acme-design-tokens'}]->(target)
SET r.type = 'publishes';
MATCH (source:GovernanceNode {id: 'acme-web-host'}), (target:GovernanceNode {id: 'acme-user-context'})
MERGE (source)-[r:PUBLISHES {id: 'publishes:acme-web-host->acme-user-context'}]->(target)
SET r.type = 'publishes';
MATCH (source:GovernanceNode {id: 'incidente-checkout'}), (target:GovernanceNode {id: 'fix-checkout-timeout'})
MERGE (source)-[r:RAISES {id: 'raises:incidente-checkout->fix-checkout-timeout'}]->(target)
SET r.type = 'raises';
MATCH (source:GovernanceNode {id: 'incidente-checkout'}), (target:GovernanceNode {id: 'prop-checkout-hardening'})
MERGE (source)-[r:RAISES {id: 'raises:incidente-checkout->prop-checkout-hardening'}]->(target)
SET r.type = 'raises';
MATCH (source:GovernanceNode {id: 'origin:bug-frete'}), (target:GovernanceNode {id: 'bug-frete'})
MERGE (source)-[r:RAISES {id: 'raises:origin:bug-frete->bug-frete'}]->(target)
SET r.type = 'raises';
MATCH (source:GovernanceNode {id: 'origin:dep-bump-host'}), (target:GovernanceNode {id: 'dep-bump-host'})
MERGE (source)-[r:RAISES {id: 'raises:origin:dep-bump-host->dep-bump-host'}]->(target)
SET r.type = 'raises';
MATCH (source:GovernanceNode {id: 'lead-billing'}), (target:GovernanceNode {id: 'req-billing-read-own-context'})
MERGE (source)-[r:REQUESTS {id: 'requests:lead-billing->req-billing-read-own-context'}]->(target)
SET r.type = 'requests';
MATCH (source:GovernanceNode {id: 'time-billing'}), (target:GovernanceNode {id: 'intent-cta-upgrade'})
MERGE (source)-[r:RUNS {id: 'runs:time-billing->intent-cta-upgrade'}]->(target)
SET r.type = 'runs';
MATCH (source:GovernanceNode {id: 'time-checkout'}), (target:GovernanceNode {id: 'intent-checkout-1click'})
MERGE (source)-[r:RUNS {id: 'runs:time-checkout->intent-checkout-1click'}]->(target)
SET r.type = 'runs';
MATCH (source:GovernanceNode {id: 'time-checkout'}), (target:GovernanceNode {id: 'intent-checkout-stack'})
MERGE (source)-[r:RUNS {id: 'runs:time-checkout->intent-checkout-stack'}]->(target)
SET r.type = 'runs';
MATCH (source:GovernanceNode {id: 'time-identity'}), (target:GovernanceNode {id: 'intent-consent-center'})
MERGE (source)-[r:RUNS {id: 'runs:time-identity->intent-consent-center'}]->(target)
SET r.type = 'runs';
MATCH (source:GovernanceNode {id: 'time-onboarding'}), (target:GovernanceNode {id: 'intent-onboarding-checklist'})
MERGE (source)-[r:RUNS {id: 'runs:time-onboarding->intent-onboarding-checklist'}]->(target)
SET r.type = 'runs';
MATCH (source:GovernanceNode {id: 'time-sre'}), (target:GovernanceNode {id: 'intent-p99-hardening'})
MERGE (source)-[r:RUNS {id: 'runs:time-sre->intent-p99-hardening'}]->(target)
SET r.type = 'runs';
MATCH (source:GovernanceNode {id: 'time-support'}), (target:GovernanceNode {id: 'intent-help-selfservice'})
MERGE (source)-[r:RUNS {id: 'runs:time-support->intent-help-selfservice'}]->(target)
SET r.type = 'runs';
MATCH (source:GovernanceNode {id: 'out-cta-upgrade-2027q1'}), (target:GovernanceNode {id: 'verdict-cta-upgrade-2027q1'})
MERGE (source)-[r:SUPPORTS_VERDICT {id: 'supports-verdict:out-cta-upgrade-2027q1->verdict-cta-upgrade-2027q1'}]->(target)
SET r.type = 'supports-verdict';
MATCH (source:GovernanceNode {id: 'tgt-billing-conv'}), (target:GovernanceNode {id: 'conversion-rate'})
MERGE (source)-[r:USES_METRIC {id: 'uses-metric:tgt-billing-conv->conversion-rate'}]->(target)
SET r.type = 'uses-metric';
MATCH (source:GovernanceNode {id: 'tgt-checkout-conv'}), (target:GovernanceNode {id: 'conversion-rate'})
MERGE (source)-[r:USES_METRIC {id: 'uses-metric:tgt-checkout-conv->conversion-rate'}]->(target)
SET r.type = 'uses-metric';
MATCH (source:GovernanceNode {id: 'tgt-checkout-stack'}), (target:GovernanceNode {id: 'cost-to-serve'})
MERGE (source)-[r:USES_METRIC {id: 'uses-metric:tgt-checkout-stack->cost-to-serve'}]->(target)
SET r.type = 'uses-metric';
MATCH (source:GovernanceNode {id: 'tgt-data-cost'}), (target:GovernanceNode {id: 'cost-to-serve'})
MERGE (source)-[r:USES_METRIC {id: 'uses-metric:tgt-data-cost->cost-to-serve'}]->(target)
SET r.type = 'uses-metric';
MATCH (source:GovernanceNode {id: 'tgt-identity-consent'}), (target:GovernanceNode {id: 'consent-coverage'})
MERGE (source)-[r:USES_METRIC {id: 'uses-metric:tgt-identity-consent->consent-coverage'}]->(target)
SET r.type = 'uses-metric';
MATCH (source:GovernanceNode {id: 'tgt-onboarding-act'}), (target:GovernanceNode {id: 'activation-rate'})
MERGE (source)-[r:USES_METRIC {id: 'uses-metric:tgt-onboarding-act->activation-rate'}]->(target)
SET r.type = 'uses-metric';
MATCH (source:GovernanceNode {id: 'tgt-onboarding-churn'}), (target:GovernanceNode {id: 'churn-rate'})
MERGE (source)-[r:USES_METRIC {id: 'uses-metric:tgt-onboarding-churn->churn-rate'}]->(target)
SET r.type = 'uses-metric';
MATCH (source:GovernanceNode {id: 'tgt-sre-incidents'}), (target:GovernanceNode {id: 'incident-count'})
MERGE (source)-[r:USES_METRIC {id: 'uses-metric:tgt-sre-incidents->incident-count'}]->(target)
SET r.type = 'uses-metric';
MATCH (source:GovernanceNode {id: 'tgt-sre-p99'}), (target:GovernanceNode {id: 'p99-latency'})
MERGE (source)-[r:USES_METRIC {id: 'uses-metric:tgt-sre-p99->p99-latency'}]->(target)
SET r.type = 'uses-metric';
MATCH (source:GovernanceNode {id: 'tgt-support-churn'}), (target:GovernanceNode {id: 'churn-rate'})
MERGE (source)-[r:USES_METRIC {id: 'uses-metric:tgt-support-churn->churn-rate'}]->(target)
SET r.type = 'uses-metric';
MATCH (source:GovernanceNode {id: 'tgt-support-cost'}), (target:GovernanceNode {id: 'ticket-cost'})
MERGE (source)-[r:USES_METRIC {id: 'uses-metric:tgt-support-cost->ticket-cost'}]->(target)
SET r.type = 'uses-metric';
