/**
 * @file Define as entidades centrais do sistema de governança, representando a Linguagem Ubíqua.
 * Estas entidades baseiam-se nos 7 pilares de valor definidos em DEC-0021-A02.
 */

/**
 * Os sete tipos principais de itens de trabalho no registro de governança.
 * Cada um representa uma intenção e um ciclo de vida operacional diferente.
 */
export type WorkItemType =
  | "spec"
  | "exploration"
  | "fix"
  | "patch"
  | "incident"
  | "proposal"
  | "experiment";

/**
 * Representa as propriedades base comuns a todos os itens de trabalho no registro.
 */
export interface WorkItem {
  id: string; // Identificador único (ex: 'spec-0021', 'fix-101')
  type: WorkItemType;
  title: string;
  description: string;
  status: "open" | "in-progress" | "review" | "done" | "archived";
  owner?: string; // Responsável pelo item
  relatedIds?: string[]; // IDs de outros itens relacionados a este
  createdAt: Date;
  updatedAt: Date;
  workspacePath?: string; // Caminho opcional para a pasta física (ex: '.governance/specs/...')
}

/**
 * 1. spec: Entrega estruturada seguindo o ciclo RPI completo.
 * Requer o maior nível de rigor e documentação formal.
 */
export interface Spec extends WorkItem {
  type: "spec";
  workspacePath: string; // Obrigatório para Spec
}

/**
 * EXAMPLES (Spec):
 * - "Migração do banco de dados para PostgreSQL"
 * - "Nova funcionalidade de Login via OAuth"
 * - "Refatoração da arquitetura de eventos (breaking change)"
 */

/**
 * 2. exploration: Uma Prova de Conceito (PoC) ou spike técnico.
 * O foco é o aprendizado e o arquivamento seguro de protótipos.
 */
export interface Exploration extends WorkItem {
  type: "exploration";
  workspacePath: string; // Obrigatório para manter o histórico da POC
  outcome: "prototype" | "research-document" | "decision-log";
  prototypeUrl?: string; // Link opcional para o protótipo ou repositório de exploração
}

/**
 * 3. fix: Correção de comportamento funcional.
 * Focado em sanar dívida técnica ou bugs, com documentação mínima.
 */
export interface Fix extends WorkItem {
  type: "fix";
  relatedIncidentId?: string; // Link opcional para um incidente relacionado
}

/**
 * EXAMPLES (Fix):
 * - "Correção de erro 500 no checkout"
 * - "Ajuste em cálculo de frete que estava arredondando errado"
 * - "Conserto de link quebrado no rodapé"
 */

/**
 * 4. patch: Manutenção invisível para o usuário final.
 * Pula a documentação pesada (ex: updates de biblioteca, linting, chores).
 */
export interface Patch extends WorkItem {
  type: "patch";
}

/**
 * EXAMPLES (Patch):
 * - "Update de dependências (npm audit fix)"
 * - "Correção de typo em comentário de código"
 * - "Pequeno ajuste de CSS (padding/margin) sem impacto funcional"
 */

/**
 * 5. incident: Um problema grave, como downtime ou quebra crítica de CI.
 * Distinguido pela sua severidade e impacto no negócio.
 */
export interface Incident extends WorkItem {
  type: "incident";
  workspacePath: string; // Obrigatório para Post-mortems e Decision Logs
  severity: "critical" | "high" | "medium" | "low";
}

/**
 * EXAMPLES (Incident):
 * - "Downtime total do ambiente de produção"
 * - "Vazamento de chaves de API em log público"
 * - "Falha massiva no processamento de pagamentos"
 */

/**
 * 6. proposal: Uma semente de backlog.
 * Uma ideia de melhoria ou funcionalidade, registrada sem criar pastas físicas ainda.
 */
export interface Proposal extends WorkItem {
  type: "proposal";
}

/**
 * 7. experiment: Mudanças baseadas em hipóteses (Growth/Testes A-B/Rollouts).
 * Equilibra velocidade com o rigor necessário para medir resultados sem quebrar a produção.
 */
export interface Experiment extends WorkItem {
  type: "experiment";
  workspacePath: string; // Obrigatório para registrar o acompanhamento técnico
  hypothesis: string; // Hipótese a ser validada
  successMetrics: string[]; // Indicadores de sucesso (ex: aumento de conversão)
  trackingStrategy: string; // Estratégia de monitoramento (ex: Statsig, Mixpanel)
  outcome?: "won" | "lost" | "inconclusive"; // Resultado do experimento
  cleanupStatus?: "pending" | "cleaned-up" | "shaped-up"; // Status do pós-experimento
  variants?: string[]; // Variantes (opcional para rollouts simples)
}

/**
 * EXAMPLES (Experiment):
 * - "Mudar cor do CTA de 'Comprar' para laranja para aumentar conversão"
 * - "Remover passo 2 do Onboarding para reduzir churn"
 * - "Novo algoritmo de recomendação na Home"
 */
