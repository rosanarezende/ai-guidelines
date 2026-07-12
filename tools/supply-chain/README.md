# Supply-chain advisory

Esta pasta contem checks consultivos de dependencias para o proprio
`ai-guidelines`.

## Comandos

```bash
npm run supply-chain:check
npm run supply-chain:advisory
SUPPLY_CHAIN_FAIL_ON_VULNS=1 npm run supply-chain:advisory
```

`supply-chain:check` roda sem rede. Ele apenas confirma que o `package-lock.json`
e legivel e que o advisory conseguiria montar a matriz de pacotes.

`supply-chain:advisory` consulta:

- OSV.dev (`/v1/querybatch`) para vulnerabilidades por pacote/versao;
- deps.dev (`/v3/systems/npm/packages/.../versions/...`) para metadados das
  dependencias diretas.

O relatorio padrao e gravado em `.tmp/supply-chain/advisory-report.json`, fora
do Git. Por default o comando e advisory e retorna exit 0 mesmo se encontrar
vulnerabilidades. Use `SUPPLY_CHAIN_FAIL_ON_VULNS=1` ou `--fail-on-vulns` para
transformar matches OSV em falha.

## Fronteira de autoridade

OSV.dev e deps.dev geram evidencia de supply-chain. Eles nao:

- fecham gate;
- aceitam verdict;
- criam iniciativa automaticamente;
- escrevem estado de governanca;
- substituem triagem humana/contextual.

Durante a incubacao Guilda, o adapter `code-security` consumia relatorios locais
hash-verificados (`reports/code-security.json`) e falhava fechado quando o corpo
era adulterado ou stale. Esse codigo agora e historico neste repo e deve evoluir
no repo Guilda se voltar a ser produto ativo.
