# InvestPop - Contexto do Projeto

## O que é
Radar de FIIs (Fundos Imobiliários) brasileiro. Site estático gerado por Node.js, deploy via GitHub Pages. Atualiza automaticamente via GitHub Actions.

## Arquitetura
- `gerar.js` — Script principal. Busca dados, gera HTML estático, salva cache.
- `generators/pagina-index.js` — Gera index.html (resumo, altas/quedas, rankings)
- `generators/pagina-lista.js` — Gera páginas "Ver todos" e rankings completos
- `generators/pagina-detalhe.js` — Gera 107 páginas de detalhe em pages/fiis/
- `generators/componentes.js` — Header, footer, head compartilhados (aceita basePath)
- `assets/busca.js` — Busca compartilhada (desktop dropdown + mobile overlay)
- `data/lista_fiis.txt` — 107 tickers do IFIX
- `data/cache_full.json` — Cache local (gitignored), usado com --cache
- `pages/` — HTML gerado (index, altas, quedas, rankings, console, fiis/)
- `pages/fiis/` — 107 páginas de detalhe ({TICKER}.html)
- `tests/` — 4 suites de testes standalone (não Jest)

## Fontes de dados
- **Investidor 10** (produção): DY, P/VP, consistência, dividendos, nome, CNPJ, tipo, segmento, patrimônio, cotistas, taxa adm. 2 chamadas por ticker (principal + /dividendos/). Delay 500ms entre chamadas.
- **Yahoo Finance** (produção): Preço, variação dia, variação YTD. Batch de 20 via spark endpoint.
- **Status Invest** (só testes): Crosscheck de DY e P/VP.
- Exceções conhecidas: BTAL11, PCIP11, RBFM11 (DY diverge por amortização), SNCI11 (YTD diverge).

## Deploy
- GitHub Actions: `.github/workflows/gerar.yml`
- Cron: 1x por hora, 08:00-23:00 BRT, todos os dias (fase de teste)
- Copia pages/*.html, pages/fiis/*.html, pages/busca.js, assets/console.js, robots.txt, sitemap.xml, og-image.svg para _site/
- Manual: `gh workflow run gerar.yml`

## Problemas conhecidos do iOS Safari
- bfcache restaura estado do DOM → usar `pageshow` com `e.persisted` para limpar overlays/modals
- Focus em input não abre teclado se dentro de setTimeout → chamar focus() direto no handler do tap
- Zoom automático em inputs com font-size < 16px → usar text-base (16px) nos inputs mobile

## Convenções
- Tickers sempre UPPERCASE (ex: HCTR11)
- URLs de detalhe: /fiis/TICKER.html
- Links de tickers: hover:underline (sem mudança de cor)
- FIIS_BASE: 'fiis/' nas páginas raiz, '' nas páginas dentro de fiis/
- Busca: só mostra ticker (sem nome do fundo)
- Versioning: vX.Y.Z (major.minor.patch)
- Commits: conventional commits (feat:, fix:, docs:, ci:, refactor:, test:)
- Issues: closes #N no commit message para fechar automaticamente
