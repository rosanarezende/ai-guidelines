/**
 * [BR-CLI-INFRA-01] Adaptador de Filesystem.
 * Esta suíte permanece toda em it.skip nesta fase: o FileSystemAdapter real
 * (escopo, atomicidade de escrita) é entregue no PR2 [DEC-0021-A03].
 */
describe("Infraestrutura — FileSystemAdapter [BR-CLI-INFRA]", () => {
  describe("Segurança e Escopo", () => {
    // [SKIP-REASON: Fase 2 — escopo '.governance/' é o root do PR2 [DEC-0021-A03]]
    it.skip("DADO escrita fora do root '.governance/' ENTÃO erro de violação de escopo [DEC-0021-A03]", () => {});
  });

  describe("Atomicidade de Escrita", () => {
    // [SKIP-REASON: Fase 2 — atomicidade de IO real (rename atômico) é PR2 [DEC-0021-A01]]
    it.skip("DADO gravação no 'registry.yml' QUANDO falha ENTÃO arquivo original permanece intacto [DEC-0021-A01]", () => {});
  });

  describe("Interface de Diretórios", () => {
    // [SKIP-REASON: Fase 2 — checagem de tipo de path é parte do FileSystemAdapter (PR2) [DEC-0021-A03]]
    it.skip("DADO um caminho QUANDO verificado ENTÃO retorna se é arquivo, diretório ou inexistente [DEC-0021-A03]", () => {});
  });
});
