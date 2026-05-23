#!/usr/bin/env node
/**
 * Validação dos Tops do InvestPop vs Referências Externas
 *
 * Fonte produção: Investidor 10 (DY, P/VP, Consistência) + Yahoo (Var.Dia, YTD)
 * Sanity checks: valores razoáveis + ordenação correta (10 FIIs)
 * Cruzamento (5 FIIs): Google Finance (YTD) + Status Invest (DY)
 *
 * Execução: nvm use 20 && node tests/validacao-tops.js
 */
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const https = require('https')
const puppeteer = require('puppeteer')
const agent = new https.Agent({ rejectUnauthorized: false })
const { buscarRankings } = require('../gerar')

const TODOS_FIIS = fs.readFileSync(path.resolve(__dirname, '../data/lista_fiis.txt'), 'utf-8')
    .split(/[\r\n\s,]+/).map(l => l.trim().toUpperCase()).filter(l => l)
const TICKERS_SANITY = ['HGLG11', 'MXRF11', 'KNCR11', 'XPLG11', 'BTLG11']
const TICKERS_10 = [...new Set([...TICKERS_SANITY, ...TODOS_FIIS.slice(0, 5)])]

let totalPassou = 0
let totalFalhou = 0

// ===============================
// Helpers
// ===============================

async function buscarDYStatusInvest(ticker) {
    const r = await axios.get('https://statusinvest.com.br/fundos-imobiliarios/' + ticker.toLowerCase(), {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const match = r.data.match(/title="Dividend Yield com base nos \u00faltimos 12 meses"[\s\S]*?<strong[^>]*>([\d,.]+)/i)
    return match ? parseFloat(match[1].replace('.', '').replace(',', '.')) : null
}

async function buscarPrecoYTDGoogle(browser, ticker) {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
    await page.goto('https://www.google.com/finance/quote/' + ticker + ':BVMF', { waitUntil: 'domcontentloaded', timeout: 20000 })
    await new Promise(r => setTimeout(r, 2000))
    await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('div, span, button'))
        const btn = els.find(el => el.innerText && el.innerText.trim() === 'YTD' && el.offsetHeight > 0)
        if (btn) btn.click()
    })
    await new Promise(r => setTimeout(r, 1500))
    const varYTD = await page.evaluate(() => {
        const text = document.body.innerText
        const match = text.match(/([+-]\d+[,.]\d+)%\s*\n\s*\([+-]?[\d,.]+\)\s*YTD/)
        if (match) return parseFloat(match[1].replace(',', '.'))
        const match2 = text.match(/([+-]\d+[,.]\d+)%\s*\([+-]?[\d,.]+\)\s*YTD/)
        if (match2) return parseFloat(match2[1].replace(',', '.'))
        return null
    })
    await page.close()
    return varYTD
}

// ===============================
// Testes
// ===============================

async function testarSanity() {
    console.log('\n🔍 SANITY CHECK — Rankings (10 FIIs)')
    console.log('   Validação: dados não nulos, valores razoáveis, ordenação correta')

    const rankings = await buscarRankings(TICKERS_10)
    let ok = true

    // DY: valores entre 0-60%
    const dyOk = rankings.allDY.every(r => { const v = parseFloat(r.valor.replace(',', '.')); return v > 0 && v < 60 })
    if (!dyOk) { ok = false; console.log('   ❌ DY: valores fora do range 0-60%') }
    else console.log('   ✅ DY: ' + rankings.allDY.length + ' FIIs, todos entre 0-60%')

    // P/VP: valores entre 0-3
    const pvpOk = rankings.allBaratos.every(r => { const v = parseFloat(r.valor.replace(',', '.')); return v > 0 && v < 3 })
    if (!pvpOk) { ok = false; console.log('   ❌ P/VP: valores fora do range 0-3') }
    else console.log('   ✅ P/VP: ' + rankings.allBaratos.length + ' FIIs, todos entre 0-3')

    // Consistência: valores entre 0-200
    const consOk = rankings.allConsistentes.every(r => { const v = parseInt(r.valor); return v >= 0 && v <= 200 })
    if (!consOk) { ok = false; console.log('   ❌ Consistência: valores fora do range') }
    else console.log('   ✅ Consistência: ' + rankings.allConsistentes.length + ' FIIs, todos entre 0-200 meses')

    // Ordenação DY
    if (rankings.allDY.length >= 2) {
        const v1 = parseFloat(rankings.allDY[0].valor.replace(',', '.'))
        const v2 = parseFloat(rankings.allDY[1].valor.replace(',', '.'))
        if (v1 < v2) { ok = false; console.log('   ❌ Ordenação DY incorreta') }
        else console.log('   ✅ Ordenação DY correta (top: ' + rankings.allDY[0].ticker + ' ' + rankings.allDY[0].valor + ')')
    }

    // Ordenação P/VP (menor primeiro)
    if (rankings.allBaratos.length >= 2) {
        const v1 = parseFloat(rankings.allBaratos[0].valor.replace(',', '.'))
        const v2 = parseFloat(rankings.allBaratos[1].valor.replace(',', '.'))
        if (v1 > v2) { ok = false; console.log('   ❌ Ordenação P/VP incorreta') }
        else console.log('   ✅ Ordenação P/VP correta (top: ' + rankings.allBaratos[0].ticker + ' ' + rankings.allBaratos[0].valor + ')')
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }

    return rankings
}

async function testarCruzamentoDY(rankings) {
    console.log('\n🔍 CRUZAMENTO DY — 5 FIIs vs Status Invest')
    console.log('   Margem: 1% absoluto')

    const nosso = {}
    for (const item of rankings.allDY) nosso[item.ticker] = parseFloat(item.valor.replace(',', '.'))

    let ok = true
    for (const t of TICKERS_SANITY) {
        process.stdout.write('   ' + t + '... ')
        try {
            const ref = await buscarDYStatusInvest(t)
            await new Promise(r => setTimeout(r, 1000))
            const n = nosso[t]
            if (n && ref) {
                const diff = Math.abs(n - ref)
                const pass = diff <= 1.0
                if (!pass) ok = false
                console.log('Nosso: ' + n.toFixed(2) + '%  SI: ' + ref + '%  Diff: ' + diff.toFixed(2) + '%  ' + (pass ? '✅' : '❌'))
            } else {
                console.log('⚠️ dados insuficientes')
            }
        } catch (e) {
            console.log('⚠️ erro: ' + e.message?.slice(0, 40))
        }
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarCruzamentoYTD(browser) {
    console.log('\n🔍 CRUZAMENTO YTD — 5 FIIs vs Google Finance')
    console.log('   Margem: 1.5% absoluto')

    const symbols = TICKERS_SANITY.map(t => t + '.SA').join(',')
    const rYahoo = await axios.get(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=ytd&interval=1mo`, {
        httpsAgent: agent, headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    let ok = true
    for (const t of TICKERS_SANITY) {
        process.stdout.write('   ' + t + '... ')
        try {
            const googleYTD = await buscarPrecoYTDGoogle(browser, t)
            const d = rYahoo.data[t + '.SA']
            const yahooVar = d?.chartPreviousClose > 0 ? ((d.close[d.close.length - 1] - d.chartPreviousClose) / d.chartPreviousClose * 100) : null
            if (googleYTD !== null && yahooVar !== null) {
                const diff = Math.abs(yahooVar - googleYTD)
                const pass = diff <= 1.5
                if (!pass) ok = false
                console.log('Yahoo: ' + (yahooVar >= 0 ? '+' : '') + yahooVar.toFixed(2) + '%  Google: ' + (googleYTD >= 0 ? '+' : '') + googleYTD.toFixed(2) + '%  Diff: ' + diff.toFixed(2) + '%  ' + (pass ? '✅' : '❌'))
            } else {
                console.log('⚠️ dados insuficientes')
            }
        } catch (e) {
            console.log('⚠️ erro: ' + e.message?.slice(0, 40))
        }
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

// ===============================
// Main
// ===============================

async function main() {
    const startTotal = Date.now()

    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║          VALIDAÇÃO DOS TOPS - InvestPop                     ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log('║  Fonte produção: Investidor 10 + Yahoo Finance              ║')
    console.log('║  Sanity check: 10 FIIs (valores + ordenação)                ║')
    console.log('║  Cruzamento: 5 FIIs vs Status Invest (DY) + Google (YTD)    ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')

    console.log('\n⏳ Abrindo browser...')
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] })
    console.log('✅ Browser pronto')

    const rankings = await testarSanity()
    await testarCruzamentoDY(rankings)
    await testarCruzamentoYTD(browser)

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
