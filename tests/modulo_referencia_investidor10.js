/**
 * Módulo de referência — réplica exata da lógica do pvp-fiis.js
 * quando executado com a flag --investidor10
 *
 * Fonte: /Users/raonicoelho/Projects/Particulares/fiis/pvp-fiis.js
 */
const axios = require("axios")
const https = require("https")
const agentSemSSL = new https.Agent({ rejectUnauthorized: false })

// ===============================
// Lógica calcularMesesSemQuebra (idêntica ao pvp-fiis.js)
// ===============================

function calcularMesesSemQuebraMfinance(rendimentos) {

    if (rendimentos.length < 3) {
        return { meses: rendimentos.length, quebra: null }
    }

    let meses = 1

    for (let i = 0; i < rendimentos.length - 2; i++) {

        const atual = rendimentos[i]
        const proximo = rendimentos[i + 1]
        const depois = rendimentos[i + 2]

        if (atual.valor >= proximo.valor) {
            meses++
            continue
        }

        const ehPicoTemporario =
            proximo.valor > atual.valor
            && depois.valor <= atual.valor

        if (ehPicoTemporario) {
            meses++
            continue
        }

        return { meses, quebra: proximo.data }
    }

    return { meses: rendimentos.length, quebra: null }
}

// ===============================
// Scraping Investidor 10 (idêntico ao pvp-fiis.js analisarMesesInvestidor10)
// ===============================

async function buscarRendimentosInvestidor10(ticker) {

    const urlDiv = `https://investidor10.com.br/fiis/${ticker.toLowerCase()}/dividendos/`
    const r = await axios.get(urlDiv, { httpsAgent: agentSemSSL, headers: { 'User-Agent': 'Mozilla/5.0' } })

    const html = r.data
    const rendimentos = []

    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
    let trMatch

    while ((trMatch = trRegex.exec(html)) !== null) {

        const tds = []
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
        let tdMatch

        while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
            tds.push(tdMatch[1].replace(/<[^>]+>/g, '').trim())
        }

        if (tds.length >= 4 && tds[0].toLowerCase().includes('dividendo')) {
            rendimentos.push({
                data: tds[1],
                valor: parseFloat(tds[3].replace(/\./g, '').replace(',', '.'))
            })
        }
    }

    return rendimentos
}

// ===============================
// Analisar FIIs (réplica de analisarMesesInvestidor10 sem cache)
// ===============================

async function analisarMesesInvestidor10(listaFiis) {

    const resultados = []

    for (const ticker of listaFiis) {

        try {

            await new Promise(r => setTimeout(r, 1500))

            const rendimentos = await buscarRendimentosInvestidor10(ticker)
            const resultado = calcularMesesSemQuebraMfinance(rendimentos)

            const info = resultado.quebra ? `quebra: ${resultado.quebra}` : "sem quebra"
            console.log(`🌐 ${ticker} — ${resultado.meses} meses (investidor10, ${info})`)

            resultados.push({ ticker, meses: resultado.meses, quebra: resultado.quebra })

        } catch (e) {

            console.log(`❌ ${ticker}: ${e.message}`)
            resultados.push({ ticker, erro: true, mensagem: e.message })
        }
    }

    return resultados
}

module.exports = { calcularMesesSemQuebraMfinance, buscarRendimentosInvestidor10, analisarMesesInvestidor10 }
