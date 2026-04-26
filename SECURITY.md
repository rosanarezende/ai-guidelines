# Política de Segurança

## Versões suportadas

| Versão      | Suporte                             |
| ----------- | ----------------------------------- |
| 1.x (atual) | ✅ Recebe atualizações de segurança |
| < 1.0       | ❌ Sem suporte                      |

---

## Reportar uma vulnerabilidade

**Não abra uma issue pública para vulnerabilidades de segurança.**

Se você encontrou uma vulnerabilidade ou um problema de segurança neste
repositório, por favor reporte de forma privada:

### Opção 1 — GitHub Private Vulnerability Reporting (preferido)

Use o recurso nativo do GitHub:

1. Acesse a aba **Security** deste repositório
2. Clique em **Report a vulnerability**
3. Preencha o formulário com detalhes do problema

Documentação: https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository

### Opção 2 — E-mail direto

Envie para: **contato@rosanarezende.com**

**Inclua no relatório:**

- Descrição do problema e impacto potencial
- Passos para reproduzir
- Versão/branch afetada
- Sugestão de mitigação (se tiver)

---

## O que esperar

- **Confirmação de recebimento**: até 72 horas
- **Avaliação inicial**: até 7 dias
- **Resolução ou plano de mitigação**: comunicado ao reportante antes de qualquer divulgação pública

---

## Escopo

Este repositório é um **framework de governança e documentação**. O risco de
vulnerabilidades de segurança clássicas (RCE, injeção de dados sensíveis) é
baixo, mas são relevantes:

- Exposição acidental de dados pessoais em commits ou documentação
- Instruções de IA que possam ser exploradas via prompt injection
- Dependências com CVEs conhecidas (`npm audit`)

---

## Agradecimento

Contribuidores que reportarem vulnerabilidades de boa fé serão creditados
nas release notes (se desejarem).

---

_Licença: [Apache-2.0](LICENSE)_
