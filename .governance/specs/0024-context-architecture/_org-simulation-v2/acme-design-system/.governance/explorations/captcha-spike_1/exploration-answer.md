---
node: exploration-answer
explores: "captcha/anti-bot no login: o DS provê um componente, ou usamos serviço externo?"
verdict: "viável, mas serviço externo (hCaptcha/Turnstile) cobre melhor com menos custo — NÃO construir no DS agora"
fate: throwaway
---

# Achado

A spike comparou **(a)** um componente de captcha no DS × **(b)** integrar um serviço externo
(hCaptcha / Cloudflare Turnstile). Construir e manter no DS tem **custo alto** (anti-bot evolui rápido,
acessibilidade, telemetria, score) e **payoff baixo agora**. O serviço externo cobre melhor.

# Recomendação

**Não construir no DS agora** — usar serviço externo no login. _(rejeitada como delivery: nenhuma work
nasce dela. Pode virar `proposal` pro backlog se o cenário mudar.)_
