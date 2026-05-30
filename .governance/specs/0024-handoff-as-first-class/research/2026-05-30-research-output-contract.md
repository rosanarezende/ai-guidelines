# Research — O contrato de _saída_ da fase de research (leitor tardio expõe pressuposto oculto)

> **Gênero:** leitor tardio (ChatGPT) expõe um pressuposto oculto a partir de uma falha observada —
> mesmo gênero de `2026-05-28-this-session-as-evidence.md` e das obs #8/#9/#10 do `decision-brief.md`.
> **Data:** 2026-05-30. **Origem:** revisão tri-party (owner + Claude + ChatGPT) do gate de
> `[DEC-0024-G00]`. **Status:** evidência-origem do contrato da cadeia cravado em
> `governance-foundation.md` § "Contrato da cadeia" (cf. `[DEC-0024-G06]`).

---

## 1. O output do ChatGPT (preservado, condensado — atribuição: ChatGPT, 2026-05-30)

A leitura tardia partiu de uma observação simples sobre o gate de G00: **a owner chegou ao gate sem
decisão real a tomar.** A research havia refutado A e B e deixado só C "sobrevivente"; o humano
ratificaria, não decidiria.

As leituras sucessivas do ChatGPT (preservadas na ordem em que emergiram):

1. **Resultado ≠ conclusão.** O decision-brief não recebeu o _resultado_ da research (opções vivas com
   tradeoffs), recebeu a _conclusão_ dela (uma resposta única). A causa não é o boilerplate (sintoma
   visível) — é que **a fase de research não tem critério de parada**: ela elimina alternativas
   sucessivamente até restar uma, e nesse instante `research → decisão`, curto-circuitando
   `research → decision-brief → decisão`.

2. **A peça faltante é o contrato de _saída_ da research.** O seam `decision-brief → gate` está bem
   modelado; `spec → research` está relativamente modelado; **`research → decision-brief` não estava
   modelado**. A research precisa de um critério de parada declarado: **para quando há material
   suficiente para uma decisão** — não quando resta uma resposta.

3. **Troca de objetivo.** `objetivo da research = descobrir a verdade` → `objetivo da research =
tornar uma decisão possível`. A falsificação (refutar alternativas) produz entendimento; levada ao
   limite, **consome o espaço de decisão**. Disciplina: ao refutar, reapresentar cada sobrevivente em
   seu **steelman** e separar "o que a evidência mostra" de "o que o humano precisa decidir".

4. **Anti-padrão nomeável.** "Research elimina alternativas até restar uma" = a primeira invasão
   observada de uma fase na responsabilidade da seguinte (research produzindo a saída do
   decision-brief).

5. **Generalização (2ª revisão).** O G00 foi apenas a **primeira vez** que uma fase invadiu a fase
   seguinte. O contrato da cadeia não deve definir só **o que cada fase entrega**, mas também **o que
   cada fase está proibida de entregar** — com o mesmo invariante cobrindo plano (não reabre decisão),
   tasks (não mudam estratégia), implementação (não expande escopo). O **julgamento tem um único lugar
   de autoria: o gate humano** (seta `humano → sistema`, ADR 0018).

6. **Terceiro eixo — escalonamento (3ª revisão).** Proibir sem redirecionar é meio-contrato — e foi a
   pressão que causou o G00 (a research descobriu evidência forte, não tinha rota legítima, **absorveu**
   a decisão). O contrato precisa responder também: **o que uma fase faz ao descobrir algo da alçada de
   outra?** Verbo canônico: **escalar** (devolver à fase dona, com a evidência), **não bloquear nem
   absorver**. O destino depende da **classe da descoberta**, não da fase de origem.

---

## 2. Síntese — como isso virou o contrato da cadeia

O output acima foi cristalizado, sem expandir escopo, em três eixos por fase
(`produz · proibido · escala para`) em `governance-foundation.md` § "Contrato da cadeia":

- **Critério de parada da research** (leitura #2/#3) → subseção "Critério de saída da fase de research", com os **modos de gate** `escolha` / `aceitação`.
- **Invariante geral** (leitura #5) → tabela do contrato + anti-padrão #6.
- **Escalonamento** (leitura #6) → subseção "Mecanismos de escalonamento" com **roteamento por classe
  de descoberta**, reusando primitivos já existentes (amendment / nova `[DEC]`, `plan.md` § "Decisões
  revisitadas", obs no preâmbulo, `NEXT.md`) — sem automação, sem artefato novo.

> **Refinamento (owner, 2026-05-30) — `steelman` → `comparabilidade`:** a sugestão de "steelman"
> (leitura #3 acima, preservada como evidência) foi **superseada** na cristalização. Steelman é
> _advocacy_ (o caso mais forte **a favor** de cada opção); o brief **não deve convencer** — deve
> tornar o espaço de decisão **visível e comparável**. O contrato protege então **simetria
> informacional** (toda opção sobrevivente responde ao mesmo conjunto mínimo de perguntas — _problema ·
> benefícios · tradeoffs · riscos · quando escolher · quando NÃO escolher_, inclusive a recomendada),
> não steelman. A falha do G00 não foi ausência de steelman; foi **assimetria informacional** (uma
> opção rica, outra pobre = decisão já tomada). Cravado em `governance-foundation.md` § "Contrato da
> cadeia" (disciplina "comparabilidade, não advocacy").

**Ligação a G00:** o gate de `[DEC-0024-G00]` é re-enquadrado para `Modo de gate: aceitação` — a owner
recebe um ato real (aceitar C / rejeitar / reenquadrar a identidade), em vez de A/B/C com tudo menos
uma já refutado. G00 permanece `Pendente`; o contrato da cadeia é decisão de processo separada,
cravada em `[DEC-0024-G06]`.

**Falsificável por:** uma fase da cadeia cuja saída legítima coincida com a entrada da seguinte (o
contrato seria redundante); ou uma classe de descoberta sem destino canônico entre os primitivos
existentes (forçaria um artefato novo — sinal de que a tabela de roteamento está incompleta).
