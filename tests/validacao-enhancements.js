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
    console.log('\n🔍 TESTE 2 — Card mostra posição real mesmo fora do Top 5 (#52)')

    // PETR4 provavelmente não está no top 5 de tudo, mas deve mostrar posição real
    const html = fs.readFileSync(path.join(PAGES_DIR, 'acoes', 'PETR4.html'), 'utf-8')
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

    const html = fs.readFileSync(path.join(PAGES_DIR, 'acessos.html'), 'utf-8')

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
    await page.goto('file://' + path.join(PAGES_DIR, 'acessos.html'), { waitUntil: 'domcontentloaded' })
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

    const html = fs.readFileSync(path.join(PAGES_DIR, 'acessos.html'), 'utf-8')
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
    await page.goto('file://' + path.join(PAGES_DIR, 'acessos.html'), { waitUntil: 'domcontentloaded' })
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
    await page.goto('file://' + path.join(PAGES_DIR, 'acessos.html'), { waitUntil: 'domcontentloaded' })
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
    console.log('\n🔍 TESTE 16 — Tooltips informativos nos rankings de ações (#35/#39)')

    const paginas = ['acoes.html', 'acoes-ranking-dy.html', 'acoes-ranking-baratos.html', 'acoes-ranking-valorizacao.html', 'acoes-ranking-consistentes.html']
    let ok = true

    for (const p of paginas) {
        const filePath = path.join(PAGES_DIR, p)
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
    console.log('\n🔍 TESTE 19 — Busca unificada em todas as páginas (#38/#44)')

    const paginas = [
        {file: 'index.html', desc: 'index FIIs'},
        {file: 'acoes.html', desc: 'index Ações'},
        {file: 'fiis/HGLG11.html', desc: 'detalhe FII'},
        {file: 'acoes/PETR4.html', desc: 'detalhe Ação'},
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

    const html = fs.readFileSync(path.join(PAGES_DIR, 'acessos.html'), 'utf-8')
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
        const filePath = path.join(acoesDir, ticker + '.html')
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
        const filePath = path.join(acoesDir, ticker + '.html')
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
    await page.goto('file://' + path.join(PAGES_DIR, 'acoes', 'VALE3.html'), { waitUntil: 'domcontentloaded', timeout: 10000 })
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

async function testarFiltroBots() {
    console.log('\n\ud83d\udd0d TESTE 23 \u2014 Filtro de bots detecta padr\u00f5es comuns (#66)')

    const consoleJs = fs.readFileSync(path.join(PAGES_DIR, 'console.js'), 'utf-8')

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
    await testarNomeEmpresaAcoes()
    await testarSemSetorIrrelevante()
    await testarBuscaMostraNomeEmpresa()
    await testarFiltroBots()

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
