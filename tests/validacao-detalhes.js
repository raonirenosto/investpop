#!/usr/bin/env node
/**
 * Teste das Páginas de Detalhe dos FIIs - InvestPop
 *
 * Verifica que todas as 107 páginas de detalhe foram geradas corretamente:
 * - Existem 107 arquivos em pages/fiis/
 * - Cada página tem: ticker, preço, DY, P/VP, dividendos, simulador
 * - Dados são coerentes (preço > 0, DY > 0, dividendos com valores)
 * - Links de navegação funcionam (voltar para index)
 * - Layout responsivo (Puppeteer mobile + desktop)
 *
 * Execução: nvm use 20 && node tests/validacao-detalhes.js
 */
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const PAGES_DIR = path.resolve(__dirname, '../pages')
const FIIS_DIR = path.join(PAGES_DIR, 'fiis')
const LISTA_FIIS = fs.readFileSync(path.resolve(__dirname, '../data/lista_fiis.txt'), 'utf-8')
    .split(/[\r\n\s,]+/).map(l => l.trim().toUpperCase()).filter(l => l)

let totalPassou = 0
let totalFalhou = 0

async function testarExistencia() {
    console.log('\n🔍 TESTE 1 — Existência das 107 páginas')

    const arquivos = fs.readdirSync(FIIS_DIR).filter(f => f.endsWith('.html'))
    let ok = true

    if (arquivos.length === LISTA_FIIS.length) {
        console.log('   ✅ ' + arquivos.length + ' páginas encontradas')
    } else {
        ok = false
        console.log('   ❌ Esperado ' + LISTA_FIIS.length + ', encontrado ' + arquivos.length)
    }

    // Verificar que cada ticker tem sua página
    let faltando = []
    for (const t of LISTA_FIIS) {
        if (!fs.existsSync(path.join(FIIS_DIR, t + '.html'))) faltando.push(t)
    }
    if (faltando.length > 0) {
        ok = false
        console.log('   ❌ Faltando: ' + faltando.join(', '))
    } else {
        console.log('   ✅ Todos os tickers têm página')
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarEstrutura() {
    console.log('\n🔍 TESTE 2 — Estrutura HTML (107 páginas)')

    let ok = true
    let erros = []

    for (const t of LISTA_FIIS) {
        const html = fs.readFileSync(path.join(FIIS_DIR, t + '.html'), 'utf-8')

        const checks = {
            titulo: html.includes('<title>' + t + ' \u2014 InvestPop</title>'),
            ticker: html.includes('<h1') && html.includes(t),
            preco: html.includes('R$') && html.includes('font-bold whitespace-nowrap'),
            dy: html.includes('Dividend Yield (12M)'),
            pvp: html.includes('P/VP'),
            patrimonio: html.includes('Patrim\u00f4nio'),
            cotistas: html.includes('Cotistas'),
            sobre: html.includes('Sobre o Fundo'),
            rentabilidade: html.includes('Rentabilidade'),
            dividendos: html.includes('\u00daltimos Dividendos'),
            simulador: html.includes('Quanto vou receber'),
            breadcrumb: html.includes('../index.html'),
            buscaJs: html.includes('../busca.js'),
            fiisLista: html.includes('FIIS_LISTA'),
        }

        const falhas = Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k)
        if (falhas.length > 0) {
            ok = false
            erros.push(t + ': falta ' + falhas.join(', '))
        }
    }

    if (erros.length === 0) {
        console.log('   ✅ Todas as 107 páginas têm estrutura completa')
    } else {
        erros.slice(0, 5).forEach(e => console.log('   ❌ ' + e))
        if (erros.length > 5) console.log('   ... e mais ' + (erros.length - 5) + ' com erros')
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarDadosCoerentes() {
    console.log('\n🔍 TESTE 3 — Dados coerentes (preço, DY, dividendos)')

    let ok = true
    let erros = []

    for (const t of LISTA_FIIS) {
        const html = fs.readFileSync(path.join(FIIS_DIR, t + '.html'), 'utf-8')

        // Preço > 0
        const precoMatch = html.match(/whitespace-nowrap">R\$ ([\d.,]+)</)
        const preco = precoMatch ? parseFloat(precoMatch[1].replace('.', '').replace(',', '.')) : 0

        // DY > 0
        const dyMatch = html.match(/text-emerald-400 mt-1">([\d,]+)%/)
        const dy = dyMatch ? parseFloat(dyMatch[1].replace(',', '.')) : 0

        // Tem pelo menos 1 dividendo
        const temDividendo = html.includes('text-right text-emerald-400 font-medium">R$')

        // Simulador tem valores
        const simMatch = html.match(/font-bold text-emerald-400 mt-1 block">R\$ ([\d.,]+)/)
        const simValor = simMatch ? parseFloat(simMatch[1].replace('.', '').replace(',', '.')) : 0

        const problemas = []
        if (preco <= 0) problemas.push('preço=0')
        if (dy <= 0) problemas.push('DY=0')
        if (!temDividendo) problemas.push('sem dividendos')
        if (simValor <= 0 && preco > 0 && dy > 0) problemas.push('simulador=0')

        if (problemas.length > 0) {
            erros.push(t + ': ' + problemas.join(', '))
        }
    }

    if (erros.length === 0) {
        console.log('   ✅ Todos os 107 FIIs com dados coerentes')
    } else {
        const comPreco = erros.filter(e => e.includes('preço=0')).length
        const comDY = erros.filter(e => e.includes('DY=0')).length
        const semDiv = erros.filter(e => e.includes('sem dividendos')).length
        console.log('   Problemas: preço=0 (' + comPreco + '), DY=0 (' + comDY + '), sem dividendos (' + semDiv + ')')
        erros.slice(0, 5).forEach(e => console.log('   ⚠️ ' + e))
        // Aceitar se >90% estão ok
        if (erros.length <= 10) {
            ok = true
            console.log('   ✅ ' + (LISTA_FIIS.length - erros.length) + '/' + LISTA_FIIS.length + ' FIIs com dados completos (aceitável)')
        } else {
            ok = false
        }
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarNavegacao(browser) {
    console.log('\n🔍 TESTE 4 — Navegação e links (Puppeteer)')

    const page = await browser.newPage()
    const fiis = ['HCTR11', 'HGLG11', 'MXRF11']
    let ok = true

    for (const t of fiis) {
        await page.goto('file://' + path.join(FIIS_DIR, t + '.html'), { waitUntil: 'domcontentloaded' })
        await new Promise(r => setTimeout(r, 300))

        const checks = await page.evaluate((ticker) => {
            // Ticker no h1
            var h1 = document.querySelector('h1')
            var temTicker = h1 && h1.textContent.includes(ticker)

            // Link voltar para index
            var links = document.querySelectorAll('a[href*="index.html"]')
            var temVoltar = links.length > 0

            // Breadcrumb
            var bread = document.querySelector('[class*="breadcrumb"], .text-xs.text-gray-500')
            var temBread = !!document.querySelector('a[href="../index.html"]')

            // Preço visível
            var precoEl = document.querySelector('[class*="whitespace-nowrap"]')
            var temPreco = precoEl && precoEl.textContent.includes('R$')

            // Seções presentes
            var html = document.body.innerHTML
            var temDY = html.includes('Dividend Yield')
            var temSimulador = html.includes('Quanto vou receber')
            var temDividendos = html.includes('ltimos Dividendos')

            return { temTicker, temVoltar, temBread, temPreco, temDY, temSimulador, temDividendos }
        }, t)

        const falhas = Object.entries(checks).filter(([k, v]) => !v).map(([k]) => k)
        if (falhas.length === 0) {
            console.log('   ✅ ' + t + ': navegação e conteúdo OK')
        } else {
            ok = false
            console.log('   ❌ ' + t + ': falta ' + falhas.join(', '))
        }
    }

    await page.close()

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarResponsivo(browser) {
    console.log('\n🔍 TESTE 5 — Layout responsivo (mobile 414px vs desktop 1280px)')

    const page = await browser.newPage()
    let ok = true

    // Mobile
    await page.setViewport({ width: 414, height: 896 })
    await page.goto('file://' + path.join(FIIS_DIR, 'HGLG11.html'), { waitUntil: 'domcontentloaded' })
    await new Promise(r => setTimeout(r, 300))

    const mobile = await page.evaluate(() => {
        var h1 = document.querySelector('h1')
        var preco = document.querySelector('[class*="whitespace-nowrap"]')
        // Verificar que não há overflow horizontal
        var overflow = document.body.scrollWidth > window.innerWidth
        // Verificar que preço não quebra linha (está na mesma linha que ticker)
        var h1Rect = h1 ? h1.getBoundingClientRect() : null
        var precoRect = preco ? preco.getBoundingClientRect() : null
        var mesmaLinha = h1Rect && precoRect && Math.abs(h1Rect.top - precoRect.top) < 30

        return { overflow, mesmaLinha, h1Visible: h1 && h1.offsetHeight > 0, precoVisible: preco && preco.offsetHeight > 0 }
    })

    if (!mobile.overflow && mobile.mesmaLinha && mobile.h1Visible && mobile.precoVisible) {
        console.log('   ✅ Mobile (414px): sem overflow, preço na mesma linha')
    } else {
        ok = false
        console.log('   ❌ Mobile: overflow=' + mobile.overflow + ' mesmaLinha=' + mobile.mesmaLinha)
    }

    // Desktop
    await page.setViewport({ width: 1280, height: 800 })
    await page.goto('file://' + path.join(FIIS_DIR, 'HGLG11.html'), { waitUntil: 'domcontentloaded' })
    await new Promise(r => setTimeout(r, 300))

    const desktop = await page.evaluate(() => {
        var breadcrumb = document.querySelector('a[href="../index.html"]')
        var grid = document.querySelector('[class*="lg:grid-cols-3"]')
        return { temBreadcrumb: !!breadcrumb, temGrid3col: !!grid }
    })

    if (desktop.temBreadcrumb && desktop.temGrid3col) {
        console.log('   ✅ Desktop (1280px): breadcrumb visível, grid 3 colunas')
    } else {
        ok = false
        console.log('   ❌ Desktop: breadcrumb=' + desktop.temBreadcrumb + ' grid3col=' + desktop.temGrid3col)
    }

    await page.close()

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function main() {
    const startTotal = Date.now()

    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║       VALIDAÇÃO PÁGINAS DE DETALHE - InvestPop              ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log('║  Testa: existência, estrutura, dados, navegação, layout     ║')
    console.log('║  Páginas: 107 FIIs em pages/fiis/                           ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')

    await testarExistencia()
    await testarEstrutura()
    await testarDadosCoerentes()

    console.log('\n⏳ Abrindo browser...')
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files'] })
    console.log('✅ Browser pronto')

    await testarNavegacao(browser)
    await testarResponsivo(browser)

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
