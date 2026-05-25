#!/usr/bin/env node
/**
 * Testes para Enhancements pendentes - InvestPop
 *
 * Estes testes devem FALHAR antes da implementação e PASSAR depois.
 *
 * #6  - Mostrar em quais tops o FII aparece na página de detalhe
 * #11 - Focar automaticamente no campo ao abrir busca mobile
 * #18 - Abas de filtro temporal no console (Hoje, Esta Semana, Mais Antigo)
 * #19 - Bug: abas no gerador + mensagem vazio
 * #20 - Remover campo de filtro/busca do console
 * #21 - Gráfico estilo cardiograma (line)
 * #22 - Bug: console quebrado (JS syntax, botão perdido, tabela visível sem dados)
 * #23 - Bug: remover botão Limpar do console
 * #24 - Trocar "Esta Semana" por "Ontem", ajustar "Mais Antigo"
 *
 * Execução: nvm use 20 && node tests/validacao-enhancements.js
 */
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const PAGES_DIR = path.resolve(__dirname, '../pages')

let totalPassou = 0
let totalFalhou = 0

// ===============================
// #6 - Card de tops na página de detalhe
// ===============================

async function testarCardTops() {
    console.log('\n🔍 TESTE 1 — Card "Em quais tops aparece" na página de detalhe (#6)')

    // HCTR11 aparece no Top DY (#4) e Top Baratos (#1)
    const html = fs.readFileSync(path.join(PAGES_DIR, 'fiis', 'HCTR11.html'), 'utf-8')

    const temCardTops = html.includes('Aparece nos Rankings') || html.includes('tops') || html.includes('Rankings que participa')
    const temTopDY = html.includes('Mais Pagam') || html.includes('Top DY')
    const temTopBaratos = html.includes('Mais Baratos') || html.includes('Top P/VP')

    if (temCardTops && temTopDY && temTopBaratos) {
        totalPassou++
        console.log('   ✅ HCTR11: card de tops presente com DY e Baratos')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ HCTR11: card tops=' + temCardTops + ' topDY=' + temTopDY + ' topBaratos=' + temTopBaratos)
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarCardTopsMultiplos() {
    console.log('\n🔍 TESTE 2 — FII que não aparece em nenhum top não mostra card (#6)')

    // Pegar um FII que provavelmente não está em nenhum top 5
    const arquivos = fs.readdirSync(path.join(PAGES_DIR, 'fiis')).filter(f => f.endsWith('.html'))
    // Ler a index pra saber quais estão nos tops
    const indexHtml = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf-8')

    let fiiForaDoTop = null
    for (const arq of arquivos) {
        const ticker = arq.replace('.html', '')
        // Verificar se aparece nas tabelas de ranking da index (top 5)
        const regex = new RegExp('hover:underline">' + ticker + '</a></td><td class="py-2.5 text-right')
        if (!regex.test(indexHtml)) {
            fiiForaDoTop = ticker
            break
        }
    }

    if (!fiiForaDoTop) {
        console.log('   ⚠️ Não encontrou FII fora dos tops, pulando')
        totalPassou++
        console.log('   Status: ✅ PASSOU')
        return
    }

    const html = fs.readFileSync(path.join(PAGES_DIR, 'fiis', fiiForaDoTop + '.html'), 'utf-8')
    const temCardTops = html.includes('Aparece nos Rankings') || html.includes('Rankings que participa')

    if (!temCardTops) {
        totalPassou++
        console.log('   ✅ ' + fiiForaDoTop + ': sem card de tops (correto, não está em nenhum top 5)')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ ' + fiiForaDoTop + ': card de tops presente mas não deveria')
        console.log('   Status: ❌ FALHOU')
    }
}

// ===============================
// #11 - Foco automático no campo de busca mobile
// ===============================

async function testarFocoAutomatico(browser) {
    console.log('\n🔍 TESTE 3 — Foco automático no campo ao abrir busca mobile (#11)')

    const page = await browser.newPage()
    await page.setViewport({ width: 414, height: 896 })
    await page.goto('file://' + path.join(PAGES_DIR, 'index.html'), { waitUntil: 'domcontentloaded' })
    await new Promise(r => setTimeout(r, 500))

    const resultado = await page.evaluate(() => {
        var btns = document.querySelectorAll('button')
        var lupaBtn = null
        btns.forEach(function(b) {
            if (b.querySelector('path[d*="M21 21l-6-6"]') && b.offsetHeight > 0) lupaBtn = b
        })
        if (!lupaBtn) return { erro: 'lupa não encontrada' }
        lupaBtn.click()

        return new Promise(resolve => {
            setTimeout(() => {
                var input = document.getElementById('busca-mob-input')
                var focado = document.activeElement === input
                resolve({ focado: focado })
            }, 300)
        })
    })

    await page.close()

    if (resultado.focado) {
        totalPassou++
        console.log('   ✅ Campo de busca recebe foco automaticamente ao abrir')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Campo de busca NÃO recebeu foco ao abrir: ' + (resultado.erro || ''))
        console.log('   Status: ❌ FALHOU')
    }
}

// ===============================
// #18 - Abas de filtro temporal no console
// ===============================

async function testarAbasTemporalConsole() {
    console.log('\n🔍 TESTE 4 — Abas de filtro temporal no console (#18/#24)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'console.html'), 'utf-8')

    const temAbaHoje = html.includes('data-periodo="hoje"')
    const temAbaOntem = html.includes('data-periodo="ontem"')
    const temAbaAntigo = html.includes('data-periodo="antigo"')

    if (temAbaHoje && temAbaOntem && temAbaAntigo) {
        totalPassou++
        console.log('   ✅ Console tem abas: Hoje, Ontem, Mais Antigo')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Abas faltando: hoje=' + temAbaHoje + ' ontem=' + temAbaOntem + ' antigo=' + temAbaAntigo)
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarAbaHojePadrao(browser) {
    console.log('\n🔍 TESTE 5 — Aba "Hoje" selecionada por padrão no console (#18)')

    const page = await browser.newPage()
    await page.goto('file://' + path.join(PAGES_DIR, 'console.html'), { waitUntil: 'domcontentloaded' })
    await new Promise(r => setTimeout(r, 500))

    const resultado = await page.evaluate(() => {
        var abaHoje = document.querySelector('[data-periodo="hoje"]')
        if (!abaHoje) return { encontrou: false }
        var classes = abaHoje.className
        var ativo = classes.includes('emerald') || classes.includes('active') || abaHoje.getAttribute('aria-selected') === 'true'
        return { encontrou: true, ativo: ativo }
    })

    await page.close()

    if (resultado.encontrou && resultado.ativo) {
        totalPassou++
        console.log('   ✅ Aba "Hoje" está ativa por padrão')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Aba "Hoje" não está ativa: encontrou=' + resultado.encontrou + ' ativo=' + (resultado.ativo || false))
        console.log('   Status: ❌ FALHOU')
    }
}

// ===============================
// #19 - Bug: gerador deve ter abas + mensagem quando sem registros
// ===============================

async function testarGeradorTemAbas() {
    console.log('\n🔍 TESTE 6 — Gerador pagina-console.js inclui abas temporais (#19)')

    const src = fs.readFileSync(path.resolve(__dirname, '../generators/pagina-console.js'), 'utf-8')
    const temAbas = src.includes('data-periodo="hoje"') && src.includes('data-periodo="ontem"') && src.includes('data-periodo="antigo"')

    if (temAbas) {
        totalPassou++
        console.log('   ✅ Gerador inclui abas temporais')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Gerador NÃO inclui abas temporais')
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarMensagemVazio() {
    console.log('\n🔍 TESTE 7 — Mensagem quando não há registros no período (#19)')

    const js = fs.readFileSync(path.resolve(__dirname, '../assets/console.js'), 'utf-8')
    const temMsgVazio = js.includes('Nenhum acesso registrado') || js.includes('nenhum-registro') || js.includes('msg-vazio')

    if (temMsgVazio) {
        totalPassou++
        console.log('   ✅ console.js tem mensagem para lista vazia')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ console.js NÃO tem mensagem para lista vazia')
        console.log('   Status: ❌ FALHOU')
    }
}

// ===============================
// #20 - Remover campo de filtro/busca do console
// ===============================

async function testarSemFiltro() {
    console.log('\n🔍 TESTE 8 — Console sem campo de filtro/busca (#20)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'console.html'), 'utf-8')
    const temFiltro = html.includes('id="busca"') && html.includes('Filtrar por IP')

    if (!temFiltro) {
        totalPassou++
        console.log('   ✅ Campo de filtro removido do console')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Campo de filtro ainda presente no console')
        console.log('   Status: ❌ FALHOU')
    }
}

// ===============================
// #21 - Gráfico estilo cardiograma (line)
// ===============================

async function testarGraficoLine() {
    console.log('\n🔍 TESTE 9 — Gráfico tipo line (cardiograma) no console (#21)')

    const js = fs.readFileSync(path.resolve(__dirname, '../assets/console.js'), 'utf-8')
    const temLine = js.includes("type: 'line'") || js.includes('type:"line"')
    const semBar = !js.includes("type: 'bar'") && !js.includes('type:"bar"')

    if (temLine && semBar) {
        totalPassou++
        console.log('   ✅ Gráfico é tipo line (cardiograma)')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Gráfico não é line: temLine=' + temLine + ' semBar=' + semBar)
        console.log('   Status: ❌ FALHOU')
    }
}

// ===============================
// #22 - Bug: console quebrado
// ===============================

async function testarConsoleSemErroJS(browser) {
    console.log('\n🔍 TESTE 10 — Console carrega sem erros de JS (#22)')

    const page = await browser.newPage()
    var erros = []
    page.on('pageerror', function(e) { erros.push(e.message) })
    await page.goto('file://' + path.join(PAGES_DIR, 'console.html'), { waitUntil: 'domcontentloaded' })
    await new Promise(r => setTimeout(r, 500))

    const resultado = await page.evaluate(() => {
        return {
            temSetPeriodo: typeof setPeriodo === 'function',
            temLimparDados: typeof limparDados === 'function',
            temAplicarFiltros: typeof aplicarFiltros === 'function'
        }
    })

    await page.close()

    if (erros.length === 0 && resultado.temSetPeriodo && resultado.temLimparDados && resultado.temAplicarFiltros) {
        totalPassou++
        console.log('   ✅ Console carrega sem erros, funções disponíveis')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Erros: ' + JSON.stringify(erros) + ' Funções: ' + JSON.stringify(resultado))
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarTabelaEscondidaSemDados(browser) {
    console.log('\n🔍 TESTE 11 — Tabela escondida e msg visível quando sem registros (#22)')

    const page = await browser.newPage()
    await page.goto('file://' + path.join(PAGES_DIR, 'console.html'), { waitUntil: 'domcontentloaded' })
    await new Promise(r => setTimeout(r, 500))

    const resultado = await page.evaluate(() => {
        var tabela = document.getElementById('tabela-console')
        var msg = document.getElementById('msg-vazio')
        var tabelaVisivel = tabela && tabela.style.display !== 'none'
        var msgVisivel = msg && !msg.classList.contains('hidden')
        return { tabelaVisivel: tabelaVisivel, msgVisivel: msgVisivel }
    })

    await page.close()

    // Sem dados carregados (fetch falha em file://), tabela deve estar escondida e msg visível
    if (!resultado.tabelaVisivel && resultado.msgVisivel) {
        totalPassou++
        console.log('   ✅ Tabela escondida, mensagem "Nenhum acesso" visível')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ tabelaVisivel=' + resultado.tabelaVisivel + ' msgVisivel=' + resultado.msgVisivel)
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarCardTopsAltasQuedas() {
    console.log('\n🔍 TESTE 13 — Card tops inclui Top 5 Altas/Quedas do dia (#32)')

    const indexHtml = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf-8')

    // Extrair primeiro ticker do top altas
    const altasMatch = indexHtml.match(/panel-altas[\s\S]{0,3000}?<\/table>/)
    const tickerAlta = altasMatch ? (altasMatch[0].match(/hover:underline">([A-Z0-9]+)<\/a>/) || [])[1] : null

    // Extrair primeiro ticker do top quedas
    const quedasMatch = indexHtml.match(/panel-quedas[\s\S]{0,3000}?<\/table>/)
    const tickerQueda = quedasMatch ? (quedasMatch[0].match(/hover:underline">([A-Z0-9]+)<\/a>/) || [])[1] : null

    let ok = true

    if (tickerAlta) {
        const html = fs.readFileSync(path.join(PAGES_DIR, 'fiis', tickerAlta + '.html'), 'utf-8')
        const temAlta = html.includes('Maior Alta') || html.includes('Maiores Altas')
        if (temAlta) {
            console.log('   ✅ ' + tickerAlta + ': aparece como Maior Alta no card')
        } else {
            ok = false
            console.log('   ❌ ' + tickerAlta + ': está no top altas mas NÃO aparece no card')
        }
    }

    if (tickerQueda) {
        const html = fs.readFileSync(path.join(PAGES_DIR, 'fiis', tickerQueda + '.html'), 'utf-8')
        const temQueda = html.includes('Maior Queda') || html.includes('Maiores Quedas')
        if (temQueda) {
            console.log('   ✅ ' + tickerQueda + ': aparece como Maior Queda no card')
        } else {
            ok = false
            console.log('   ❌ ' + tickerQueda + ': está no top quedas mas NÃO aparece no card')
        }
    }

    if (!tickerAlta && !tickerQueda) {
        console.log('   ⚠️ Não encontrou tickers de altas/quedas na index')
        ok = true
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarSemBotaoVoltar() {
    console.log('\n🔍 TESTE 14 — Páginas Ver Todos sem botão Voltar (#33)')

    const paginas = ['altas.html', 'quedas.html', 'ranking-dy.html', 'ranking-baratos.html', 'ranking-valorizacao.html', 'ranking-consistentes.html']
    let ok = true

    for (const p of paginas) {
        const html = fs.readFileSync(path.join(PAGES_DIR, p), 'utf-8')
        if (html.includes('&larr; Voltar') || html.includes('← Voltar')) {
            ok = false
            console.log('   ❌ ' + p + ': ainda tem botão Voltar')
        }
    }

    if (ok) {
        totalPassou++
        console.log('   ✅ Nenhuma página Ver Todos tem botão Voltar')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarPaginaAcoes() {
    console.log('\n🔍 TESTE 15 — Página de ações gerada com dados (#34)')

    const acoes = path.join(PAGES_DIR, 'acoes.html')
    if (!fs.existsSync(acoes)) {
        totalFalhou++
        console.log('   ❌ acoes.html não existe')
        console.log('   Status: ❌ FALHOU')
        return
    }

    const html = fs.readFileSync(acoes, 'utf-8')
    let ok = true

    const checks = {
        ibov: html.includes('IBOV Hoje'),
        altas: html.includes('Maiores Altas do Dia'),
        quedas: html.includes('Maiores Quedas do Dia'),
        rankDY: html.includes('Mais Pagam'),
        rankPL: html.includes('Mais Baratos') && html.includes('P/L'),
        rankVar: html.includes('Valoriza'),
        rankCons: html.includes('Consistentes'),
        navAcoes: html.includes('acoes.html'),
    }

    const falhas = Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k)
    if (falhas.length > 0) {
        ok = false
        console.log('   ❌ Faltando: ' + falhas.join(', '))
    }

    // Verificar que tem tickers reais
    const temTicker = html.match(/hover:underline">([A-Z]{4}\d{1,2})<\/a>/)
    if (!temTicker) { ok = false; console.log('   ❌ Sem tickers de ações') }

    // Verificar páginas auxiliares
    const auxiliares = ['acoes-altas.html', 'acoes-quedas.html', 'acoes-ranking-dy.html', 'acoes-ranking-baratos.html', 'acoes-ranking-valorizacao.html', 'acoes-ranking-consistentes.html']
    for (const a of auxiliares) {
        if (!fs.existsSync(path.join(PAGES_DIR, a))) { ok = false; console.log('   ❌ ' + a + ' não existe') }
    }

    if (ok) {
        totalPassou++
        console.log('   ✅ Página de ações completa (IBOV, altas/quedas, rankings com P/L, páginas auxiliares)')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarTooltipsAcoes() {
    console.log('\n🔍 TESTE 16 — Tooltips informativos nos rankings de ações (#35)')

    const paginas = ['acoes-ranking-dy.html', 'acoes-ranking-baratos.html', 'acoes-ranking-valorizacao.html', 'acoes-ranking-consistentes.html']
    let ok = true

    for (const p of paginas) {
        const filePath = path.join(PAGES_DIR, p)
        if (!fs.existsSync(filePath)) { ok = false; console.log('   ❌ ' + p + ' não existe'); continue }
        const html = fs.readFileSync(filePath, 'utf-8')
        if (!html.includes('tooltip-trigger') || !html.includes('tooltip-col')) {
            ok = false
            console.log('   ❌ ' + p + ': sem tooltip')
        }
    }

    if (ok) {
        totalPassou++
        console.log('   ✅ Todos os rankings de ações têm tooltips')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarSemHamburguer() {
    console.log('\n🔍 TESTE 17 — Header mobile sem botão hamburguer (#36)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf-8')
    const temHamburguer = html.includes('M4 6h16M4 12h16M4 18h16')

    if (!temHamburguer) {
        totalPassou++
        console.log('   ✅ Botão hamburguer removido do header mobile')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Botão hamburguer ainda presente')
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarDetalheAcoes() {
    console.log('\n🔍 TESTE 18 — Páginas de detalhe de ações existem (#37)')

    const pastaAcoes = path.join(PAGES_DIR, 'acoes')
    if (!fs.existsSync(pastaAcoes)) {
        totalFalhou++
        console.log('   ❌ Pasta pages/acoes/ não existe')
        console.log('   Status: ❌ FALHOU')
        return
    }

    const arquivos = fs.readdirSync(pastaAcoes).filter(f => f.endsWith('.html'))
    if (arquivos.length >= 70) {
        totalPassou++
        console.log('   ✅ ' + arquivos.length + ' páginas de detalhe de ações geradas')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Apenas ' + arquivos.length + ' páginas (esperado >= 70)')
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarBuscaUnificada() {
    console.log('\n🔍 TESTE 19 — Busca inclui FIIs e ações (#38)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'acoes.html'), 'utf-8')
    // Deve ter PETR4 ou VALE3 na lista de busca
    const temAcao = html.includes('PETR4') || html.includes('VALE3')
    // Deve ter HGLG11 ou MXRF11 na lista de busca
    const temFii = html.includes('HGLG11') || html.includes('MXRF11')

    const indexHtml = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf-8')
    const indexTemAcao = indexHtml.includes('PETR4') || indexHtml.includes('VALE3')

    if (temAcao && temFii && indexTemAcao) {
        totalPassou++
        console.log('   ✅ Busca unificada: ações.html tem FIIs+Ações, index.html tem Ações')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ acoes temAcao=' + temAcao + ' temFii=' + temFii + ' indexTemAcao=' + indexTemAcao)
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarBotaoLimparRemovido() {
    console.log('\n🔍 TESTE 12 — Botão Limpar removido do console (#23)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'console.html'), 'utf-8')
    const temLimpar = html.includes('limparDados()')

    if (!temLimpar) {
        totalPassou++
        console.log('   ✅ Botão Limpar removido do console')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Botão Limpar ainda presente no console')
        console.log('   Status: ❌ FALHOU')
    }
}

// ===============================
// Main
// ===============================

async function main() {
    const startTotal = Date.now()

    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║       TESTES ENHANCEMENTS PENDENTES - InvestPop             ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log('║  #6  Card de tops na página de detalhe                      ║')
    console.log('║  #11 Foco automático na busca mobile                        ║')
    console.log('║  #18 Abas de filtro temporal no console                      ║')
    console.log('║  #19 Bug: gerador com abas + msg vazio                      ║')
    console.log('║  #20 Remover filtro/busca do console                         ║')
    console.log('║  #23 Bug: remover botão Limpar                               ║')
    console.log('║  #24 Trocar "Esta Semana" por "Ontem"                         ║')
    console.log('║  #22 Bug: console quebrado (JS, botão, tabela)                ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')

    await testarCardTops()
    await testarCardTopsMultiplos()

    console.log('\n⏳ Abrindo browser...')
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files'] })
    console.log('✅ Browser pronto')

    await testarFocoAutomatico(browser)
    await testarAbasTemporalConsole()
    await testarAbaHojePadrao(browser)
    await testarGeradorTemAbas()
    await testarMensagemVazio()
    await testarSemFiltro()
    await testarGraficoLine()
    await testarConsoleSemErroJS(browser)
    await testarTabelaEscondidaSemDados(browser)
    await testarBotaoLimparRemovido()
    await testarCardTopsAltasQuedas()
    await testarSemBotaoVoltar()
    await testarPaginaAcoes()
    await testarTooltipsAcoes()
    await testarSemHamburguer()
    await testarDetalheAcoes()
    await testarBuscaUnificada()

    await browser.close()

    const elapsed = ((Date.now() - startTotal) / 1000).toFixed(1)
    console.log('\n╔══════════════════════════════════════════════════════════════╗')
    console.log('║          RESUMO                                             ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log(`║  ✅ Passou: ${totalPassou}                                              ║`)
    console.log(`║  ❌ Falhou: ${totalFalhou}                                              ║`)
    console.log(`║  ⏱️  Tempo total: ${elapsed}s                                      ║`)
    console.log('╚══════════════════════════════════════════════════════════════╝')

    process.exit(totalFalhou > 0 ? 1 : 0)
}

main().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1) })
