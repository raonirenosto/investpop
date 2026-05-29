# InvestPop

https://raonirenosto.github.io/investpop/

## Versões

- **v0.1.0** — Protótipo estático com TailwindCSS
- **v0.2.0** — Script gerador com mfinance API + GitHub Actions (deploy a cada 10min) + modal "Em breve"
- **v0.3.0** — Páginas Ver Todos com busca, refatoração em módulos, cache local, IFIX via Yahoo Finance
- **v0.4.0** — Console de acessos com tracking, ícones SVG, bandeiras, gráfico Chart.js, refatoração em módulos
- **v0.4.1** — Fix tracking (ipapi.co → freeipapi.com), console responsivo, ícones browser corrigidos, filtro bots padrão com gráfico
- **v0.5.0** — Refatoração em pastas (generators/, data/, assets/, pages/), SEO (robots.txt, sitemap, JSON-LD, og:image), testes com Jest
- **v0.6.0** — Rankings com dados reais (DY via Investidor 10, Var.Ano YTD, Consistência mfinance+Yahoo), validação cruzada com múltiplas fontes
- **v0.7.0** — Páginas de detalhe (107 FIIs), busca global, simulador de renda, tooltips educativos, cache local, deploy B3 30min, 15 testes automatizados
- **v0.7.1** — Fix busca mobile (cancelar + tap fora), busca tablet retrato, tabs ranking responsivas
- **v0.7.2** — Favicon SVG personalizado (gráfico verde), footer visível em todas as telas
- **v0.7.3** — Fix busca mobile completo (tap fora, path 404, sugestões no detalhe, histórico limpo), 8 testes de busca
- **v0.8.0** — Card "Aparece nos Rankings" nos detalhes, foco automático busca mobile, fix iOS focus, 16 testes automatizados
- **v0.8.1** — Fix overlay busca ao voltar no iOS Safari (pageshow/bfcache), 9 testes de busca
- **v0.8.2** — Fix modal "Em breve" ao voltar no iOS Safari, 10 testes de busca
- **v0.8.3** — Fix zoom iOS no input da busca mobile (font-size 16px), 11 testes de busca
- **v0.8.4** — Remove itens desnecessários do header (Ferramentas, Sobre, Contato, engrenagem), 12 testes de busca
- **v0.8.5** — Fix link FIIs (navega para index.html em vez de modal), detalhes regenerados no --cache, 13 testes de busca
- **v0.9.0** — Abas de filtro temporal no console (Hoje, Esta Semana, Mais Antigo), aba Hoje ativa por padrão, 5 testes enhancements
- **v0.9.1** — Fix abas no gerador/deploy, msg "Nenhum acesso" quando vazio, remove filtro, gráfico cardiograma (line), 9 testes enhancements
- **v0.9.2** — Fix console quebrado (syntax JS, botão Limpar posicionado, tabela escondida sem dados, console.js no gerar), 12 testes enhancements
- **v0.9.3** — Remove botão Limpar, troca aba "Esta Semana" por "Ontem" (filtro dinâmico), "Mais Antigo" = tudo antes de ontem, 12 testes enhancements
- **v0.9.4** — Fix lupa mobile dispara modal "Em breve" no iPhone (#29), fix link FIIs no bottom nav (#17), 14 testes de busca
- **v0.9.5** — Fix foco busca mobile em páginas de detalhe iOS (#30), teste foco em todas as páginas (mobile+tablet), 15 testes de busca
- **v0.9.8** — Fix nome da empresa em ações via ibov_acoes.csv (#46), busca com nomes corretos, 20 testes enhancements
- **v0.9.8** — Card "Aparece nos Rankings" inclui Top 5 Altas/Quedas do dia (#32), 13 testes enhancements
- **v0.9.7** — Remove botão Voltar das páginas Ver Todos/Rankings (#33), 14 testes enhancements
- **v1.0.0** — Seção de Ações (IBOV): radar do dia, altas/quedas, rankings (DY, P/L, YTD, consistência), navegação FIIs/Ações, 15 testes enhancements
- **v1.0.1** — Tooltips informativos nos rankings de ações (#35), remove botão hamburguer mobile (#36), 17 testes enhancements
- **v1.0.2** — Fix detalhe ações 404 (#37), busca unificada FIIs+Ações (#38), 80 páginas de detalhe, 19 testes enhancements
- **v1.0.3** — Fix tooltips na index de ações (#39), fix busca no detalhe de ações (#40), 19 testes enhancements
- **v1.1.0** — Busca unificada todas as páginas (#44), consistência anual ações (#41), detalhe ações completo (#42), busca por nome (#43), 19 testes enhancements
- **v1.2.0** — Simulador anual ações (#47), consistência por anos pagos (#48), remove consistência de Rentabilidade (#49), card rankings posição real (#50/#52), nome empresa na busca (#51), fix foco iOS (#53), transição fade-in (#54), 22 testes enhancements
- **v1.3.0** — Sincronização IBOV via API B3 (#60), histórico de mudanças (#61), console como hub admin (#62), remove lista_acoes.txt, 79 ações atualizadas, 22 testes enhancements
- **v1.4.0** — Nomes populares (#63), foco iOS (#64), busca sem acento (#65), filtro bots (#66), descrições ações (#67/#68), consistência ano vigente (#69), fix JSCP (#70), simulador padronizado (#71), msg sem dividendos (#72), transição logo animado (#73/#74), SEO 200 URLs (#75), fix zoom filtro (#76)
- **v1.4.1** — Sincronização IFIX via API B3 (#77), histórico de mudanças IFIX, console com link IFIX, remove lista_fiis.txt
- **v1.4.2** — Fix simulador ações usa DY em vez de somar proventos (#82), corrige Klabin e outras com pagamento mensal
- **v1.4.2** — Esconder simulador sem DY (#78), paginação rendimentos FIIs+Ações (#79), remover limite 10 rendimentos ações (#80), 27 testes enhancements
- **v1.4.3** — Filtro bots melhorado: resolução quadrada, UA contraditório, Chrome antigo, cidades datacenter (#81), 28 testes enhancements
