# Ecossistema Google e programas para open source

> **Frente:** Spec 0024 · work-graph-model · governance-demo
> **Data da pesquisa:** 2026-07-06
> **QRDs alvo:** QRD-40 (ecossistema Google/programas OSS), com QRD-20 (Google como identity provider) e QRD-36 (control plane).
> **Regra:** NÃO escolher Google Cloud nem Cloudflare como destino por default. Separar: programa de comunidade · ferramenta de segurança/supply-chain · provider de login · opção de cloud · referência de docs. Ferramentas úteis podem virar adapters/checks mesmo sem usar Google Cloud.

## 1. Base verificada

**Local:**

- `APP-DECISIONS.md` QRD-40 (research-open; separar programa/segurança/login/cloud/docs; fontes iniciais), QRD-20 (google-oidc como provider p/ não-devs; "Entrar com Google", restrição por domínio Workspace), QRD-36 (Google/OIDC como candidato de provider, não default).
- `model.yml` `trust.policy-artifacts` (threat-model, egress-policy, red-team-corpus) e `schema-policy` (validação runtime) — pontos onde ferramentas de supply-chain encaixam como checks.

**Externas (primárias):**

- Google Open Source: <https://opensource.google/> · Programs & services: <https://opensource.google/programs-and-services>
- Google Summer of Code: <https://summerofcode.withgoogle.com/> · timeline: <https://developers.google.com/open-source/gsoc/timeline>
- Season of Docs (descontinuado): <https://developers.google.com/season-of-docs>
- OSV.dev: <https://osv.dev/> · deps.dev (Open Source Insights): <https://deps.dev/> · docs: <https://docs.deps.dev/>
- OSV-Scanner: <https://google.github.io/osv-scanner/> · repo: <https://github.com/google/osv-scanner> · V2 blog: <https://security.googleblog.com/2025/03/announcing-osv-scanner-v2-vulnerability.html>
- OSS Rebuild: <https://security.googleblog.com/2025/07/introducing-oss-rebuild-open-source.html>
- Assured OSS: <https://cloud.google.com/security/products/assured-open-source-software> · <https://developers.google.com/assured-oss>
- Google Developer Program: <https://developers.google.com/program>

## 2. Fatos (classificados por natureza)

**Programas de comunidade/contribuição:**

- **F1 — Google Summer of Code (GSoC) está ativo em 2026** (184 orgs mentoras, 1156 contribuidores no ciclo 2026; org apps abriram em jan/2026). Contribuidores remunerados trabalham em projetos de orgs OSS aceitas. (Fonte: summerofcode.withgoogle.com, jul/2026.)
- **F2 — Season of Docs foi DESCONTINUADO em 2025.** Era grant para technical writers em projetos OSS. Serve só como **referência histórica** de estruturar documentação OSS. (Fonte: developers.google.com/season-of-docs + confirmação de status.)
- **F3 — Google Developer Program / GDG** são canais de comunidade/educação (não específicos de OSS). (Fonte: developers.google.com/program.)

**Ferramentas de segurança/supply-chain (usáveis SEM Google Cloud):**

- **F4 — OSV.dev** é a maior base agregada de vulnerabilidades OSS (normaliza NVD, GitHub Advisories, fontes por ecossistema); tem API pública. (Fonte: osv.dev.)
- **F5 — deps.dev (Open Source Insights)** expõe grafo de dependências, licenças, advisories e sinais (incl. OpenSSF Scorecard) por pacote, com API. (Fonte: deps.dev / docs.deps.dev.)
- **F6 — OSV-Scanner V2 (mar/2025)** é scanner em Go que virou ferramenta de remediação: scan de container (Debian/Ubuntu/Alpine layer-aware), remediação guiada por profundidade/severidade/ROI, relatório HTML interativo. Roda em CI local, **sem** Google Cloud. (Fonte: security.googleblog + google.github.io/osv-scanner.)
- **F7 — OSS Rebuild (jul/2025)** reproduz artefatos upstream para detectar comprometimento de supply-chain sem ônus ao mantenedor. (Fonte: security.googleblog, jul/2025.)

**Opção de cloud / login (amarra a stack se adotada):**

- **F8 — Assured OSS** entrega pacotes construídos/assinados por Google com evidência SLSA (3 níveis), sem custo, **mas é um produto Google Cloud** (fluxo via GCP). (Fonte: cloud.google.com + developers.google.com/assured-oss.)
- **F9 — Google Sign-In / Google Workspace (OIDC)** é identity provider (QRD-20): autentica pessoa, não concede authority; suporta restrição por domínio Workspace. (Fonte: QRD-20 + OIDC do Google.)

## 3. Interpretação

**Para este projeto (separando o que ajuda comunidade do que amarra infra):**

- **Ganhos "de graça", sem lock-in:** OSV.dev + OSV-Scanner + deps.dev são **puro upside**. Encaixam no `trust.policy-artifacts` do `model.yml` como **checks/adapters de supply-chain** — o próprio framework passa a dogfoodar segurança de dependências. Isso reforça o posicionamento OSS-first e a maturidade (casa com OpenSSF Scorecard/OSPS Baseline da research de posicionamento). **Nenhum** desses exige Google Cloud.
- **GSoC (F1)** é o programa de comunidade mais valioso — **mas só depois** de existir repo público nomeado, boas "good first issues" e mentoria disponível. É gatilho de maturidade, não de agora. Pré-requisito bate com os gatilhos da research de extração.
- **Season of Docs (F2)** morreu; usar só como _template mental_ de como organizar docs (não planejar em cima dele).
- **Assured OSS (F8)** é opção de infra Google Cloud → **não** adotar por default (viola a regra do prompt e QRD-40). Só entraria se o projeto já estivesse em GCP por outro motivo.
- **Google login (F9)** é decisão já tomada em QRD-20 (provider, não default; "Entrar com Google", domínio Workspace). Nada novo a decidir aqui além de reafirmar que login ≠ authority (APP-41).

Risco a nomear: é fácil "cair" em GCP porque as ferramentas boas (OSV/deps.dev) são do Google. A disciplina correta: **usar as ferramentas OSS (OSV/deps.dev/OSV-Scanner) como checks neutros**, e tratar Assured OSS/GCP como _uma_ opção de infra entre outras, nunca o trilho default.

## 4. Matriz de alternativas

| Recurso Google                    | Natureza           | O que entrega                                 | Custo                | Lock-in              | Self-host/neutro?   | Aderência ao modelo         | Quando usar                        |
| --------------------------------- | ------------------ | --------------------------------------------- | -------------------- | -------------------- | ------------------- | --------------------------- | ---------------------------------- |
| **OSV.dev + API**                 | segurança          | base de vulnerabilidades OSS normalizada      | grátis               | nenhum               | neutro (API aberta) | **alta** (check/adapter)    | já — como check de deps            |
| **OSV-Scanner V2**                | segurança          | scan+remediação em CI, relatório HTML         | grátis               | nenhum               | neutro (roda local) | **alta**                    | já — CI do repo                    |
| **deps.dev + API**                | segurança/insight  | grafo de deps, licenças, Scorecard por pacote | grátis               | nenhum               | neutro              | alta (adapter de evidência) | já — enriquecer evidência          |
| **OSS Rebuild**                   | segurança          | reprodutibilidade de artefatos                | grátis               | nenhum               | neutro              | média (avançado)            | futuro, se publicar pacotes        |
| **GSoC**                          | comunidade         | contribuidores remunerados + mentoria         | grátis (Google paga) | nenhum               | n/a                 | alta p/ crescimento         | após repo público maduro (gatilho) |
| **Season of Docs**                | comunidade (morto) | —                                             | —                    | —                    | —                   | só referência histórica     | nunca (descontinuado)              |
| **Google Sign-In/Workspace OIDC** | login              | autenticação de pessoa                        | grátis (OAuth)       | baixo (OIDC padrão)  | provider externo    | ok (QRD-20)                 | provider opcional                  |
| **Assured OSS**                   | cloud/segurança    | pacotes assinados SLSA                        | grátis, mas via GCP  | **médio/alto (GCP)** | não-neutro          | baixa como default          | só se já em GCP                    |

## 5. Recomendação

**Resposta à pergunta 7 do prompt (o que vale sem amarrar a Google Cloud):**

**Decidir agora (baixo custo, alto retorno, zero lock-in):**

1. **Adotar OSV-Scanner + OSV.dev + deps.dev como checks/adapters de supply-chain** do próprio projeto (dogfood de segurança). Encaixam em `trust.policy-artifacts` e reforçam maturidade OSS junto com OpenSSF Scorecard/OSPS Baseline. São neutros e rodam em qualquer CI.
2. **Reafirmar Google como provider de login opcional (QRD-20)**, login ≠ authority (APP-41). Nada a mudar.
3. **NÃO adotar Assured OSS / Google Cloud por default** (regra do prompt + QRD-40). Registrar como "opção de infra entre outras".

**Manter aberto:**

- GSoC como **meta futura** (gatilho: repo público nomeado + good-first-issues + mentoria). Não agora.
- OSS Rebuild (só se/quando publicar pacotes no registry).

**Testar antes:**

- Rodar **OSV-Scanner** uma vez no repo e **deps.dev** nas deps principais (React/Next/MUI/Hono/lowdb/yaml) para ter um baseline de vulnerabilidades/licenças — barato, e vira evidência de governança do próprio projeto.

## 6. Impacto em QRDs

- **Avançar QRD-40 (segue research-open):** classificar cada recurso (F1–F9) por natureza; decidir adotar OSV/deps.dev/OSV-Scanner como checks; vetar GCP/Assured OSS como default; confirmar Google login via QRD-20.
- **Conecta com:** posicionamento OSS (OpenSSF) e QRD-20 (login).
- **Novos contratos/checks sugeridos (não implementar nesta rodada):**
  - `CHECK` (CI): `osv-scanner` no lockfile do repo, publicando resultado como evidência.
  - `ADAPTER`: cliente deps.dev/OSV como _evidence provider_ de supply-chain no hub de integrações (QRD-33), marcado como advisory (não vira SSOT).
  - `DOC`: nota em `POLICY-HANDBOOK.md`/trust sobre ferramentas de supply-chain neutras vs infra Google.
