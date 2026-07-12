// scenario.ts — STRESS scenario sintético e ISOLADO (não toca no login_1). Org fictícia de e-commerce (acme-*).
// Desenhado pra DISCRIMINAR matchers: as capabilities são PARÁFRASE dos needs (overlap de token ~0), TEXTO-LIVRE
// (sem tags — tira a "muleta" do léxico), com DISTRACTORS (repos adjacentes que compartilham palavras) e 1 cross-lingual.
// O léxico DEVE sofrer aqui; embedding/LLM devem abrir vantagem. Ground-truth = `want`.

export interface StressRepo {
  repo: string;
  capabilities: string[]; // texto livre, sem tags (o caso difícil)
}
export interface StressNeed {
  need: string;
  want: string; // o repo correto (ground-truth)
  trap?: string; // o distractor provável que o léxico pode pegar errado
}

export const REPOS: StressRepo[] = [
  {
    repo: "acme-checkout",
    capabilities: [
      "finalização de compra e captura de pagamento",
      "orquestra o carrinho até o pedido confirmado",
    ],
  },
  {
    repo: "acme-ledger",
    capabilities: ["registro contábil de transações e conciliação financeira"],
  },
  {
    repo: "acme-search",
    capabilities: [
      "busca e ranqueamento do catálogo por relevância",
      "indexação de produtos para consulta",
    ],
  },
  { repo: "acme-notify", capabilities: ["envio de mensagens transacionais (e-mail, SMS, push)"] },
  { repo: "acme-identity", capabilities: ["autenticação e gestão de sessão do usuário"] },
  { repo: "acme-catalog", capabilities: ["cadastro e curadoria de produtos e variações"] },
  { repo: "acme-pricing", capabilities: ["regras de preço, descontos e promoções"] },
  { repo: "acme-fraud", capabilities: ["detecção de risco e bloqueio de transações suspeitas"] },
  { repo: "acme-shipping", capabilities: ["cálculo de frete e rastreamento de entrega"] },
  {
    repo: "acme-recs",
    capabilities: [
      "recomendação personalizada de itens",
      "sugestões baseadas no histórico do usuário",
    ],
  },
  { repo: "acme-inventory", capabilities: ["controle de estoque e disponibilidade de itens"] },
  { repo: "acme-analytics", capabilities: ["product analytics and conversion funnels"] }, // EN (cross-lingual)
];

export const NEEDS: StressNeed[] = [
  { need: "fechar a venda e debitar o cartão do cliente", want: "acme-checkout" }, // captura de pagamento, parafraseado
  { need: "barrar golpista usando cartão roubado num pedido", want: "acme-fraud" },
  {
    need: "sugerir itens parecidos com o que a pessoa já levou",
    want: "acme-recs",
    trap: "acme-catalog/acme-search (têm 'itens/produtos')",
  },
  { need: "quanto sai pra despachar o pacote até o cliente", want: "acme-shipping" },
  { need: "tem essa peça em mãos pra mandar hoje?", want: "acme-inventory" },
  {
    need: "dar um abatimento de 20% pro cliente no fim",
    want: "acme-pricing",
    trap: "acme-checkout (tem 'carrinho/compra')",
  },
  {
    need: "acompanhar quantos visitantes viram clientes",
    want: "acme-analytics",
    trap: "cross-lingual: capability em inglês",
  },
  {
    need: "avisar o cliente quando o pedido sair pra entrega",
    want: "acme-notify",
    trap: "acme-shipping (tem 'entrega')",
  },
];
