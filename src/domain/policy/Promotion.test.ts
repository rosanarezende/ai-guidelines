/**
 * [BR-CLI-POLICY-01] Ciclo de Vida e Promoção
 * Regras de transição de estado e maturidade.
 */
describe("Domínio — Promoção e Maturidade [BR-CLI-POLICY]", () => {
  describe("Promoção: Proposal -> Spec", () => {
    it.skip("DADO uma 'proposal' QUANDO tentada a promoção ENTÃO deve exigir que o status seja 'review' ou 'done' [BR-CLI-POLICY-01]", () => {
      // Regra: Apenas ideias com apetite validado podem virar specs formais.
    });

    it.skip("DADO a promoção para 'spec' ENTÃO o sistema deve exigir o upgrade de metadados para incluir 'workspacePath' [BR-CLI-POLICY-01]", () => {
      // Regra: A transição de virtual para físico exige definição de local.
    });
  });

  describe("Promoção: Experiment -> Spec (Shape-up)", () => {
    it.skip("DADO um 'experiment' finalizado QUANDO o 'outcome' for 'won' ENTÃO deve permitir a promoção para 'spec' [BR-CLI-POLICY-03]", () => {
      // Regra: Experimentos vencedores são a base legítima para features estruturadas.
    });

    it.skip("DADO a promoção de um experimento 'won' ENTÃO a nova 'spec' deve herdar as métricas e aprendizados originais [BR-CLI-POLICY-03]", () => {
      // Regra: Preservar a linhagem do conhecimento gerado no Growth.
    });
  });

  describe("Imutabilidade de Ciclo Fechado", () => {
    it.skip("DADO um item de manutenção ('patch', 'fix', 'incident') QUANDO tentada qualquer promoção ENTÃO o sistema deve impedir a transição [BR-CLI-POLICY-01]", () => {
      // Regra: Tipos de manutenção não evoluem; eles nascem e morrem com sua finalidade específica.
    });
  });
});
