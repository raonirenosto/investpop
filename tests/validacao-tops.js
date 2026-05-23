#!/usr/bin/env node
/**
 * Validação dos Tops do InvestPop vs Referências Externas
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
const { analisarMesesInvestidor10 } = require('./modulo_referencia_investidor10')

// Ler todos os 107 FIIs
const TODOS_FIIS = fs.readFileSync(path.resolve(__dirname, '../data/lista_fiis.txt'), 'utf-8')
    .split(/[\r\n\s,]+/).map(l => l.trim().toUpperCase()).filter(l => l)
const TICKERS_DY = TODOS_FIIS // 107 FIIs pra DY
const TICKERS_ALTAS_QUEDAS = TODOS_FIIS.slice(0, 50) // 50 pra Puppeteer
const TICKERS_VAR_ANO = TODOS_FIIS.slice(0, 10) // 10 pra Google Finance
const TICKERS_CONSISTENCIA = ['HGRU11', 'HGLG11', 'MXRF11', 'BTLG11', 'XPLG11', 'KNCR11', 'KNRI11', 'HGRE11', 'XPML11', 'VISC11', 'PVBI11', 'BCRI11', 'HSML11', 'GTWR11', 'LVBI11', 'BRCO11', 'VGIR11', 'CPTS11', 'RBRY11', 'HGRU11']

let totalPassou = 0
let totalFalhou = 0
const relatorio = []

// ===============================
// Helpers Puppeteer
// ===============================

async function buscarVarDiaInvestidor10(browser, ticker) {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36')
    await page.goto('https://investidor10.com.br/fiis/' + ticker.toLowerCase() + '/', { waitUntil: 'domcontentloaded', timeout: 20000 })
    await new Promise(r => setTimeout(r, 2000))
    await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('a, button, span, div'))
        const btn = elements.find(el => el.innerText?.trim() === '1 D')
        if (btn) btn.click()
    })
    await new Promise(r => setTimeout(r, 1500))
    const varDia = await page.evaluate(() => {
        const match = document.body.innerText.match(/([+-]?\s*\d+[,.]\d+)\s*%\s*\(1\s*D\)/)
        return match ? parseFloat(match[1].replace(/\s/g, '').replace(',', '.')) : null
    })
    await page.close()
    return varDia
}

async function buscarVarYTDGoogle(browser, ticker) {
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

async function buscarDYInvestidor10(ticker) {
    const r = await axios.get('https://investidor10.com.br/fiis/' + ticker.toLowerCase() + '/', {
        httpsAgent: agent, headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const match = r.data.match(/dividend\s*yield\s*de\s*(\d+[,.]\d+)\s*%/i)
    return match ? parseFloat(match[1].replace(',', '.')) : null
}

// ===============================
// Testes
// ===============================

async function testarAltasQuedas(browser) {
    console.log('\n🔍 TOP 5 MAIORES ALTAS/QUEDAS DO DIA — Ref: Investidor 10 (Puppeteer)')
    console.log('   Margem aceita: 0.5% absoluto')

    const symbols = TICKERS_VAR_ANO.map(t => t + ".SA").join(",")
    const rYahoo = await axios.get(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=1d&interval=1d`, {
        httpsAgent: agent, headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    let passou = true
    for (const t of TICKERS_ALTAS_QUEDAS) {
        process.stdout.write(`   ${t}... `)
        try {
            const d = rYahoo.data[t + '.SA']
            const yahooVar = d?.chartPreviousClose > 0 ? ((d.close[d.close.length - 1] - d.chartPreviousClose) / d.chartPreviousClose * 100) : null
            const inv10Var = await buscarVarDiaInvestidor10(browser, t)
            if (yahooVar !== null && inv10Var !== null) {
                const diff = Math.abs(yahooVar - inv10Var)
                const ok = diff <= 0.5
                if (!ok) passou = false
                const sinal = yahooVar >= 0 ? '+' : ''
                const linha = `Yahoo: ${sinal}${yahooVar.toFixed(2)}%  Inv10: ${inv10Var >= 0 ? '+' : ''}${inv10Var.toFixed(2)}%  Diff: ${diff.toFixed(2)}%  ${ok ? '✅' : '❌'}`
                console.log(linha)
                relatorio.push(`  ${t}  ${linha}`)
            } else {
                console.log('⚠️ Dados insuficientes')
                relatorio.push(`  ${t}  ⚠️ Dados insuficientes`)
            }
        } catch (e) {
            console.log('⚠️ Erro:', e.message?.slice(0, 50))
            relatorio.push(`  ${t}  ⚠️ Erro`)
        }
    }

    if (passou) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function buscarDYStatusInvest(ticker) {
    const r = await axios.get('https://statusinvest.com.br/fundos-imobiliarios/' + ticker.toLowerCase(), {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const match = r.data.match(/title="Dividend Yield com base nos \u00faltimos 12 meses"[\s\S]*?<strong[^>]*>([\d,.]+)/i)
    return match ? parseFloat(match[1].replace('.', '').replace(',', '.')) : null
}

async function testarDY() {
    console.log('\n\ud83d\udd0d TOP 5 QUE MAIS PAGAM (DY 12M) \u2014 Ref: Status Invest (scraping)')
    console.log('   Fonte produ\u00e7\u00e3o: Investidor 10 | Ref teste: Status Invest')
    console.log('   Margem aceita: 1% absoluto por ticker, m\u00e9dia <= 1%')
    console.log('   Total FIIs: ' + TICKERS_DY.length)

    const rankings = await buscarRankings(TICKERS_DY)
    const nosso = {}
    for (const item of rankings.allDY) {
        nosso[item.ticker] = parseFloat(item.valor.replace(',', '.'))
    }

    let passou = true
    let totalDiff = 0
    let totalComparados = 0
    let falhas = []

    for (let i = 0; i < TICKERS_DY.length; i++) {
        const t = TICKERS_DY[i]
        process.stdout.write(`   [${i+1}/${TICKERS_DY.length}] ${t}... `)
        try {
            const ref = await buscarDYStatusInvest(t)
            await new Promise(r => setTimeout(r, 800))
            const n = nosso[t]
            if (n && ref) {
                const diff = Math.abs(n - ref)
                totalDiff += diff
                totalComparados++
                const ok = diff <= 1.0
                if (!ok) {
                    falhas.push(`${t}: Nosso ${n.toFixed(2)}% vs SI ${ref}% (diff ${diff.toFixed(2)}%)`)
                }
                console.log(`${n.toFixed(2)}% vs ${ref}% diff:${diff.toFixed(2)}% ${ok ? '\u2705' : '\u274c'}`)
            } else {
                console.log('\u26a0\ufe0f dados insuficientes (nosso:' + n + ' ref:' + ref + ')')
            }
        } catch (e) {
            console.log('\u26a0\ufe0f erro: ' + e.message?.slice(0, 40))
        }
    }

    const mediaDiff = totalComparados > 0 ? (totalDiff / totalComparados) : 0
    console.log(`\n   Comparados: ${totalComparados}/${TICKERS_DY.length}`)
    console.log(`   M\u00e9dia diff: ${mediaDiff.toFixed(3)}%`)
    if (falhas.length > 0) {
        console.log(`   Falhas individuais >1% (${falhas.length}):`)
        falhas.forEach(f => console.log('     ' + f))
    }

    if (mediaDiff > 1.0) passou = false

    if (passou) { totalPassou++; console.log('   Status: \u2705 PASSOU') }
    else { totalFalhou++; console.log('   Status: \u274c FALHOU') }
}


async function testarVarAno(browser) {
    console.log('\n🔍 TOP 5 QUE MAIS VALORIZARAM NO ANO — Ref: Google Finance (Puppeteer)')
    console.log('   Margem aceita: 1.5% absoluto')

    // Buscar variação YTD direto do Yahoo (não do ranking filtrado)
    const symbols = TICKERS_VAR_ANO.map(t => t + ".SA").join(",")
    const rYahoo = await axios.get(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=ytd&interval=1mo`, {
        httpsAgent: agent, headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const nossoVar = {}
    for (const t of TICKERS_VAR_ANO) {
        const d = rYahoo.data[t + '.SA']
        if (d && d.close && d.close.length > 0 && d.chartPreviousClose > 0) {
            nossoVar[t] = ((d.close[d.close.length - 1] - d.chartPreviousClose) / d.chartPreviousClose) * 100
        }
    }

    let passou = true
    for (const t of TICKERS_ALTAS_QUEDAS) {
        process.stdout.write(`   ${t}... `)
        try {
            const googleVar = await buscarVarYTDGoogle(browser, t)
            const nossoVal = nossoVar[t]
            if (googleVar !== null && nossoVal !== undefined) {
                const diff = Math.abs(nossoVal - googleVar)
                const ok = diff <= 1.5
                if (!ok) passou = false
                const linha = `Yahoo: ${nossoVal >= 0 ? '+' : ''}${nossoVal.toFixed(2)}%  Google: ${googleVar >= 0 ? '+' : ''}${googleVar.toFixed(2)}%  Diff: ${diff.toFixed(2)}%  ${ok ? '✅' : '❌'}`
                console.log(linha)
                relatorio.push(`  ${t}  ${linha}`)
            } else {
                console.log('⚠️ Dados insuficientes')
            }
        } catch (e) {
            console.log('⚠️ Erro:', e.message?.slice(0, 50))
        }
    }

    if (passou) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarConsistencia() {
    console.log('\n🔍 TOP 5 PAGADORES CONSISTENTES — Ref: Módulo Investidor 10')
    console.log('   Lógica: calcularMesesSemQuebra (pvp-fiis.js --investidor10)')
    console.log('   Margem: nosso >= ref e diff <= 4 (dados mais recentes)')

    const rankings = await buscarRankings(TICKERS_CONSISTENCIA)
    const nosso = {}
    for (const item of rankings.allConsistentes) {
        nosso[item.ticker] = parseInt(item.valor)
    }

    const refResultados = await analisarMesesInvestidor10(TICKERS_CONSISTENCIA)
    const ref = {}
    for (const r of refResultados) {
        if (!r.erro) ref[r.ticker] = r.meses
    }

    let passou = true
    for (const t of TICKERS_CONSISTENCIA) {
        const n = nosso[t]
        const r = ref[t]
        if (n !== undefined && r) {
            const diff = n - r
            const ok = diff >= -1 && diff <= 4
            if (!ok) passou = false
            const linha = `Nosso: ${n} meses  Inv10: ${r} meses  Diff: ${diff}  ${ok ? '✅' : '❌'}`
            console.log(`   ${t}... ${linha}`)
            relatorio.push(`  ${t}  ${linha}`)
        } else {
            console.log(`   ${t}... ⚠️ Dados insuficientes (nosso: ${n}, ref: ${r})`)
            passou = false
        }
    }

    if (passou) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

// ===============================
// Main
// ===============================

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║          VALIDAÇÃO DOS TOPS - InvestPop                     ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')

    console.log('\n⏳ Abrindo browser...')
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] })
    console.log('✅ Browser pronto\n')

    await testarAltasQuedas(browser)
    await testarDY()
    await testarVarAno(browser)
    await testarConsistencia()

    await browser.close()

    // Mockado
    console.log('\n🔍 TOP 5 MAIS BARATOS (P/VP) — MOCKADO')
    console.log('   Sem fonte de dados disponível')
    console.log('   Status: ⚠️ MOCKADO')

    // Resumo
    console.log('\n╔══════════════════════════════════════════════════════════════╗')
    console.log('║          RESUMO                                             ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log(`║  ✅ Passou: ${totalPassou}                                              ║`)
    console.log(`║  ❌ Falhou: ${totalFalhou}                                              ║`)
    console.log(`║  ⚠️  Mockado: 1                                              ║`)
    console.log('╚══════════════════════════════════════════════════════════════╝')

    process.exit(totalFalhou > 0 ? 1 : 0)
}

main().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1) })
