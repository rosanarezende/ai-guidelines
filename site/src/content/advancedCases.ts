export type DesencontroStage = "detectado" | "explicado" | "reparavel" | "decisao" | "pendente";

export interface DesencontroScenario {
  readonly id: string;
  readonly number: number;
  readonly title: string;
  readonly summary: string;
  readonly miniProject: string;
  readonly whatHappened: string;
  readonly userRuns: string;
  readonly terminal: readonly string[];
  readonly humanNextStep: string;
  readonly stages: readonly {
    readonly label: "Detectar" | "Explicar" | "Reparar" | "Testar";
    readonly state: DesencontroStage;
    readonly text: string;
  }[];
}

export const desencontroScenarios: readonly DesencontroScenario[] = [
  {
    id: "branch-stale",
    number: 1,
    title: "A branch mudou, mas o índice público ficou na anterior",
    summary: "A pessoa está na branch certa, mas o framework ainda aponta para a branch antiga.",
    miniProject: "Repo governado com active.yml publicado antes da troca de branch.",
    whatHappened:
      "A projeção pública de specs ficou stale: a branch atual é uma, mas active.yml ainda orienta a retomada para outra.",
    userRuns: "npx ai-guidelines drift",
    terminal: [
      "$ npx ai-guidelines drift",
      "# Diagnóstico de governança",
      "",
      "Status: Detectei 1 ponto(s) que precisam de atenção.",
      "",
      "Verificações:",
      "- índice público de specs",
      "- coerência active.yml -> state.yml",
      "- state.yml § topology / next[0]",
      "",
      "1. O índice público aponta para a branch errada",
      "   O que aconteceu: spec 0024: branch stale; índice aponta para feat/spec-0024-antiga, mas a branch atual é feat/spec-0024-co-flow-continuation.",
      "   Por que importa: a retomada pode orientar a pessoa para o lugar errado.",
      "   Classificação do reparo: reparo seguro com preview e confirmação",
      "   Reparo seguro: Rode npx ai-guidelines repair para ver o plano. A escrita só acontece com confirmação.",
    ],
    humanNextStep:
      "Rodar o reparo com preview; se o diff fizer sentido, confirmar a republicação do índice público.",
    stages: [
      { label: "Detectar", state: "detectado", text: "Coberto pelo Governance Doctor." },
      {
        label: "Explicar",
        state: "explicado",
        text: "Explica branch esperada, branch atual e risco.",
      },
      {
        label: "Reparar",
        state: "reparavel",
        text: "Reparo determinístico com preview e confirmação.",
      },
      { label: "Testar", state: "detectado", text: "Coberto por testes positivos do reparo." },
    ],
  },
  {
    id: "cursor-diverge",
    number: 2,
    title: "O cursor de retomada aponta para o lugar errado",
    summary: "O estado estrutural e o ponto em que o guia tenta retomar não combinam.",
    miniProject: "Spec com topologia válida, mas cursor apontando para nó ou checkpoint incorreto.",
    whatHappened:
      "O cursor fica dentro da fonte estrutural. Alterá-lo sem decidir qual realidade venceu pode mudar o fluxo do trabalho.",
    userRuns: "npx ai-guidelines drift",
    terminal: [
      "$ npx ai-guidelines drift",
      "# Diagnóstico de governança",
      "",
      "Status: Detectei 1 ponto(s) que precisam de atenção.",
      "",
      "1. O cursor de retomada não aponta para o próximo nó real",
      "   O que aconteceu: state.yml § topology.cursor diverge do próximo nó canônico derivado da topologia.",
      "   Por que importa: uma sessão nova pode continuar no ponto errado.",
      "   Classificação do reparo: decisão humana",
      "   Reparo seguro: Mostre a divergência e prepare a decisão governada correta. Não reescreva cursor automaticamente.",
    ],
    humanNextStep:
      "Decidir se o cursor ou a topologia está correta; depois aplicar a transição governada apropriada.",
    stages: [
      { label: "Detectar", state: "detectado", text: "Coberto pelo reconcile check." },
      { label: "Explicar", state: "explicado", text: "Mostra o cursor e o próximo canônico." },
      { label: "Reparar", state: "decisao", text: "Depende de decisão humana." },
      { label: "Testar", state: "detectado", text: "Coberto por testes do reconcile check." },
    ],
  },
  {
    id: "next-narrado",
    number: 3,
    title: "O próximo passo narrado não bate com a topologia",
    summary:
      "O texto de orientação ficou antigo, mesmo quando a topologia já sabe o próximo nó real.",
    miniProject: "state.yml com topology correta e next[0] narrativo stale.",
    whatHappened:
      "A narração ajuda humanos, mas não é SSOT. Reescrever prosa automaticamente poderia apagar contexto importante.",
    userRuns: "npx ai-guidelines drift",
    terminal: [
      "$ npx ai-guidelines drift",
      "# Diagnóstico de governança",
      "",
      "Status: Detectei 1 ponto(s) que precisam de atenção.",
      "",
      "1. O próximo narrado diverge da topologia",
      "   O que aconteceu: next[0] não declara o canonical-next esperado pela topologia.",
      "   Por que importa: a pessoa pode seguir uma orientação antiga.",
      "   Classificação do reparo: decisão humana",
      "   Reparo seguro: Mostre o id canônico e prepare a edição governada da narração.",
    ],
    humanNextStep:
      "Atualizar a narração para refletir o próximo nó real sem perder o contexto humano que motivou a frase.",
    stages: [
      { label: "Detectar", state: "detectado", text: "Detecta marcador ausente ou stale." },
      { label: "Explicar", state: "explicado", text: "Mostra o canonical-next esperado." },
      { label: "Reparar", state: "decisao", text: "Requer edição/decisão humana." },
      { label: "Testar", state: "detectado", text: "Coberto por testes do reconcile check." },
    ],
  },
  {
    id: "tasks-checkpoint",
    number: 4,
    title: "A lista de tarefas não reflete o checkpoint atual",
    summary:
      "O checkpoint ativo existe no estado, mas tasks.md não materializa essa etapa de forma confiável.",
    miniProject:
      "Spec com cursor em um checkpoint e tasks.md sem item equivalente ou com marcador incoerente.",
    whatHappened:
      "A lista de tarefas é narrativa operacional. O framework deve detectar a incoerência, mas não inventar a tarefa por conta própria.",
    userRuns: "npx ai-guidelines drift",
    terminal: [
      "$ npx ai-guidelines drift",
      "# Diagnóstico de governança",
      "",
      "Status: Detectei 1 ponto(s) que precisam de atenção.",
      "",
      "1. A lista de tarefas não materializa o checkpoint ativo",
      "   O que aconteceu: checkpoint ativo em state.yml não tem tarefa correspondente em tasks.md.",
      "   Por que importa: a pessoa perde a visão executável do que está em andamento.",
      "   Classificação do reparo: decisão humana",
      "   Reparo seguro: Criar ou corrigir a tarefa em linguagem humana, preservando o recorte real do checkpoint.",
    ],
    humanNextStep:
      "Escrever ou ajustar a tarefa que representa o checkpoint atual; depois rodar o diagnóstico novamente.",
    stages: [
      {
        label: "Detectar",
        state: "detectado",
        text: "Coberto para checkpoint ausente e marcador incoerente.",
      },
      {
        label: "Explicar",
        state: "explicado",
        text: "Explica a diferença entre cursor e tasks.md.",
      },
      { label: "Reparar", state: "decisao", text: "Depende de escrita humana em tasks.md." },
      { label: "Testar", state: "detectado", text: "Coberto por testes de consistência." },
    ],
  },
  {
    id: "pr-body",
    number: 5,
    title: "A descrição do PR conta outra história",
    summary: "O PR está aberto, mas o body não segue o template governado ou ficou stale.",
    miniProject: "PR Draft com implementação atual e descrição copiada de um recorte anterior.",
    whatHappened:
      "O PR é a principal leitura humana para revisão. Se o body está errado, o gate pode decidir com base em uma narrativa falsa.",
    userRuns: "npx ai-guidelines drift",
    terminal: [
      "$ npx ai-guidelines drift",
      "# Diagnóstico de governança",
      "",
      "Status: Detectei 1 ponto(s) que precisam de atenção.",
      "",
      "1. A descrição do PR não segue o template governado atual",
      "   O que aconteceu: PR #44 (perfil execution) diverge do contrato.",
      "   Por que importa: revisores e gates podem decidir com base em narrativa stale.",
      "   Classificação do reparo: decisão humana",
      "   Reparo seguro: Gerar o corpo pelo template governado e aplicar no GitHub somente após revisão humana.",
    ],
    humanNextStep:
      "Autenticar GitHub CLI, gerar o body governado ou receber instruções manuais para atualizar o PR.",
    stages: [
      { label: "Detectar", state: "detectado", text: "Coberto quando gh/auth está disponível." },
      { label: "Explicar", state: "explicado", text: "Mostra perfil e divergências do template." },
      { label: "Reparar", state: "decisao", text: "Precisa de autenticação e revisão humana." },
      { label: "Testar", state: "detectado", text: "Coberto por validação de contrato de PR." },
    ],
  },
  {
    id: "gate-sem-avanco",
    number: 6,
    title: "O Human Gate foi aprovado, mas o fluxo não avançou",
    summary: "A decisão humana existe, mas o cursor ainda está no nó aprovado.",
    miniProject: "Spec com gate aprovado e topologia ainda apontando para o nó anterior.",
    whatHappened:
      "O gate não deve executar transição sozinho, mas o sistema precisa avisar que existe uma decisão já tomada e ainda não aplicada ao fluxo.",
    userRuns: "npx ai-guidelines drift",
    terminal: [
      "$ npx ai-guidelines drift",
      "# Diagnóstico de governança",
      "",
      "Status: Detectei 1 ponto(s) que precisam de atenção.",
      "",
      "1. Gate humano aprovado, mas a topologia ainda não avançou",
      "   O que aconteceu: o gate do nó co-flow-convergence está aprovado, mas topology.cursor ainda aponta para ele.",
      "   Por que importa: a próxima sessão pode repetir uma decisão já tomada.",
      "   Classificação do reparo: decisão humana",
      "   Reparo seguro: Preparar o fluxo governado de avanço/abertura do próximo nó.",
    ],
    humanNextStep:
      "Executar o fluxo governado que materializa o próximo nó/PR autorizado pelo gate, sem editar state.yml manualmente.",
    stages: [
      { label: "Detectar", state: "detectado", text: "Coberto pelo Governance Doctor." },
      { label: "Explicar", state: "explicado", text: "Mostra nó aprovado e cursor atual." },
      { label: "Reparar", state: "decisao", text: "Depende de decisão/ação governada." },
      { label: "Testar", state: "detectado", text: "Coberto por testes de progressão de gate." },
    ],
  },
  {
    id: "proximo-no",
    number: 7,
    title: "O próximo nó ainda não virou PR/branch",
    summary:
      "A topologia sabe qual é o próximo trabalho, mas ainda não existe contêiner seguro para executá-lo.",
    miniProject: "Spec com próximo nó planejado, sem PR associado ou branch publicada.",
    whatHappened:
      "Sem PR/branch, a pessoa ou a LLM pode começar a implementação no contexto errado.",
    userRuns: "npx ai-guidelines drift",
    terminal: [
      "$ npx ai-guidelines drift",
      "# Diagnóstico de governança",
      "",
      "Status: Detectei 1 ponto(s) que precisam de atenção.",
      "",
      "1. O próximo nó ainda não tem PR/branch materializado",
      "   O que aconteceu: após co-flow-convergence, o próximo nó de execução é co-flow-continuation, mas ele ainda está planejado ou sem PR associado.",
      "   Por que importa: ainda não há contêiner seguro de branch/PR para continuar.",
      "   Classificação do reparo: decisão humana",
      "   Reparo seguro: Usar o fluxo governado de abertura do próximo nó/PR; se GitHub/auth não estiver disponível, orientar o humano.",
    ],
    humanNextStep:
      "Abrir ou reconciliar o próximo PR pelo fluxo governado; se o ambiente não tiver GitHub/auth, seguir instruções manuais.",
    stages: [
      { label: "Detectar", state: "detectado", text: "Coberto pelo Governance Doctor." },
      {
        label: "Explicar",
        state: "explicado",
        text: "Mostra nó atual, próximo nó e ausência de PR/branch.",
      },
      {
        label: "Reparar",
        state: "decisao",
        text: "Exige autorização e, possivelmente, GitHub auth.",
      },
      {
        label: "Testar",
        state: "detectado",
        text: "Coberto por testes de materialização do próximo nó.",
      },
    ],
  },
  {
    id: "artefato-narrativo-stale",
    number: 8,
    title: "Um artefato narrativo antigo contradiz o estado oficial",
    summary: "Research/status/handoff antigo ainda existe e pode parecer verdade atual.",
    miniProject:
      "Spec com research antigo descrevendo checks, PR ou próximos passos que já mudaram.",
    whatHappened:
      "Artefatos narrativos são úteis para memória, mas não vencem state.yml, tasks, reviews e gates.",
    userRuns: "npx ai-guidelines drift",
    terminal: [
      "$ npx ai-guidelines drift",
      "# Diagnóstico de governança",
      "",
      "Status: Nenhum diagnóstico automático para este tipo ainda.",
      "",
      "Desencontro conhecido:",
      "   O que aconteceu: um artefato narrativo pode mencionar um estado anterior do PR ou dos testes.",
      "   Por que importa: a pessoa pode confiar em um resumo velho em vez do estado oficial.",
      "   Classificação do reparo: pendente",
      "   Reparo seguro: CO-10.8.2 deve reorganizar artefatos narrativos e separar evidência, plano, status e backlog.",
    ],
    humanNextStep:
      "Tratar em CO-10.8.2; até lá, usar state.yml, tasks, reviews, gates e comandos do framework como fontes autoritativas.",
    stages: [
      { label: "Detectar", state: "pendente", text: "Rastreado para CO-10.8.2." },
      { label: "Explicar", state: "pendente", text: "Ainda não automatizado." },
      { label: "Reparar", state: "pendente", text: "Depende da reorganização de artefatos." },
      { label: "Testar", state: "pendente", text: "Ainda não implementado." },
    ],
  },
];

export function desencontroScenarioById(id: string): DesencontroScenario | undefined {
  return desencontroScenarios.find((scenario) => scenario.id === id);
}
