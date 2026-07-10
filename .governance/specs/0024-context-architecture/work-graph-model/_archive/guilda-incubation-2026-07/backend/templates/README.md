# Backend Templates

Esta pasta guarda templates operacionais usados pela `governance-demo`.

Eles pertencem ao backend porque descrevem artefatos que o runtime, o scaffold e os comandos
governados precisam conseguir gerar, validar ou explicar. Não são dados da org fictícia `acme-*` e
não são componentes de UI.

## Estrutura

| Pasta         | Conteúdo                               | Uso                                                                                                                 |
| ------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `governance/` | templates YAML de entidades governadas | rascunhos de authoring/scaffold para objective, target, intent, proposal, contract, outcome, standalone e authority |
| `assistant/`  | prompts assistivos determinísticos     | pacote de revisão para extração de capability; a IA sugere, humano revisa, comando/manifesto governado decide       |

## Contrato

- Template não é SSOT. O SSOT da sim fica em `acme/governance/` e `acme/repos/*/.governance/`.
- Template não pode criar mutação silenciosa. Qualquer saída assistida precisa virar proposta
  revisável antes de alterar manifesto, intent, contrato, target ou outcome.
- Se um template passar a ser usado por uma tela ou comando, o caminho deve ser lido via backend,
  não por import direto do frontend.
- Templates históricos da v2 ficam em `../../../_archive/templates-v2/`; a ponte
  `../../../_templates/` existe só para preservar contexto antigo.
