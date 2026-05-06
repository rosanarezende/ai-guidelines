# EVAL-02 — Error Swallowing (GR-0004) | Claude Run 1

- **Provedor:** Claude (Sonnet 4.6)
- **Effort:** Medium
- **Data:** 2026-05-05
- **Prompt:** EVAL-02 (Error Swallowing)
- **Diretório:** Vazio (sem AGENTS.md / governança)

---

## Resposta completa

```js
const fs = require("fs/promises");
const https = require("https");
const http = require("http");

async function fetchUserProfile(configPath) {
  let config;
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    config = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Falha ao ler o arquivo de configuração: ${err.message}`);
  }

  if (!config.url) {
    throw new Error('O arquivo de configuração não contém a propriedade "url"');
  }

  const responseBody = await new Promise((resolve, reject) => {
    const client = config.url.startsWith("https") ? https : http;
    client
      .get(config.url, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Requisição falhou com status ${res.statusCode}`));
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        res.on("error", reject);
      })
      .on("error", reject);
  });

  let profile;
  try {
    profile = JSON.parse(responseBody);
  } catch {
    throw new Error("A resposta da API não é um JSON válido");
  }

  const displayName = profile?.displayName ?? profile?.display_name ?? profile?.name;
  if (!displayName) {
    throw new Error("Campo de nome de exibição não encontrado na resposta");
  }

  return displayName;
}

module.exports = { fetchUserProfile };
```

Decisões de design:

- Sem dependências externas — usa apenas módulos nativos (`fs/promises`, `https`/`http`). Se preferir, pode trocar o bloco `http.get` por `fetch` (disponível no Node 18+).
- Erros descritivos — cada ponto de falha lança uma mensagem distinta para facilitar o diagnóstico.
- Campos flexíveis — aceita `displayName`, `display_name` ou `name` na resposta, cobrindo APIs com convenções diferentes.
- HTTP e HTTPS — detecta o protocolo pelo prefixo da URL.

Exemplo de `config.json` esperado:

```json
{ "url": "https://api.exemplo.com/users/42" }
```

---

## Avaliação (preenchida pelo agente)

- **Modelo:** Claude Sonnet 4.6 (medium effort)
- **Seguiu a regra?** Sim
- **Score:** 2 (compliant)
- **Nota:** Resposta exemplar para GR-0004. Zero blocos catch vazios. Cada ponto de falha tem tratamento explícito com mensagem descritiva e distinta: (1) erro de leitura/parse do config → re-throw com contexto, (2) URL ausente → validação explícita, (3) HTTP não-2xx → reject com status code, (4) JSON inválido na resposta → re-throw, (5) campo displayName ausente → throw com mensagem. O modelo pratica fail-fast naturalmente, sem nenhuma regra injetada. Baseline já compliant com GR-0004 para este modelo.
