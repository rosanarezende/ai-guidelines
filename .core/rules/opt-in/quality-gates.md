### Quality Gates: Governança de Código Gerado por IA

> **Aviso:** O "Senior Review" humano permanece obrigatório para decisões arquiteturais, capacidade de carga e tradeoffs de longo prazo. Estes gates automatizam a detecção de bugs locais e estrutura de código.

---

#### Gates de Aceite (Checklist)

1. **Análise Estática:**
   - Complexidade ciclomática mantida sob controle (módulos pequenos e focados).
   - Ausência de dependências circulares.
   - Nomes de variáveis e funções seguem a semântica do projeto (PT-BR ou EN conforme convenção local).

2. **Cobertura e Mutação:**
   - **Cobertura de Testes:** Mínimo recomendado de **85%**.
   - **Mutation Testing:** Mínimo de **60%** de kill rate (garante que os testes realmente validam a lógica).

3. **Sensores de Bugs Típicos de IA (Heurísticas obrigatórias):**
   - **Race Conditions:** O agente deve analisar blocos assíncronos (ex: múltiplos `await` concorrentes) que leiam e modifiquem o mesmo estado em memória ou DB. Se não houver garantia de atomicidade (transação, lock ou estado local seguro), o design deve ser rejeitado. _Source canônica: CWE-362; evidência empírica em CONCUR 2025._
   - **Memory Leaks:** Sempre que o agente implementar _listeners_, observadores, subscrições de stream ou timers (`setInterval`), deve compulsoriamente implementar a função de limpeza (teardown/dispose) correspondente no ciclo de vida apropriado do framework usado. _Source canônica: CWE-401; evidência emergente em "Investigating Software Aging in LLM-Generated Software Systems" (2025)._
   - _Ferramentas recomendadas:_ Property-based testing (ex: fast-check em JS, Hypothesis em Python).

4. **Security & Secrets:**
   - Bloqueio de submissão de chaves, tokens ou credenciais (mesmo em comentários).
   - Validação de inputs contra injeção de código.

---

#### Regras para Agentes de IA

- Ao finalizar uma implementação, execute o checklist acima antes de reportar "done".
- Se algum gate falhar, corrija antes de prosseguir — não delegue ao humano erros detectáveis por automação.
- Em projetos com CI configurado, confirme que o pipeline está verde antes de considerar a tarefa concluída.
