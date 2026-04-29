# Quality Gates: Governança de Código Gerado por IA

> **Aviso:** O "Senior Review" humano permanece obrigatório para decisões arquiteturais, capacidade de carga e tradeoffs de longo prazo. Estes gates automatizam a detecção de bugs locais e estrutura de código.

---

## Gates de Aceite (Checklist)

1. **Análise Estática:**
   - Complexidade ciclomática mantida sob controle (módulos pequenos e focados).
   - Ausência de dependências circulares.
   - Nomes de variáveis e funções seguem a semântica do projeto (PT-BR ou EN conforme convenção local).

2. **Cobertura e Mutação:**
   - **Cobertura de Testes:** Mínimo recomendado de **85%**.
   - **Mutation Testing:** Mínimo de **60%** de kill rate (garante que os testes realmente validam a lógica).

3. **Bugs Típicos de IA (Sensores):**
   - **Race Conditions:** Verificação de acessos concorrentes em estado compartilhado.
   - **N+1 Queries:** Verificação de eficiência em loops de dados/APIs.
   - **Memory Leaks:** Fechamento correto de recursos, streams e listeners.
   - _Ferramentas recomendadas:_ Property-based testing (ex: fast-check em JS, Hypothesis em Python).

4. **Security & Secrets:**
   - Bloqueio de submissão de chaves, tokens ou credenciais (mesmo em comentários).
   - Validação de inputs contra injeção de código.

---

## Regras para Agentes de IA

- Ao finalizar uma implementação, execute o checklist acima antes de reportar "done".
- Se algum gate falhar, corrija antes de prosseguir — não delegue ao humano erros detectáveis por automação.
- Em projetos com CI configurado, confirme que o pipeline está verde antes de considerar a tarefa concluída.
