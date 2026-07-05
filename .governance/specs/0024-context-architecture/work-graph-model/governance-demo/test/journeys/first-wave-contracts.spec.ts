// first-wave-contracts.spec.ts — backlog executavel da primeira leva.
//
// Estes testes nascem como fixme porque descrevem o produto-alvo, nao o estado
// atual da implementacao. Quando uma fatia for implementada, o contrato
// correspondente deve sair de fixme e passar a rodar.
import { test } from "@playwright/test";

test.describe("Primeira leva de contratos funcionais", () => {
  test.fixme("APP-02 cria workspace novo sem vazar dados da demo acme", async () => {});

  test.fixme("APP-05 perfil e responsabilidades geram recomendacao compreensivel", async () => {});

  test.fixme("APP-06 pessoas, times e papeis usam aceite quando o papel e para outra pessoa", async () => {});

  test.fixme("APP-07 governance host e explicado antes de cadastrar fontes de trabalho", async () => {});

  test.fixme("APP-08 sources guia projeto local vs nuvem e relaciona com governance host", async () => {});

  test.fixme("INT-01 integrations hub mostra valor, permissoes, risco e alternativa manual", async () => {});

  test.fixme("INT-02 sugestao contextual de integracao nao vende ferramenta como requisito", async () => {});

  test.fixme("CUP-01 Cup abre como overlay contextual sem provider externo", async () => {});

  test.fixme("SEC-01 provider cloud nao fica ativo sem egress/authority", async () => {});
});
