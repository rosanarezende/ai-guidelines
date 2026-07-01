---
node: intent-brief
kind: incident
sealed: true
---

# Intent — hook pre-commit quebrou commits no Windows

## Kernel

- **Pretendemos:** restaurar commits no Windows
- **Fazendo:** corrigir o resolve do hook
- **Saberemos por:** commit limpo em máquina Windows
- **Pronto quando:** reproduzir e passar

## Corpo (`kind: incident`)

- ⊛ **Severidade:** alta (bloqueia qualquer commit no SO afetado)
- **O que quebrou + impacto:** lint-staged não achava o binário; todo commit falhava
- **Linha do tempo:** 14:02 1º relato · 14:20 reproduzido · 14:55 corrigido
- **Mitigação / recuperação:** prepend do dir do fnm ao PATH do hook
- **Causa raiz:** toolchain fora do PATH padrão em sessão não-login
- **Prevenção / follow-ups:** doctor check do PATH; nota no onboarding

> `incident` é reativo: o doc é **vivo** (acrescenta causa-raiz/prevenção); não sela como o experiment.
