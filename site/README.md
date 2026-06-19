# Site governado

Este diretório é o produto de documentação visual do `ai-guidelines`.

## Cloudflare Pages

Use estas opções no setup:

- Framework preset: `React (Vite)`
- Build command: `npm run site:build`
- Build output directory: `site/dist`
- Root directory: `/`
- Production branch: `main`
- Environment variables: nenhuma por enquanto

O build gera a home e as páginas navegáveis do Flow (`/flow/*`) como uma única
aplicação React/Vite. O fallback `site/public/_redirects` permite abrir rotas
diretas como `/flow/time` em previews e produção.
O site não é publicado no pacote npm; consumidores continuam recebendo apenas o runtime e os artefatos governados necessários.

## Imagens otimizadas

As imagens-fonte ficam em `docs/assets/*.png`. O site consome projeções WebP em
`site/src/assets/generated/`, criadas por:

```bash
npm run site:assets:sync
```

O build usa `npm run site:assets:check` para falhar se as projeções WebP estiverem ausentes ou desatualizadas.
