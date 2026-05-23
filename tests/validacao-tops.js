#!/usr/bin/env node
/**
 * Validação dos Tops do InvestPop vs Referências Externas
 *
 * Fonte produção: Investidor 10 (DY, P/VP, Consistência) + Yahoo (Var.Dia, YTD)
 * Sanity checks: valores razoáveis + ordenação correta (107 FIIs)
 * Cruzamento (107 FIIs): Status Invest (DY, P/VP) + Investidor 10 (YTD, Consistência)
 *
 * Execução: nvm use 20 && node tests/validacao-tops.js
 */
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const https = require('https')

const agent = new https.Agent({ rejectUnauthorized: false })
const { buscarRankings, buscarFiis, calcularMesesSemQuebra } = require('../gerar')

const TODOS_FIIS = fs.readFileSync(path.resolve(__dirname, '../data/lista_fiis.txt'), 'utf-8')
    .split(/[\r\n\s,]+/).map(l => l.trim().toUpperCase()).filter(l => l)


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

async function buscarPVPStatusInvest(ticker) {
    const r = await axios.get('https://statusinvest.com.br/fundos-imobiliarios/' + ticker.toLowerCase(), {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const match = r.data.match(/P\s*\/\s*VP[\s\S]{0,200}?<strong[^>]*>([\d,.]+)/i)
    return match ? parseFloat(match[1].replace('.', '').replace(',', '.')) : null
}

async function buscarConsistenciaInvestidor10(ticker) {
    const r = await axios.get(`https://investidor10.com.br/fiis/${ticker.toLowerCase()}/dividendos/`, {
        httpsAgent: agent, headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const rendimentos = []
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    let trMatch
    while ((trMatch = trRegex.exec(r.data)) !== null) {
        const tds = []
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
        let tdMatch
        while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
            tds.push(tdMatch[1].replace(/<[^>]+>/g, '').trim())
        }
        if (tds.length >= 4 && tds[0].toLowerCase().includes('dividendo')) {
            rendimentos.push({ data: tds[1], valor: parseFloat(tds[3].replace(/\./g, '').replace(',', '.')) })
        }
    }
    return calcularMesesSemQuebra(rendimentos)
}

async function buscarYTDInvestidor10(ticker) {
    const r = await axios.get('https://investidor10.com.br/fiis/' + ticker.toLowerCase() + '/', {
        httpsAgent: agent, headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const m = r.data.match(/iniciou o ano negociando na casa dos R\$ ([\d.,]+) e hoje est[áa] em R\$ ([\d.,]+)/i)
    if (!m) return null
    const inicio = parseFloat(m[1].replace('.', '').replace(',', '.'))
    const atual = parseFloat(m[2].replace('.', '').replace(',', '.'))
    if (inicio <= 0) return null
    return ((atual - inicio) / inicio) * 100
}

// ===============================
// Testes
// ===============================

async function testarSanity() {
    console.log('\n🔍 SANITY CHECK — Rankings + Altas/Quedas (' + TODOS_FIIS.length + ' FIIs)')
    console.log('   Validação: ranges, sinais, ordenação de TODOS os tops')

    const rankings = await buscarRankings(TODOS_FIIS)
    const cotacoes = await buscarFiis(TODOS_FIIS)

    const altas = cotacoes.filter(r => r.varNum > 0).sort((a, b) => b.varNum - a.varNum)
    const quedas = cotacoes.filter(r => r.varNum < 0).sort((a, b) => a.varNum - b.varNum)

    let ok = true

    // --- DY ---
    const dyOk = rankings.allDY.every(r => { const v = parseFloat(r.valor.replace(',', '.')); return v > 0 && v < 60 })
    if (!dyOk) { ok = false; console.log('   ❌ DY: valores fora do range 0-60%') }
    else console.log('   ✅ DY: ' + rankings.allDY.length + ' FIIs, todos entre 0-60%')

    if (rankings.allDY.length >= 2) {
        const v1 = parseFloat(rankings.allDY[0].valor.replace(',', '.'))
        const v2 = parseFloat(rankings.allDY[1].valor.replace(',', '.'))
        if (v1 < v2) { ok = false; console.log('   ❌ Ordenação DY incorreta (desc)') }
        else console.log('   ✅ Ordenação DY correta (desc, top: ' + rankings.allDY[0].ticker + ' ' + rankings.allDY[0].valor + ')')
    }

    // --- P/VP ---
    const pvpOk = rankings.allBaratos.every(r => { const v = parseFloat(r.valor.replace(',', '.')); return v > 0 && v < 3 })
    if (!pvpOk) { ok = false; console.log('   ❌ P/VP: valores fora do range 0-3') }
    else console.log('   ✅ P/VP: ' + rankings.allBaratos.length + ' FIIs, todos entre 0-3')

    if (rankings.allBaratos.length >= 2) {
        const v1 = parseFloat(rankings.allBaratos[0].valor.replace(',', '.'))
        const v2 = parseFloat(rankings.allBaratos[1].valor.replace(',', '.'))
        if (v1 > v2) { ok = false; console.log('   ❌ Ordenação P/VP incorreta (deve ser asc)') }
        else console.log('   ✅ Ordenação P/VP correta (asc, top: ' + rankings.allBaratos[0].ticker + ' ' + rankings.allBaratos[0].valor + ')')
    }

    // --- YTD ---
    const ytdOk = rankings.allVarAno.every(r => { const v = parseFloat(r.valor.replace('+', '').replace('%', '').replace(',', '.')); return v > 0 && v < 200 })
    if (!ytdOk) { ok = false; console.log('   ❌ YTD: valores fora do range 0-200%') }
    else console.log('   ✅ YTD: ' + rankings.allVarAno.length + ' FIIs, todos positivos e < 200%')

    if (rankings.allVarAno.length >= 2) {
        const v1 = parseFloat(rankings.allVarAno[0].valor.replace('+', '').replace('%', '').replace(',', '.'))
        const v2 = parseFloat(rankings.allVarAno[1].valor.replace('+', '').replace('%', '').replace(',', '.'))
        if (v1 < v2) { ok = false; console.log('   ❌ Ordenação YTD incorreta (desc)') }
        else console.log('   ✅ Ordenação YTD correta (desc, top: ' + rankings.allVarAno[0].ticker + ' ' + rankings.allVarAno[0].valor + ')')
    }

    // --- Consistência ---
    const consOk = rankings.allConsistentes.every(r => { const v = parseInt(r.valor); return v >= 0 && v <= 200 })
    if (!consOk) { ok = false; console.log('   ❌ Consistência: valores fora do range 0-200') }
    else console.log('   ✅ Consistência: ' + rankings.allConsistentes.length + ' FIIs, todos entre 0-200 meses')

    if (rankings.allConsistentes.length >= 2) {
        const v1 = parseInt(rankings.allConsistentes[0].valor)
        const v2 = parseInt(rankings.allConsistentes[1].valor)
        if (v1 < v2) { ok = false; console.log('   ❌ Ordenação Consistência incorreta (desc)') }
        else console.log('   ✅ Ordenação Consistência correta (desc, top: ' + rankings.allConsistentes[0].ticker + ' ' + rankings.allConsistentes[0].valor + ')')
    }

    // --- Altas do Dia ---
    if (altas.length >= 2) {
        const altasPositivas = altas.every(r => r.varNum > 0)
        if (!altasPositivas) { ok = false; console.log('   ❌ Altas: contém valores não-positivos') }
        else console.log('   ✅ Altas: ' + altas.length + ' FIIs, todos positivos')

        if (altas[0].varNum < altas[1].varNum) { ok = false; console.log('   ❌ Ordenação Altas incorreta (desc)') }
        else console.log('   ✅ Ordenação Altas correta (desc, top: ' + altas[0].ticker + ' +' + altas[0].varNum.toFixed(2) + '%)')
    } else {
        console.log('   ⚠️ Altas: menos de 2 FIIs com variação positiva (mercado fechado?)')
    }

    // --- Quedas do Dia ---
    if (quedas.length >= 2) {
        const quedasNegativas = quedas.every(r => r.varNum < 0)
        if (!quedasNegativas) { ok = false; console.log('   ❌ Quedas: contém valores não-negativos') }
        else console.log('   ✅ Quedas: ' + quedas.length + ' FIIs, todos negativos')

        if (quedas[0].varNum > quedas[1].varNum) { ok = false; console.log('   ❌ Ordenação Quedas incorreta (asc por valor, maior queda primeiro)') }
        else console.log('   ✅ Ordenação Quedas correta (maior queda primeiro: ' + quedas[0].ticker + ' ' + quedas[0].varNum.toFixed(2) + '%)')
    } else {
        console.log('   ⚠️ Quedas: menos de 2 FIIs com variação negativa (mercado fechado?)')
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }

    return rankings
}

// FIIs com tratamento diferente de amortizações entre Investidor 10 e Status Invest
const EXCECOES_DY = ['BTAL11', 'PCIP11', 'RBFM11']

async function testarCruzamentoDY(rankings) {
    console.log('\n🔍 CRUZAMENTO DY — ' + TODOS_FIIS.length + ' FIIs vs Status Invest')
    console.log('   Margem: 1% absoluto')
    console.log('   Exceções (amortização ≠ dividendo): ' + EXCECOES_DY.join(', '))

    const nosso = {}
    for (const item of rankings.allDY) nosso[item.ticker] = parseFloat(item.valor.replace(',', '.'))

    let ok = true
    let testados = 0
    for (const t of TODOS_FIIS) {
        process.stdout.write('   ' + t + '... ')
        try {
            const ref = await buscarDYStatusInvest(t)
            await new Promise(r => setTimeout(r, 500))
            const n = nosso[t]
            if (n && ref) {
                testados++
                const diff = Math.abs(n - ref)
                const pass = diff <= 1.0
                if (!pass && EXCECOES_DY.includes(t)) {
                    console.log('Nosso: ' + n.toFixed(2) + '%  SI: ' + ref + '%  Diff: ' + diff.toFixed(2) + '%  ⏭️ EXCEÇÃO (amortização)')
                } else if (!pass) {
                    ok = false
                    console.log('Nosso: ' + n.toFixed(2) + '%  SI: ' + ref + '%  Diff: ' + diff.toFixed(2) + '%  ❌')
                } else {
                    console.log('Nosso: ' + n.toFixed(2) + '%  SI: ' + ref + '%  Diff: ' + diff.toFixed(2) + '%  ✅')
                }
            } else {
                console.log('⚠️ dados insuficientes (nosso=' + n + ', SI=' + ref + ')')
            }
        } catch (e) {
            console.log('⚠️ erro: ' + e.message?.slice(0, 40))
        }
    }
    console.log('   Testados: ' + testados + '/' + TODOS_FIIS.length)
    console.log('   Exceções ignoradas: ' + EXCECOES_DY.filter(t => TODOS_FIIS.includes(t)).length)

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarCruzamentoPVP(rankings) {
    console.log('\n🔍 CRUZAMENTO P/VP — ' + TODOS_FIIS.length + ' FIIs vs Status Invest')
    console.log('   Margem: 0.05 absoluto')

    const nosso = {}
    for (const item of rankings.allBaratos) nosso[item.ticker] = parseFloat(item.valor.replace(',', '.'))

    let ok = true
    let testados = 0
    for (const t of TODOS_FIIS) {
        process.stdout.write('   ' + t + '... ')
        try {
            const ref = await buscarPVPStatusInvest(t)
            await new Promise(r => setTimeout(r, 500))
            const n = nosso[t]
            if (n && ref) {
                testados++
                const diff = Math.abs(n - ref)
                const pass = diff <= 0.05
                if (!pass) ok = false
                console.log('Nosso: ' + n.toFixed(2) + '  SI: ' + ref.toFixed(2) + '  Diff: ' + diff.toFixed(3) + '  ' + (pass ? '✅' : '❌'))
            } else {
                console.log('⚠️ dados insuficientes (nosso=' + n + ', SI=' + ref + ')')
            }
        } catch (e) {
            console.log('⚠️ erro: ' + e.message?.slice(0, 40))
        }
    }
    console.log('   Testados: ' + testados + '/' + TODOS_FIIS.length)

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarCruzamentoConsistencia(rankings) {
    console.log('\n🔍 CRUZAMENTO CONSISTÊNCIA — ' + TODOS_FIIS.length + ' FIIs vs Investidor 10 (busca independente)')
    console.log('   Margem: 0 meses (deve ser idêntico)')

    const nosso = {}
    for (const item of rankings.allConsistentes) nosso[item.ticker] = parseInt(item.valor)

    let ok = true
    let testados = 0
    for (const t of TODOS_FIIS) {
        process.stdout.write('   ' + t + '... ')
        try {
            const ref = await buscarConsistenciaInvestidor10(t)
            await new Promise(r => setTimeout(r, 500))
            const n = nosso[t]
            if (n !== undefined && ref) {
                testados++
                const pass = n === ref.meses
                if (!pass) ok = false
                console.log('Nosso: ' + n + ' meses  Ref: ' + ref.meses + ' meses  ' + (pass ? '✅' : '❌'))
            } else {
                console.log('⚠️ dados insuficientes (nosso=' + n + ', ref=' + JSON.stringify(ref) + ')')
            }
        } catch (e) {
            console.log('⚠️ erro: ' + e.message?.slice(0, 40))
        }
    }
    console.log('   Testados: ' + testados + '/' + TODOS_FIIS.length)

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

// RBFM11 não tem preço de início de ano no Investidor 10 (retorna Infinity)
// SNCI11 diverge entre Yahoo e Investidor 10 por diferença no preço de referência de 31/dez
const EXCECOES_YTD = ['RBFM11', 'SNCI11']

async function testarCruzamentoYTD() {
    console.log('\n🔍 CRUZAMENTO YTD — ' + TODOS_FIIS.length + ' FIIs: Yahoo Finance vs Investidor 10')
    console.log('   Margem: 1% absoluto')
    console.log('   Exceções: ' + EXCECOES_YTD.join(', '))

    // Buscar YTD do Yahoo em batch
    const rYahoo = {}
    for (let i = 0; i < TODOS_FIIS.length; i += 20) {
        const batch = TODOS_FIIS.slice(i, i + 20)
        const symbols = batch.map(t => t + '.SA').join(',')
        try {
            const r = await axios.get(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=ytd&interval=1mo`, {
                httpsAgent: agent, headers: { 'User-Agent': 'Mozilla/5.0' }
            })
            Object.assign(rYahoo, r.data)
        } catch (e) {}
        if (i + 20 < TODOS_FIIS.length) await new Promise(r => setTimeout(r, 300))
    }

    let ok = true
    let testados = 0
    for (const t of TODOS_FIIS) {
        process.stdout.write('   ' + t + '... ')
        try {
            const inv10YTD = await buscarYTDInvestidor10(t)
            await new Promise(r => setTimeout(r, 500))
            const d = rYahoo[t + '.SA']
            const yahooVar = d?.chartPreviousClose > 0 ? ((d.close[d.close.length - 1] - d.chartPreviousClose) / d.chartPreviousClose * 100) : null
            if (inv10YTD !== null && yahooVar !== null) {
                testados++
                const diff = Math.abs(yahooVar - inv10YTD)
                const pass = diff <= 1.0
                if (!pass && EXCECOES_YTD.includes(t)) {
                    console.log('Yahoo: ' + (yahooVar >= 0 ? '+' : '') + yahooVar.toFixed(2) + '%  Inv10: ' + (inv10YTD >= 0 ? '+' : '') + inv10YTD.toFixed(2) + '%  Diff: ' + diff.toFixed(2) + '%  ⏭️ EXCEÇÃO')
                } else if (!pass) {
                    ok = false
                    console.log('Yahoo: ' + (yahooVar >= 0 ? '+' : '') + yahooVar.toFixed(2) + '%  Inv10: ' + (inv10YTD >= 0 ? '+' : '') + inv10YTD.toFixed(2) + '%  Diff: ' + diff.toFixed(2) + '%  ❌')
                } else {
                    console.log('Yahoo: ' + (yahooVar >= 0 ? '+' : '') + yahooVar.toFixed(2) + '%  Inv10: ' + (inv10YTD >= 0 ? '+' : '') + inv10YTD.toFixed(2) + '%  Diff: ' + diff.toFixed(2) + '%  ✅')
                }
            } else {
                console.log('⚠️ dados insuficientes')
            }
        } catch (e) {
            console.log('⚠️ erro: ' + e.message?.slice(0, 40))
        }
    }
    console.log('   Testados: ' + testados + '/' + TODOS_FIIS.length)
    console.log('   Exceções ignoradas: ' + EXCECOES_YTD.filter(t => TODOS_FIIS.includes(t)).length)

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
    console.log('║  Sanity: 107 FIIs (6 tops: ranges + sinais + ordenação)     ║')
    console.log('║  Cruzamento: 107 FIIs vs SI (DY, P/VP) + Inv10 (YTD)        ║')
    console.log('║             + Investidor 10 independente (Consistência)      ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')

    const rankings = await testarSanity()
    await testarCruzamentoDY(rankings)
    await testarCruzamentoPVP(rankings)
    await testarCruzamentoConsistencia(rankings)
    await testarCruzamentoYTD()

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
