<!--
═════════════════════════════════════════════════════════════════════════════
PERFIL: 🚑 FAST-TRACK (contrato-base comum + perfil por tipo de PR)

Curto, mas rigoroso. Fast-track bypassa o linkage estrutural com a topologia,
NÃO a accountability (ADR 0021 + DEC-0023-E05): exige motivo, risco, rollback,
accountability com conteúdo real, validação proporcional e rastreabilidade.

Requer a label `fast-track` no PR — o `governance-pr-check` seleciona este
perfil pela label. Sem artefatos visuais obrigatórios.

Título: [🚑] [<pillar>] … (fix, patch, incident)
Comentários HTML são intencionais; não usar `<details open>`.
═════════════════════════════════════════════════════════════════════════════
-->

## Incidente ou falha

<!-- O que quebrou/está quebrando; por que não pode esperar o fluxo normal. -->

## Correção

<!-- O que este PR muda, no menor diff possível. -->

## Impacto e risco

<!-- Raio de alcance da mudança; o que pode dar errado; quem é afetado. -->

## Evidência mínima

<!-- Validação proporcional: CI/teste/reprodução que prova a correção. -->

## Rollback

<!-- Como desfazer (ex.: `git revert <sha>`); o que observar após reverter. -->

## Accountability

<!-- Quem responde pela correção + motivo do bypass.
     Ex.: [fast-track: <razão curta>] — @owner responde pela correção. -->

## Validação, evidências e checklist

### Evidências e gates

- CI:
- Review humano:

### Checklist operacional

- [ ] Formatação verde
- [ ] Validação canônica verde
- [ ] Sem secrets, credenciais ou contexto pessoal vazado

## Cross-refs

<!-- Rastreabilidade posterior: issue/PR/spec relacionados; follow-up se a
     correção merecer trabalho estrutural depois. -->

- **Issue/PR**:
- **Follow-up**:

## Disclosure de IA

Implementação assistida por IA.
