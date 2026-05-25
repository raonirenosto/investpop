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
    console.log('\n🔍 TESTE 4 — Abas de filtro temporal no console (#18)')

    const html = fs.readFileSync(path.join(PAGES_DIR, 'console.html'), 'utf-8')

    const temAbaHoje = html.includes('aba-hoje') || (html.includes('data-periodo="hoje"'))
    const temAbaSemana = html.includes('aba-semana') || (html.includes('data-periodo="semana"'))
    const temAbaAntigo = html.includes('aba-antigo') || (html.includes('data-periodo="antigo"'))

    if (temAbaHoje && temAbaSemana && temAbaAntigo) {
        totalPassou++
        console.log('   ✅ Console tem abas: Hoje, Esta Semana, Mais Antigo')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Abas faltando: hoje=' + temAbaHoje + ' semana=' + temAbaSemana + ' antigo=' + temAbaAntigo)
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
    const temAbas = src.includes('data-periodo="hoje"') && src.includes('data-periodo="semana"') && src.includes('data-periodo="antigo"')

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
    console.log('║  #21 Gráfico line (cardiograma)                              ║')
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
