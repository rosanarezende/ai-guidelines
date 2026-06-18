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

O build preserva o Flow visual atual em `/flow/` e gera a entrada React em `/`.
O site não é publicado no pacote npm; consumidores continuam recebendo apenas o runtime e os artefatos governados necessários.
