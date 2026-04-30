# Research: Node.js Native Test Runner Configuration File

## Contexto

O projeto atualmente utiliza scripts extensos no `package.json` para configurar o test runner nativo do Node.js, especialmente flags de cobertura e exclusão. O objetivo desta pesquisa é identificar se existe um equivalente ao `jest.config.js` para o Node.js.

## Descobertas (Node.js v22.6.0+ / v24)

### 1. Flag Experimental de Configuração

O Node.js introduziu suporte experimental para arquivos de configuração JSON.

- **Flag**: `--experimental-default-config-file` (carrega `node.config.json` automaticamente se presente na raiz).
- **Flag**: `--experimental-config-file=<path>` (para caminhos customizados).

### 2. Estrutura do `node.config.json` (Schema Oficial v24.14.0)

O arquivo utiliza namespaces específicos. Para o test runner, o namespace correto é `testRunner`.

**Estrutura Documentada:**

```json
{
  "$schema": "https://nodejs.org/dist/v24.14.0/docs/node-config-schema.json",
  "testRunner": {
    "test": true,
    "experimental-test-coverage": true,
    "test-coverage-lines": 85,
    "test-coverage-exclude": [".pnp.loader.mjs", ".pnp.cjs"]
  }
}
```

### 3. Namespaces Disponíveis

- `nodeOptions`: Flags gerais do processo Node.
- `testRunner`: Flags específicas do comando `--test`.
- `watch`: Flags relacionadas ao modo watch.

### 3. Validação Empírica

- Realizei testes em `scratch/node.config.json` e `scratch/dummy.test.mjs`.
- O Node.js valida as chaves dentro de `nodeOptions`. Chaves desconhecidas disparam erro: `Unknown or not allowed option ... for namespace nodeOptions`.
- O threshold de cobertura (`test-coverage-lines`) é respeitado e validado (ex: disparou `ERR_OUT_OF_RANGE` ao testar com 101).

### 4. Limitações e Riscos

- **Experimental**: A funcionalidade está sob a flag experimental e pode mudar. No entanto, é estável o suficiente para uso em ambientes controlados como o nosso.
- **Namespaces**: Nem todas as flags do `node --test` podem estar disponíveis diretamente no topo; algumas exigem `nodeOptions` ou namespaces específicos dependendo da subversão exata.

## Conclusão

É perfeitamente possível e recomendado para limpar o `package.json`, dado que o projeto já migrou para o Node 24.

---

**Referências:**

- Node.js Documentation (Experimental Config)
- Validação local via `node --help` e execução em `scratch/`.
