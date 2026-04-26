# Plan — Spec [Número] [Título Curto]

> Spec: [`./spec.md`](./spec.md)
> Status: Draft <!-- Draft | Active | Done -->

> **Vive durante a execução.** Diferente da `spec.md` (imutável após In Review),
> este arquivo é atualizado conforme o entendimento técnico evolui. Decisões
> revisitadas devem registrar a anterior em nota, não apagar o histórico.

---

## 🏗️ Design e Arquitetura

### Princípio guia

Em 2-4 linhas: o "como" estrutural — qual padrão arquitetural orienta a solução,
qual ADR existente estende ou quebra, qual contrato técnico define.

### Componentes ou Sub-blocos

Para cada peça da solução (sub-bloco, módulo, feature):

#### [A | nome do componente]

**Estado atual** (baseline antes da spec):

Descrição do que existe hoje, com paths concretos.

**Decisão**:

O "como" técnico — caminhos de arquivo, contratos, formatos. Diferente do
"o quê" da `spec.md`, este nível responde "exatamente onde e como mexer".

**Mudanças em arquivos**:

- `path/to/file.ext` — descrição da mudança esperada.

---

## ✅ Critérios de Aceite Detalhados (DoD operacional)

Granular, por componente/sub-bloco. Itens marcáveis durante execução.

### Componente [A]

- [ ] DoD operacional 1 (verificável durante implementação).
- [ ] DoD operacional 2.

### Globais (toda a spec)

- [ ] `yarn check` verde.
- [ ] `yarn test` verde (XX/XX testes).
- [ ] Diff em consumidor real revisado: zero quebras.

---

## 🧪 Estratégia de Testes

- **Unit/BDD**: arquivos de teste novos ou ampliados.
- **Integração**: cenários cross-componente.
- **Manual**: smoke tests em ambientes que automação não cobre.

Citar arquivos concretos (`tests/<file>.test.mjs`) quando souber.

---

## 🛠️ Arquivos modificados (esperado)

Lista exaustiva, com 1 linha de motivação por arquivo:

- `path/to/file1` — motivo.
- `path/to/file2` — motivo.

---

## ⚠️ Riscos técnicos (concretos)

Diferente dos riscos macro da `spec.md`, aqui entram riscos específicos por
componente, com mitigação.

| Risco           | Mitigação                               |
| :-------------- | :-------------------------------------- |
| Risco técnico 1 | Como mitigamos (testes, rollback, etc.) |

---

## 📐 Decisões revisitadas

Quando uma decisão de design mudar durante a execução, registrar aqui em vez
de reescrever o texto acima silenciosamente:

- **YYYY-MM-DD** — Decisão X mudou de "abordagem A" para "abordagem B" porque
  [motivo]. Implicação em `tasks.md`: X.Y reescrito.
