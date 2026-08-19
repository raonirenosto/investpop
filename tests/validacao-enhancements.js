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
    const html = fs.readFileSync(path.join(PAGES_DIR, 'fiis', 'HCTR11', 'index.html'), 'utf-8')

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
    console.log('\n🔍 TESTE 2 — Card mostra posição real mesmo fora do Top 5 (#52)')

    // PETR4 provavelmente não está no top 5 de tudo, mas deve mostrar posição real
    const html = fs.readFileSync(path.join(PAGES_DIR, 'acoes', 'PETR4', 'index.html'), 'utf-8')
    const temCard = html.includes('Aparece nos Rankings')
    // Deve ter posição > 5 (ex: #15, #19)
    const temPosGrande = html.match(/#\d{2,}/) !== null

    if (temCard && temPosGrande) {
        totalPassou++
        console.log('   ✅ PETR4: card mostra posição real fora do Top 5')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ PETR4: temCard=' + temCard + ' temPosGrande=' + temPosGrande)
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

    const html = fs.readFileSync(path.join(PAGES_DIR, 'acessos', 'index.html'), 'utf-8')

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
    await page.goto('file://' + path.join(PAGES_DIR, 'acessos', 'index.html'), { waitUntil: 'domcontentloaded' })
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

    const src = fs.readFileSync(path.resolve(__dirname, '../generators/pagina-acessos.js'), 'utf-8')
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

    const html = fs.readFileSync(path.join(PAGES_DIR, 'acessos', 'index.html'), 'utf-8')
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
    await page.goto('file://' + path.join(PAGES_DIR, 'acessos', 'index.html'), { waitUntil: 'domcontentloaded' })
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
    await page.goto('file://' + path.join(PAGES_DIR, 'acessos', 'index.html'), { waitUntil: 'domcontentloaded' })
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
        const html = fs.readFileSync(path.join(PAGES_DIR, 'fiis', tickerAlta, 'index.html'), 'utf-8')
        const temAlta = html.includes('Maior Alta') || html.includes('Maiores Altas')
        if (temAlta) {
            console.log('   ✅ ' + tickerAlta + ': aparece como Maior Alta no card')
        } else {
            ok = false
            console.log('   ❌ ' + tickerAlta + ': está no top altas mas NÃO aparece no card')
        }
    }

    if (tickerQueda) {
        const html = fs.readFileSync(path.join(PAGES_DIR, 'fiis', tickerQueda, 'index.html'), 'utf-8')
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

    const paginas = ['altas', 'quedas', 'ranking-dy', 'ranking-baratos', 'ranking-valorizacao', 'ranking-consistentes']
    let ok = true

    for (const p of paginas) {
        const html = fs.readFileSync(path.join(PAGES_DIR, p, 'index.html'), 'utf-8')
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

    const acoes = path.join(PAGES_DIR, 'acoes', 'index.html')
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
        navAcoes: html.includes('acoes/'),
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
    const auxiliares = ['acoes-altas', 'acoes-quedas', 'acoes-ranking-dy', 'acoes-ranking-baratos', 'acoes-ranking-valorizacao', 'acoes-ranking-consistentes']
    for (const a of auxiliares) {
        if (!fs.existsSync(path.join(PAGES_DIR, a, 'index.html'))) { ok = false; console.log('   ❌ ' + a + ' não existe') }
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
    console.log('\n🔍 TESTE 16 — Tooltips informativos nos rankings de ações (#35/#39)')

    const paginas = ['acoes', 'acoes-ranking-dy', 'acoes-ranking-baratos', 'acoes-ranking-valorizacao', 'acoes-ranking-consistentes']
    let ok = true

    for (const p of paginas) {
        const filePath = path.join(PAGES_DIR, p, 'index.html')
        if (!fs.existsSync(filePath)) { ok = false; console.log('   ❌ ' + p + ' não existe'); continue }
        const html = fs.readFileSync(filePath, 'utf-8')
        if (!html.includes('tooltip-trigger')) {
            ok = false
            console.log('   ❌ ' + p + ': sem tooltip')
        }
    }

    if (ok) {
        totalPassou++
        console.log('   ✅ Todos os rankings de ações têm tooltips (index + ver todos)')
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

    const arquivos = fs.readdirSync(pastaAcoes).filter(f => fs.statSync(path.join(pastaAcoes,f)).isDirectory())
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
    console.log('\n🔍 TESTE 19 — Busca unificada em todas as páginas (#38/#44)')

    const paginas = [
        {file: 'index.html', desc: 'index FIIs'},
        {file: 'acoes/index.html', desc: 'index Ações'},
        {file: 'fiis/HGLG11/index.html', desc: 'detalhe FII'},
        {file: 'acoes/PETR4/index.html', desc: 'detalhe Ação'},
    ]
    let ok = true

    for (const p of paginas) {
        const html = fs.readFileSync(path.join(PAGES_DIR, p.file), 'utf-8')
        // Deve ter apenas 1 declaracao de FIIS_LISTA
        const matches = html.match(/var FIIS_LISTA/g) || []
        if (matches.length > 1) {
            ok = false
            console.log('   ❌ ' + p.desc + ': FIIS_LISTA declarado ' + matches.length + ' vezes (sobrescreve)')
            continue
        }
        // Deve conter FIIs e Ações
        const temFii = html.includes('HGLG11')
        const temAcao = html.includes('PETR4')
        const temAcoesLista = html.includes('ACOES_LISTA')
        if (!temFii || !temAcao || !temAcoesLista) {
            ok = false
            console.log('   ❌ ' + p.desc + ': temFii=' + temFii + ' temAcao=' + temAcao + ' temAcoesLista=' + temAcoesLista)
        }
    }

    if (ok) {
        totalPassou++
        console.log('   ✅ Busca unificada: todas as páginas têm FIIs+Ações, sem duplicação')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarBotaoLimparRemovido() {
    console.log('\n🔍 TESTE 12 — Botão Limpar removido do console (#23)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'acessos', 'index.html'), 'utf-8')
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

async function testarNomeEmpresaAcoes() {
    console.log('\n🔍 TESTE 20 — Nome da empresa correto nas páginas de ações (#46)')

    const csvPath = path.resolve(__dirname, '../data/ibov_acoes.csv')
    if (!fs.existsSync(csvPath)) {
        totalFalhou++
        console.log('   ❌ data/ibov_acoes.csv não encontrado')
        console.log('   Status: ❌ FALHOU')
        return
    }
    const linhas = fs.readFileSync(csvPath, 'utf-8').split('\n').slice(1).filter(l => l.trim())
    const mapa = {}
    for (const l of linhas) {
        const [codigo, acao] = l.split(',')
        if (codigo && acao) mapa[codigo.trim()] = acao.trim()
    }

    const acoesDir = path.join(PAGES_DIR, 'acoes')
    if (!fs.existsSync(acoesDir)) {
        totalFalhou++
        console.log('   ❌ pages/acoes/ não existe')
        console.log('   Status: ❌ FALHOU')
        return
    }

    let ok = true
    const amostra = ['ASAI3', 'VALE3', 'PETR4', 'ITUB4', 'BBAS3']
    for (const ticker of amostra) {
        const filePath = path.join(acoesDir, ticker, 'index.html')
        if (!fs.existsSync(filePath)) continue
        const html = fs.readFileSync(filePath, 'utf-8')
        const nomeEsperado = mapa[ticker]
        if (!nomeEsperado) continue
        // Verificar que o nome aparece ao lado do ticker (no span text-gray-400)
        const temNome = html.includes(nomeEsperado)
        if (temNome) {
            console.log('   ✅ ' + ticker + ': "' + nomeEsperado + '" encontrado')
        } else {
            ok = false
            // Mostrar o que está no lugar
            const match = html.match(new RegExp(ticker + '</h1>\\s*<span[^>]*>([^<]+)</span>'))
            const atual = match ? match[1].trim() : '?'
            console.log('   ❌ ' + ticker + ': esperado "' + nomeEsperado + '", encontrado "' + atual + '"')
        }
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

// ===============================
// Main
// ===============================

async function testarSemSetorIrrelevante() {
    console.log('\n\ud83d\udd0d TESTE 21 \u2014 P\u00e1ginas de a\u00e7\u00f5es sem informa\u00e7\u00f5es irrelevantes do setor (#46)')

    const acoesDir = path.join(PAGES_DIR, 'acoes')
    if (!fs.existsSync(acoesDir)) {
        totalFalhou++
        console.log('   \u274c pages/acoes/ n\u00e3o existe')
        console.log('   Status: \u274c FALHOU')
        return
    }

    let ok = true
    const amostra = ['ASAI3', 'PETR4', 'ITUB4', 'VALE3', 'BBAS3']
    for (const ticker of amostra) {
        const filePath = path.join(acoesDir, ticker, 'index.html')
        if (!fs.existsSync(filePath)) continue
        const html = fs.readFileSync(filePath, 'utf-8')
        // N\u00e3o deve ter texto de setor/subsetor cortado
        const temSetorIrrelevante = html.includes('subsetor de') || html.includes('setor de consumo') || html.includes('setor de utilidade')
        if (!temSetorIrrelevante) {
            console.log('   \u2705 ' + ticker + ': sem informa\u00e7\u00f5es irrelevantes de setor')
        } else {
            ok = false
            console.log('   \u274c ' + ticker + ': cont\u00e9m texto irrelevante de setor')
        }
    }

    if (ok) { totalPassou++; console.log('   Status: \u2705 PASSOU') }
    else { totalFalhou++; console.log('   Status: \u274c FALHOU') }
}

async function testarBuscaMostraNomeEmpresa() {
    console.log('\n\ud83d\udd0d TESTE 22 \u2014 Busca na lupa mostra ticker + nome da empresa (#46)')

    const buscaPath = path.join(PAGES_DIR, 'busca.js')
    if (!fs.existsSync(buscaPath)) {
        totalFalhou++
        console.log('   \u274c pages/busca.js n\u00e3o encontrado')
        console.log('   Status: \u274c FALHOU')
        return
    }

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files'] })
    const page = await browser.newPage()
    await page.goto('file://' + path.join(PAGES_DIR, 'acoes', 'VALE3', 'index.html'), { waitUntil: 'domcontentloaded', timeout: 10000 })
    await new Promise(r => setTimeout(r, 500))

    const resultado = await page.evaluate(() => {
        var input = document.querySelector('nav input[type="text"]')
        if (!input) return { erro: 'input n\u00e3o encontrado' }
        input.value = 'PETRO'
        input.dispatchEvent(new Event('input'))
        return new Promise(resolve => {
            setTimeout(() => {
                var dropdown = input.parentElement.querySelector('[class*="absolute"]')
                if (!dropdown || dropdown.classList.contains('hidden')) {
                    resolve({ erro: 'dropdown n\u00e3o apareceu' })
                    return
                }
                var links = dropdown.querySelectorAll('a')
                var textos = Array.from(links).map(a => a.textContent.trim())
                // Deve conter nome da empresa (n\u00e3o s\u00f3 ticker)
                var temNome = textos.some(t => t.includes('PETROBRAS') || t.includes('Petrobras'))
                resolve({ ok: temNome, textos: textos.slice(0, 3) })
            }, 300)
        })
    })

    await browser.close()

    if (resultado.erro) {
        totalFalhou++
        console.log('   \u274c ' + resultado.erro)
        console.log('   Status: \u274c FALHOU')
        return
    }

    if (resultado.ok) {
        totalPassou++
        console.log('   \u2705 Busca "PETRO" mostra nome da empresa: ' + resultado.textos.join(', '))
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        console.log('   \u274c Busca "PETRO" n\u00e3o mostra nome da empresa. Resultados: ' + resultado.textos.join(', '))
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarDescricaoEmpresaAcoes() {
    console.log('\n\ud83d\udd0d TESTE 24 \u2014 Descri\u00e7\u00e3o curta nas p\u00e1ginas de detalhe de a\u00e7\u00f5es (#67)')

    const acoesDir = path.join(PAGES_DIR, 'acoes')
    if (!fs.existsSync(acoesDir)) {
        totalFalhou++
        console.log('   \u274c pages/acoes/ n\u00e3o existe')
        console.log('   Status: \u274c FALHOU')
        return
    }

    let ok = true
    const amostra = ['VALE3', 'PETR4', 'ITUB4', 'WEGE3', 'ASAI3']
    for (const ticker of amostra) {
        const filePath = path.join(acoesDir, ticker, 'index.html')
        if (!fs.existsSync(filePath)) continue
        const html = fs.readFileSync(filePath, 'utf-8')
        const temDescricao = html.includes('Sobre a Empresa') && html.match(/leading-relaxed[^>]*>[^<]{30,}/)
        if (temDescricao) {
            console.log('   \u2705 ' + ticker + ': tem descri\u00e7\u00e3o')
        } else {
            ok = false
            console.log('   \u274c ' + ticker + ': sem descri\u00e7\u00e3o da empresa')
        }
    }

    if (ok) { totalPassou++; console.log('   Status: \u2705 PASSOU') }
    else { totalFalhou++; console.log('   Status: \u274c FALHOU') }
}

async function testarFiltroBots() {
    console.log('\n\ud83d\udd0d TESTE 23 \u2014 Filtro de bots detecta padr\u00f5es comuns (#66)')

    const consoleJs = fs.readFileSync(path.join(PAGES_DIR, 'admin-console.js'), 'utf-8')

    // Extrair a fun\u00e7\u00e3o isBot
    const isBotMatch = consoleJs.match(/function isBot\(d\)\s*\{([\s\S]*?)\n\}/)
    if (!isBotMatch) {
        totalFalhou++
        console.log('   \u274c fun\u00e7\u00e3o isBot n\u00e3o encontrada em console.js')
        console.log('   Status: \u274c FALHOU')
        return
    }

    // Criar fun\u00e7\u00e3o isBot local para testar
    const isBotFn = new Function('d', isBotMatch[1])

    const bots = [
        { navegador: 'Mozilla/5.0 (compatible; Googlebot/2.1)', cidade: 'Mountain View', resolucao: '0x0' },
        { navegador: 'Mozilla/5.0 (compatible; bingbot/2.0)', cidade: 'Ashburn', resolucao: '1024x768' },
        { navegador: 'Mozilla/5.0 (compatible; AhrefsBot/7.0)', cidade: 'Dublin', resolucao: '800x600' },
        { navegador: 'Mozilla/5.0 (Linux; Android) AppleWebKit HeadlessChrome/120.0', cidade: 'S\u00e3o Paulo', resolucao: '1920x1080' },
        { navegador: 'Mozilla/5.0 (compatible; SemrushBot/7)', cidade: 'Dallas', resolucao: '1024x768' },
        { navegador: 'Mozilla/5.0 (compatible; PetalBot)', cidade: 'Beijing', resolucao: '1024x768' },
        { navegador: 'python-requests/2.28.0', cidade: 'New York', resolucao: '0x0' },
        { navegador: 'Go-http-client/1.1', cidade: 'Frankfurt', resolucao: '0x0' },
        { navegador: 'Mozilla/5.0 (compatible; YandexBot/3.0)', cidade: 'Moscow', resolucao: '1024x768' },
        { navegador: 'curl/7.88.1', cidade: 'London', resolucao: '0x0' },
        { navegador: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/91.0 Safari/537.36', cidade: 'Boardman', resolucao: '800x600', dispositivo: 'Desktop' },
        { navegador: 'facebookexternalhit/1.1', cidade: 'Menlo Park', resolucao: '0x0' },
        { navegador: 'Twitterbot/1.0', cidade: 'San Francisco', resolucao: '0x0' },
        { navegador: 'LinkedInBot/1.0', cidade: 'Sunnyvale', resolucao: '0x0' },
    ]

    const humanos = [
        { navegador: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', cidade: 'S\u00e3o Paulo', resolucao: '390x844', dispositivo: 'Mobile' },
        { navegador: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', cidade: 'Rio de Janeiro', resolucao: '1920x1080', dispositivo: 'Desktop' },
        { navegador: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', cidade: 'Belo Horizonte', resolucao: '1440x900', dispositivo: 'Desktop' },
    ]

    let ok = true
    let falhasBots = []
    let falhasHumanos = []

    for (const b of bots) {
        if (!isBotFn(b)) {
            ok = false
            falhasBots.push(b.navegador.substring(0, 40))
        }
    }
    for (const h of humanos) {
        if (isBotFn(h)) {
            ok = false
            falhasHumanos.push(h.navegador.substring(0, 40))
        }
    }

    if (ok) {
        totalPassou++
        console.log('   \u2705 Filtro detecta ' + bots.length + ' bots e permite ' + humanos.length + ' humanos')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        if (falhasBots.length) console.log('   \u274c Bots n\u00e3o detectados: ' + falhasBots.join(', '))
        if (falhasHumanos.length) console.log('   \u274c Humanos bloqueados: ' + falhasHumanos.join(', '))
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarConsistenciaCorreta() {
    console.log('\n\ud83d\udd0d TESTE 28 \u2014 Consist\u00eancia de a\u00e7\u00f5es usa data de pagamento e come\u00e7a do vigente (#85)')

    const acoesDir = path.join(PAGES_DIR, 'acoes')
    const files = fs.readdirSync(acoesDir).filter(f => fs.statSync(path.join(acoesDir,f)).isDirectory())
    let ok = true
    let erros = []
    const anoVigente = new Date().getFullYear()

    for (const f of files) {
        const ticker = f
        const html = fs.readFileSync(path.join(acoesDir, f, 'index.html'), 'utf-8')

        // Extrair consist\u00eancia mostrada
        const matchConsist = html.match(/text-orange-400 mt-1">(\d+) anos/)
        const consistMostrada = matchConsist ? parseInt(matchConsist[1]) : 0

        // Extrair anos de PAGAMENTO dos dividendos (3a coluna da tabela)
        const rows = html.match(/<tr class="border-t[\s\S]*?<\/tr>/g) || []
        const porAno = {}
        for (const row of rows) {
            const tds = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || []
            if (tds.length >= 4) {
                const pagamento = tds[2].replace(/<[^>]+>/g, '').trim()
                const anoMatch = pagamento.match(/(\d{4})/)
                if (anoMatch) porAno[anoMatch[1]] = true
            }
        }

        // Calcular consist\u00eancia esperada (sempre come\u00e7a do vigente)
        let esperada = 0
        if (porAno[String(anoVigente)]) {
            for (let a = anoVigente; a >= anoVigente - 30; a--) {
                if (porAno[String(a)]) esperada++
                else break
            }
        }

        // Validar: consist\u00eancia mostrada deve ser igual \u00e0 esperada
        if (consistMostrada !== esperada) {
            ok = false
            erros.push(ticker + ': mostra ' + consistMostrada + ', esperada ' + esperada)
        }
    }

    if (ok) {
        totalPassou++
        console.log('   \u2705 ' + files.length + ' a\u00e7\u00f5es verificadas, consist\u00eancia correta')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        for (const e of erros) console.log('   \u274c ' + e)
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarTooltipConsistenciaDetalhe() {
    console.log('\n\ud83d\udd0d TESTE 29 \u2014 Tooltip (i) de consist\u00eancia no detalhe de a\u00e7\u00f5es (#84)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'acoes', 'VALE3', 'index.html'), 'utf-8')
    const temTooltip = html.includes('tooltip-consist-det') && html.includes('Anos consecutivos')
    const textoCorreto = html.includes('Anos consecutivos em que a a')

    if (temTooltip && textoCorreto) {
        totalPassou++
        console.log('   \u2705 VALE3: tooltip (i) presente com texto correto')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        if (!temTooltip) console.log('   \u274c VALE3: tooltip n\u00e3o encontrado no detalhe')
        if (!textoCorreto) console.log('   \u274c VALE3: texto do tooltip incorreto')
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarSimuladorSemDY() {
    console.log('\n\ud83d\udd0d TESTE 25 \u2014 Simulador escondido quando a\u00e7\u00e3o n\u00e3o tem DY (#78)')

    const acoesDir = path.join(PAGES_DIR, 'acoes')
    let ok = true
    // Ações que sabemos que não têm DY
    const files = fs.readdirSync(acoesDir).filter(f => fs.statSync(path.join(acoesDir,f)).isDirectory())
    for (const f of files) {
        const html = fs.readFileSync(path.join(acoesDir, f, 'index.html'), 'utf-8')
        const dyDash = html.match(/Dividend Yield[\s\S]{0,200}>-</) !== null
        const temSimulador = html.includes('Quanto vou receber')
        if (dyDash && temSimulador) {
            ok = false
            console.log('   \u274c ' + f + ': tem simulador mas DY = -')
        }
    }
    if (ok) {
        totalPassou++
        console.log('   \u2705 Nenhuma a\u00e7\u00e3o sem DY mostra simulador')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarPaginacaoRendimentos() {
    console.log('\n\ud83d\udd0d TESTE 26 \u2014 Pagina\u00e7\u00e3o de rendimentos em FIIs e A\u00e7\u00f5es (#79)')

    let ok = true
    // Verificar FII com muitos dividendos
    const fiiHtml = fs.readFileSync(path.join(PAGES_DIR, 'fiis', 'MXRF11', 'index.html'), 'utf-8')
    const fiiRows = (fiiHtml.match(/<tr class="border-t/g) || []).length
    const fiiTemPaginacao = fiiHtml.includes('pag-anterior') || fiiHtml.includes('pag-proximo') || fiiHtml.includes('data-page')
    if (fiiRows > 5 && fiiTemPaginacao) {
        console.log('   \u2705 FII MXRF11: ' + fiiRows + ' rendimentos com pagina\u00e7\u00e3o')
    } else if (fiiRows <= 5) {
        ok = false
        console.log('   \u274c FII MXRF11: apenas ' + fiiRows + ' rendimentos (esperado todos)')
    } else {
        ok = false
        console.log('   \u274c FII MXRF11: ' + fiiRows + ' rendimentos mas sem pagina\u00e7\u00e3o')
    }

    // Verificar Ação com muitos dividendos
    const acaoHtml = fs.readFileSync(path.join(PAGES_DIR, 'acoes', 'VALE3', 'index.html'), 'utf-8')
    const acaoRows = (acaoHtml.match(/<tr class="border-t/g) || []).length
    const acaoTemPaginacao = acaoHtml.includes('pag-anterior') || acaoHtml.includes('pag-proximo') || acaoHtml.includes('data-page')
    if (acaoRows > 5 && acaoTemPaginacao) {
        console.log('   \u2705 A\u00e7\u00e3o VALE3: ' + acaoRows + ' rendimentos com pagina\u00e7\u00e3o')
    } else if (acaoRows <= 5) {
        ok = false
        console.log('   \u274c A\u00e7\u00e3o VALE3: apenas ' + acaoRows + ' rendimentos (esperado todos)')
    } else {
        ok = false
        console.log('   \u274c A\u00e7\u00e3o VALE3: ' + acaoRows + ' rendimentos mas sem pagina\u00e7\u00e3o')
    }

    if (ok) { totalPassou++; console.log('   Status: \u2705 PASSOU') }
    else { totalFalhou++; console.log('   Status: \u274c FALHOU') }
}

async function testarFiltroBotsMelhorado() {
    console.log('\n\ud83d\udd0d TESTE 28 \u2014 Filtro detecta bots sofisticados (#81)')

    const consoleJs = fs.readFileSync(path.join(PAGES_DIR, 'admin-console.js'), 'utf-8')
    const isBotMatch = consoleJs.match(/function isBot\(d\)\s*\{([\s\S]*?)\n\}/)
    if (!isBotMatch) {
        totalFalhou++
        console.log('   \u274c fun\u00e7\u00e3o isBot n\u00e3o encontrada')
        console.log('   Status: \u274c FALHOU')
        return
    }
    const isBotFn = new Function('d', isBotMatch[1])

    const botsSofisticados = [
        { navegador: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36', cidade: 'Santa Clara', resolucao: '1024x1024', os: 'Linux x86_64' },
        { navegador: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', cidade: 'Burnaby', resolucao: '800x600' },
        { navegador: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/90.0.4430.93 Safari/537.36', cidade: 'San Jose', resolucao: '1920x1080' },
        { navegador: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/85.0.4183.121 Safari/537.36', cidade: 'Reston', resolucao: '1366x768' },
        { navegador: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/148.0.0.0 Safari/537.36', cidade: 'Hillsboro', resolucao: '800x800', os: 'Linux x86_64' },
    ]

    const humanosReais = [
        { navegador: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', cidade: 'Santa Barbara d\'Oeste', resolucao: '1920x1080', os: 'Win32', dispositivo: 'Desktop' },
        { navegador: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1', cidade: 'S\u00e3o Paulo', resolucao: '390x844', os: 'iPhone', dispositivo: 'Mobile' },
    ]

    let ok = true
    for (const b of botsSofisticados) {
        if (!isBotFn(b)) { ok = false; console.log('   \u274c N\u00e3o detectou: ' + b.cidade + ' ' + b.resolucao) }
    }
    for (const h of humanosReais) {
        if (isBotFn(h)) { ok = false; console.log('   \u274c Bloqueou humano: ' + h.cidade) }
    }

    if (ok) {
        totalPassou++
        console.log('   \u2705 Detecta ' + botsSofisticados.length + ' bots sofisticados, permite ' + humanosReais.length + ' humanos')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarPagesNoGitignore() {
    console.log('\n\ud83d\udd0d TESTE 30 \u2014 pages/ no .gitignore (#87)')

    const gitignore = fs.readFileSync(path.resolve(__dirname, '../.gitignore'), 'utf-8')
    const temPages = gitignore.includes('pages/')

    if (temPages) {
        totalPassou++
        console.log('   \u2705 pages/ est\u00e1 no .gitignore')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        console.log('   \u274c pages/ N\u00c3O est\u00e1 no .gitignore')
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarRendimentosAcoesSemLimite() {
    console.log('\n\ud83d\udd0d TESTE 27 \u2014 A\u00e7\u00f5es mostram mais de 10 rendimentos (#80)')

    const acaoHtml = fs.readFileSync(path.join(PAGES_DIR, 'acoes', 'VALE3', 'index.html'), 'utf-8')
    const rows = (acaoHtml.match(/<tr class="border-t/g) || []).length

    if (rows > 10) {
        totalPassou++
        console.log('   \u2705 VALE3: ' + rows + ' rendimentos (sem limite de 10)')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        console.log('   \u274c VALE3: apenas ' + rows + ' rendimentos (limitado a 10, issue #80)')
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarLinksTopsSemPathDuplicado() {
    console.log('\n\ud83d\udd0d TESTE 33 \u2014 Links nos tops/rankings sem path duplicado (#90)')

    const paginas = ['altas', 'quedas', 'ranking-dy', 'ranking-baratos', 'ranking-valorizacao', 'ranking-consistentes',
                     'acoes-altas', 'acoes-quedas', 'acoes-ranking-dy', 'acoes-ranking-baratos', 'acoes-ranking-valorizacao', 'acoes-ranking-consistentes']
    let ok = true
    let erros = []

    for (const p of paginas) {
        const filePath = path.join(PAGES_DIR, p, 'index.html')
        if (!fs.existsSync(filePath)) continue
        const html = fs.readFileSync(filePath, 'utf-8')
        const links = html.match(/href="[^"]*"/g) || []
        // Links para detalhes n\u00e3o devem come\u00e7ar com fiis/ ou acoes/ sem ../ (causa 404)
        const errados = links.filter(l => {
            var m = l.match(/href="(fiis\/[A-Z]|acoes\/[A-Z])/)
            return m !== null
        })
        if (errados.length > 0) {
            ok = false
            erros.push(p + ': ' + errados.length + ' links sem ../ (ex: ' + errados[0] + ')')
        }
    }

    if (ok) {
        totalPassou++
        console.log('   \u2705 ' + paginas.length + ' p\u00e1ginas verificadas, links corretos')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        for (const e of erros) console.log('   \u274c ' + e)
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarLinksAcoesIndex() {
    console.log('\n\ud83d\udd0d TESTE 31 \u2014 Links na index de a\u00e7\u00f5es sem path duplicado (#88)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'acoes', 'index.html'), 'utf-8')
    const links = html.match(/href="[^"]*"/g) || []
    // A p\u00e1gina est\u00e1 em /acoes/index.html, links para detalhes devem ser relativos: TICKER/ (n\u00e3o acoes/TICKER/)
    const duplicados = links.filter(l => l.match(/href="acoes\/[A-Z]/))
    const htmlErrados = links.filter(l => l.match(/\.html/) && !l.includes('http') && !l.includes('ghost') && !l.includes('data:') && !l.includes('index.html'))

    let ok = true
    if (duplicados.length > 0) {
        ok = false
        console.log('   \u274c Links com path duplicado (acoes/TICKER dentro de /acoes/): ' + duplicados.slice(0,3).join(', '))
    }
    if (htmlErrados.length > 0) {
        ok = false
        console.log('   \u274c Links com .html: ' + htmlErrados.slice(0,3).join(', '))
    }
    if (ok) {
        totalPassou++
        console.log('   \u2705 Todos os links corretos na index de a\u00e7\u00f5es')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarLinksConsole() {
    console.log('\n\ud83d\udd0d TESTE 32 \u2014 Links no console sem .html e paths corretos (#88)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'console', 'index.html'), 'utf-8')
    const links = html.match(/href="[^"]*"/g) || []
    const htmlErrados = links.filter(l => l.match(/\.html/) && !l.includes('http') && !l.includes('ghost') && !l.includes('data:'))
    const pathEstranhos = links.filter(l => l.includes('..././') || l.includes('.././'))

    let ok = true
    if (htmlErrados.length > 0) {
        ok = false
        console.log('   \u274c Links com .html: ' + htmlErrados.join(', '))
    }
    if (pathEstranhos.length > 0) {
        ok = false
        console.log('   \u274c Paths estranhos: ' + pathEstranhos.join(', '))
    }
    if (ok) {
        totalPassou++
        console.log('   \u2705 Todos os links corretos no console')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarGraficoIntraday() {
    console.log('\n\ud83d\udd0d TESTE 34 \u2014 Gr\u00e1fico tem bot\u00e3o 1D (intraday) e dados (#91)')

    const acoesDir = path.join(PAGES_DIR, 'acoes')
    const fiisDir = path.join(PAGES_DIR, 'fiis')
    let ok = true

    // Verificar ação
    const acaoHtml = fs.readFileSync(path.join(acoesDir, 'VALE3', 'index.html'), 'utf-8')
    const temBotao1D = acaoHtml.includes('data-period="1d"')
    const temIntraday = acaoHtml.includes('intradayData')
    if (temBotao1D && temIntraday) {
        console.log('   \u2705 VALE3: bot\u00e3o 1D presente + dados intraday')
    } else {
        ok = false
        if (!temBotao1D) console.log('   \u274c VALE3: bot\u00e3o 1D ausente')
        if (!temIntraday) console.log('   \u274c VALE3: dados intraday ausentes')
    }

    // Verificar FII
    const fiiHtml = fs.readFileSync(path.join(fiisDir, 'MXRF11', 'index.html'), 'utf-8')
    const temBotao1DFII = fiiHtml.includes('data-period="1d"')
    const temIntradayFII = fiiHtml.includes('intradayData')
    if (temBotao1DFII && temIntradayFII) {
        console.log('   \u2705 MXRF11: bot\u00e3o 1D presente + dados intraday')
    } else {
        ok = false
        if (!temBotao1DFII) console.log('   \u274c MXRF11: bot\u00e3o 1D ausente')
        if (!temIntradayFII) console.log('   \u274c MXRF11: dados intraday ausentes')
    }

    if (ok) { totalPassou++; console.log('   Status: \u2705 PASSOU') }
    else { totalFalhou++; console.log('   Status: \u274c FALHOU') }
}

async function testarGraficoCrosshair() {
    console.log('\n\ud83d\udd0d TESTE 35 \u2014 Gr\u00e1fico tem crosshair vertical (#91)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'acoes', 'VALE3', 'index.html'), 'utf-8')
    const temCrosshair = html.includes('crosshairPlugin') || html.includes('crosshair')
    const temTooltipRS = html.includes('R$') && html.includes('toFixed(2)')

    let ok = true
    if (temCrosshair) {
        console.log('   \u2705 Plugin crosshair registrado')
    } else {
        ok = false
        console.log('   \u274c Plugin crosshair ausente')
    }
    if (temTooltipRS) {
        console.log('   \u2705 Tooltip com R$ formatado')
    } else {
        ok = false
        console.log('   \u274c Tooltip sem R$ formatado')
    }

    if (ok) { totalPassou++; console.log('   Status: \u2705 PASSOU') }
    else { totalFalhou++; console.log('   Status: \u274c FALHOU') }
}

async function testarGraficoBotao1DSempre() {
    console.log('\n\ud83d\udd0d TESTE 37 \u2014 Bot\u00e3o 1D sempre presente no gr\u00e1fico (#91)')

    const acoesDir = path.join(PAGES_DIR, 'acoes')
    const fiisDir = path.join(PAGES_DIR, 'fiis')
    let ok = true

    // Verificar que TODAS as p\u00e1ginas com gr\u00e1fico t\u00eam bot\u00e3o 1D (independente de dados intraday)
    const acaoHtml = fs.readFileSync(path.join(acoesDir, 'VALE3', 'index.html'), 'utf-8')
    if (acaoHtml.includes('chart-cotacao') && !acaoHtml.includes('data-period="1d"')) {
        ok = false
        console.log('   \u274c VALE3: tem gr\u00e1fico mas n\u00e3o tem bot\u00e3o 1D')
    } else if (acaoHtml.includes('data-period="1d"')) {
        console.log('   \u2705 VALE3: bot\u00e3o 1D presente')
    }

    const fiiHtml = fs.readFileSync(path.join(fiisDir, 'MXRF11', 'index.html'), 'utf-8')
    if (fiiHtml.includes('chart-cotacao') && !fiiHtml.includes('data-period="1d"')) {
        ok = false
        console.log('   \u274c MXRF11: tem gr\u00e1fico mas n\u00e3o tem bot\u00e3o 1D')
    } else if (fiiHtml.includes('data-period="1d"')) {
        console.log('   \u2705 MXRF11: bot\u00e3o 1D presente')
    }

    if (ok) { totalPassou++; console.log('   Status: \u2705 PASSOU') }
    else { totalFalhou++; console.log('   Status: \u274c FALHOU') }
}

async function testarGraficoPadrao1D() {
    console.log('\n\ud83d\udd0d TESTE 38 \u2014 Gr\u00e1fico inicia em 1D por padr\u00e3o (#91)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'acoes', 'VALE3', 'index.html'), 'utf-8')
    // O per\u00edodo padr\u00e3o \u00e9 o que tem a classe ativa E \u00e9 chamado no setChartPeriod final
    const iniciaCom1D = html.includes("setChartPeriod('1d');") && html.match(/data-period="1d"[^>]*border-emerald/)
    const iniciaComOutro = html.includes("setChartPeriod('5y');")

    if (iniciaCom1D && !iniciaComOutro) {
        totalPassou++
        console.log('   \u2705 Gr\u00e1fico inicia em 1D')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        if (iniciaComOutro) console.log('   \u274c Gr\u00e1fico inicia em 5Y (deveria ser 1D)')
        else console.log('   \u274c setChartPeriod(\'1d\') n\u00e3o encontrado como padr\u00e3o')
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarIntraday1DMultiplosPontos() {
    console.log('\n\ud83d\udd0d TESTE 39 \u2014 Gr\u00e1fico 1D tem m\u00faltiplos pontos intraday a\u00e7\u00f5es e FIIs (#92/#93)')

    let ok = true
    const checks = [
        { label: 'VALE3 (a\u00e7\u00e3o)', path: path.join(PAGES_DIR, 'acoes', 'VALE3', 'index.html') },
        { label: 'MXRF11 (FII)', path: path.join(PAGES_DIR, 'fiis', 'MXRF11', 'index.html') },
    ]
    for (const chk of checks) {
        const html = fs.readFileSync(chk.path, 'utf-8')
        const match = html.match(/intradayData = (\{[^;]+\});/)
        if (!match) {
            const isNull = html.includes('intradayData = null')
            ok = false
            console.log('   \u274c ' + chk.label + ': intradayData ' + (isNull ? '\u00e9 null' : 'n\u00e3o encontrado'))
        } else {
            try {
                const data = JSON.parse(match[1])
                if (data.t && data.t.length > 10) {
                    console.log('   \u2705 ' + chk.label + ': intradayData tem ' + data.t.length + ' pontos')
                } else {
                    ok = false
                    console.log('   \u274c ' + chk.label + ': apenas ' + (data.t ? data.t.length : 0) + ' pontos')
                }
            } catch(e) {
                ok = false
                console.log('   \u274c ' + chk.label + ': erro ao parsear')
            }
        }
    }
    if (ok) { totalPassou++; console.log('   Status: \u2705 PASSOU') }
    else { totalFalhou++; console.log('   Status: \u274c FALHOU') }
}

async function testarGerarSemCache() {
    console.log('\n\ud83d\udd0d TESTE 36 \u2014 gerar.js compila sem erro no path sem cache (CI)')

    const { execSync } = require('child_process')
    try {
        // Rodar node com --check valida sintaxe, mas n\u00e3o executa
        // Para testar ordem de vari\u00e1veis, precisa parsear o c\u00f3digo
        const gerarCode = fs.readFileSync(path.resolve(__dirname, '../gerar.js'), 'utf-8')

        // Extrair o bloco do path sem cache (depois de "} else {" at\u00e9 o final do main)
        // Verificar que buscarIntraday/buscarHistoricoCotacao n\u00e3o usam 'acoes' antes de 'const acoes = lerAcoes'
        const mainMatch = gerarCode.match(/\/\/ Gerar p\u00e1ginas de detalhe[\s\S]*?const acoes = lerAcoes\(\)/)
        if (!mainMatch) {
            // Tentar path alternativo
            const lines = gerarCode.split('\n')
            let acoesDef = -1
            let problemas = []
            // Encontrar \u00faltima defini\u00e7\u00e3o de 'const acoes' (path sem cache)
            for (let i = lines.length - 1; i >= 0; i--) {
                if (lines[i].includes('const acoes = lerAcoes()') && !lines[i].trim().startsWith('//')) {
                    acoesDef = i
                    break
                }
            }
            if (acoesDef === -1) {
                totalFalhou++
                console.log('   \u274c N\u00e3o encontrou "const acoes = lerAcoes()" no path sem cache')
                console.log('   Status: \u274c FALHOU')
                return
            }
            // Verificar que nenhuma refer\u00eancia a 'acoes' aparece antes dessa linha (no mesmo bloco)
            // Buscar de tr\u00e1s pra frente a partir de acoesDef
            for (let i = acoesDef - 1; i >= Math.max(0, acoesDef - 50); i--) {
                if (lines[i].includes('...acoes') || lines[i].match(/\bacoes\b/) && !lines[i].includes('const acoes') && !lines[i].includes('//') && !lines[i].includes('pastaAcoes') && !lines[i].includes('acoes/') && !lines[i].includes('acoesFiles') && !lines[i].includes('gerarPaginaIndexAcoes') && !lines[i].includes('rankingsAcoes') && !lines[i].includes('Gerando p')) {
                    problemas.push('L' + (i+1) + ': ' + lines[i].trim().substring(0, 60))
                }
            }
            if (problemas.length > 0) {
                totalFalhou++
                console.log('   \u274c Refer\u00eancias a "acoes" antes da defini\u00e7\u00e3o (L' + (acoesDef+1) + '):')
                for (const p of problemas) console.log('     ' + p)
                console.log('   Status: \u274c FALHOU')
                return
            }
        }

        // Tamb\u00e9m validar sintaxe do gerar.js
        execSync('node --check ' + path.resolve(__dirname, '../gerar.js'), { encoding: 'utf-8' })

        totalPassou++
        console.log('   \u2705 gerar.js: sintaxe OK e sem refer\u00eancias a "acoes" antes da defini\u00e7\u00e3o')
        console.log('   Status: \u2705 PASSOU')
    } catch (e) {
        totalFalhou++
        console.log('   \u274c ' + e.message.split('\n')[0])
        console.log('   Status: \u274c FALHOU')
    }
}



async function testarTituloDescricaoIndex() {
    console.log('\n🔍 TESTE 41 — Título e description atualizados com ações (#98)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf-8')
    const tituloCorreto = html.includes('Radar de FIIs e Ações brasileiras')
    const descCorreta = html.includes('atualizado a cada 30 minutos')
    const semTempoReal = !html.includes('em tempo real')

    if (tituloCorreto && descCorreta && semTempoReal) {
        totalPassou++
        console.log('   ✅ Título e description corretos, sem "tempo real"')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        if (!tituloCorreto) console.log('   ❌ Título não contém "Radar de FIIs e Ações brasileiras"')
        if (!descCorreta) console.log('   ❌ Description não contém "atualizado a cada 30 minutos"')
        if (!semTempoReal) console.log('   ❌ Ainda menciona "em tempo real"')
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarFaviconArquivoFisico() {
    console.log('\n🔍 TESTE 40 — Favicon como arquivo físico (não data URI) (#97)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf-8')
    const temDataUri = html.includes('href="data:image/svg+xml')
    const temArquivo = html.includes('href="./favicon.svg"') || html.includes('href="favicon.svg"') || html.includes('href="https://investpop.com.br/favicon.svg"')
    const temAppleTouch = html.includes('apple-touch-icon')
    const faviconExiste = fs.existsSync(path.join(PAGES_DIR, 'favicon.svg'))
    const appleExiste = fs.existsSync(path.join(PAGES_DIR, 'apple-touch-icon.png'))

    if (!temDataUri && temArquivo && temAppleTouch && faviconExiste && appleExiste) {
        totalPassou++
        console.log('   ✅ favicon.svg e apple-touch-icon.png existem como arquivos físicos')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        if (temDataUri) console.log('   ❌ Ainda usa data URI inline')
        if (!temArquivo) console.log('   ❌ <link rel="icon"> não aponta para arquivo físico')
        if (!temAppleTouch) console.log('   ❌ <link rel="apple-touch-icon"> ausente')
        if (!faviconExiste) console.log('   ❌ pages/favicon.svg não existe')
        if (!appleExiste) console.log('   ❌ pages/apple-touch-icon.png não existe')
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarFaviconUrlAbsoluta() {
    console.log('\n🔍 TESTE 42 — Favicon com URL absoluta em todas as páginas (#99)')

    const paginas = [
        { file: 'index.html', desc: 'raiz' },
        { file: 'acoes/index.html', desc: 'acoes/' },
        { file: 'altas/index.html', desc: 'altas/' },
        { file: 'fiis/HGLG11/index.html', desc: 'fiis/HGLG11/' },
        { file: 'acoes/PETR4/index.html', desc: 'acoes/PETR4/' },
    ]
    let ok = true

    for (const p of paginas) {
        const filePath = path.join(PAGES_DIR, p.file)
        if (!fs.existsSync(filePath)) { ok = false; console.log('   ❌ ' + p.file + ' não existe'); continue }
        const html = fs.readFileSync(filePath, 'utf-8')
        const temAbsoluta = html.includes('href="https://investpop.com.br/favicon.svg"')
        const temAppleAbsoluta = html.includes('href="https://investpop.com.br/apple-touch-icon.png"')
        if (temAbsoluta && temAppleAbsoluta) {
            console.log('   ✅ ' + p.desc + ': favicon e apple-touch-icon com URL absoluta')
        } else {
            ok = false
            if (!temAbsoluta) console.log('   ❌ ' + p.desc + ': favicon sem URL absoluta')
            if (!temAppleAbsoluta) console.log('   ❌ ' + p.desc + ': apple-touch-icon sem URL absoluta')
        }
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarStylesCSSPath() {
    console.log('\\n\u{1f50d} TESTE 33 \u2014 styles.css referenciado com path correto em todas as p\u00e1ginas (#94)')
    let ok = true
    const checks = [
        {file: 'index.html', expected: './styles.css'},
        {file: 'acoes/index.html', expected: '../styles.css'},
        {file: 'altas/index.html', expected: '../styles.css'},
        {file: 'fiis/HGLG11/index.html', expected: '../../styles.css'},
        {file: 'acoes/PETR4/index.html', expected: '../../styles.css'},
    ]
    for (const c2 of checks) {
        const fp = path.join(PAGES_DIR, c2.file)
        if (!fs.existsSync(fp)) { ok = false; console.log('   \u274c ' + c2.file + ' n\u00e3o existe'); continue }
        const html = fs.readFileSync(fp, 'utf-8')
        if (html.includes('href="' + c2.expected + '"')) {
            console.log('   \u2705 ' + c2.file + ' \u2192 ' + c2.expected)
        } else {
            ok = false
            const m = html.match(/href="(["]*styles\.css)"/) 
            console.log('   \u274c ' + c2.file + ' esperado ' + c2.expected + ', encontrado ' + (m ? m[1] : '?'))
        }
    }
    if (ok) { totalPassou++; console.log('   Status: \u2705 PASSOU') }
    else { totalFalhou++; console.log('   Status: \u274c FALHOU') }
}
async function testarSemCDNTailwind() {
    console.log('\\n\u{1f50d} TESTE 31 \u2014 Sem cdn.tailwindcss.com no HTML (#94)')
    const html = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf-8')
    const temCDN = html.includes('cdn.tailwindcss.com')
    if (!temCDN) {
        totalPassou++
        console.log('   \u2705 index.html n\u00e3o usa cdn.tailwindcss.com')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        console.log('   \u274c index.html ainda usa cdn.tailwindcss.com')
        console.log('   Status: \u274c FALHOU')
    }
}

async function testarMetaSeguranca() {
    console.log('\\n\u{1f50d} TESTE 32 \u2014 Meta tags de seguran\u00e7a presentes (#94)')
    const html = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf-8')
    const temCSP = html.includes('Content-Security-Policy')
    const temXCTO = html.includes('X-Content-Type-Options')
    const temReferrer = html.includes('referrer')
    if (temCSP && temXCTO && temReferrer) {
        totalPassou++
        console.log('   \u2705 Meta tags de seguran\u00e7a presentes')
        console.log('   Status: \u2705 PASSOU')
    } else {
        totalFalhou++
        console.log('   \u274c CSP=' + temCSP + ' XCTO=' + temXCTO + ' referrer=' + temReferrer)
        console.log('   Status: \u274c FALHOU')
    }
}
async function main() {
    const startTotal = Date.now()

    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║       TESTES ENHANCEMENTS PENDENTES - InvestPop             ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log('║  #6  Card de tops na página de detalhe                      ║')
    console.log('║  #11 Foco automático na busca mobile                        ║')
    console.log('║  #18 Abas de filtro temporal no console                      ║')
    console.log('║  #19 Bug: gerador com abas + msg vazio                      ║')
    await testarGraficoBotao1DSempre()
    await testarGraficoPadrao1D()
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
    await testarNomeEmpresaAcoes()
    await testarSemSetorIrrelevante()
    await testarBuscaMostraNomeEmpresa()
    await testarDescricaoEmpresaAcoes()
    await testarFiltroBots()
    await testarSimuladorSemDY()
    await testarPaginacaoRendimentos()
    await testarRendimentosAcoesSemLimite()
    await testarFiltroBotsMelhorado()
    await testarConsistenciaCorreta()
    await testarTooltipConsistenciaDetalhe()
    await testarLinksTopsSemPathDuplicado()
    await testarLinksAcoesIndex()
    await testarLinksConsole()
    await testarGraficoIntraday()
    await testarGraficoCrosshair()
    await testarPagesNoGitignore()
    await testarGerarSemCache()
    await testarIntraday1DMultiplosPontos()
    await testarStylesCSSPath()
    await testarSemCDNTailwind()
    await testarMetaSeguranca()
    await testarFaviconArquivoFisico()
    await testarFaviconUrlAbsoluta()
    await testarTituloDescricaoIndex()

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
