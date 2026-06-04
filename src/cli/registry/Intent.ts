/**
 * Camada de navegação humana (Spec 0024). SSOT da navegação — distinta da SSOT
 * de execução (Command/Registry). Intent é artefato CURADO/editorial; nunca
 * executa; apenas referencia comandos registrados. Wizard navega
 * `Intent → IntentAction → Command`; execução flui só por Command → Use Case.
 */

/**
 * **Value Object editorial** da navegação (imutável, sem identidade própria).
 * É a aresta curada Intent→Command: a invocação específica (`command` + `args`)
 * que aquele caminho representa, com apresentação contextual (`label`).
 *
 * `args`/`label` são contextuais à Intent — não cabem no Command (que tem um
 * `summary` único e não conhece a navegação). Por isso IntentAction é uma camada
 * própria, não um ponteiro pelado. NÃO carrega lógica nem executa.
 */
export interface IntentAction {
  /** Nome canônico de um comando registrado (FK → Registry). */
  readonly command: string;
  /** Invocação parametrizada curada (ex.: `["list"]` para `insight list`). */
  readonly args?: readonly string[];
  /** Apresentação contextual no menu; default = `summary` do comando. */
  readonly label?: string;
}

/**
 * Caminho de navegação humana, curado editorialmente. Agrupa ações por
 * **intenção** ("o que eu quero fazer"), não por subsistema. Um mesmo comando
 * pode aparecer em várias Intents (multi-path) — basta várias Intents o listarem.
 */
export interface Intent {
  readonly id: string;
  readonly title: string;
  readonly actions: readonly IntentAction[];
}
