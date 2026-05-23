const axios = require('axios')
const https = require('https')
const agent = new https.Agent({ rejectUnauthorized: false })

/**
 * Lógica calcularMesesSemQuebra — idêntica ao módulo original do projeto fiis
 */
function calcularMesesSemQuebra(rendimentos) {
    if (rendimentos.length < 3) return { meses: rendimentos.length, quebra: null }
    const lista = rendimentos.map(function (h) {
        const valor = typeof h.valor === 'number' ? h.valor : parseFloat(h.valor.replace(/\./g, '').replace(',', '.'))
        return { data: h.data, valor }
    })
    let meses = 1
    for (let i = 0; i < lista.length - 2; i++) {
        const atual = lista[i]
        const proximo = lista[i + 1]
        const depois = lista[i + 2]
        if (atual.valor >= proximo.valor) { meses++; continue }
        const ehPicoTemporario = proximo.valor > atual.valor && depois.valor <= atual.valor
        if (ehPicoTemporario) { meses++; continue }
        return { meses, quebra: proximo.data }
    }
    return { meses: lista.length, quebra: null }
}

/**
 * Buscar rendimentos via Status Invest API (fonte do módulo original)
 */
async function buscarStatusInvest(ticker) {
    const response = await axios.get('https://statusinvest.com.br/fii/companytickerprovents', {
        params: { ticker, chartProvidentType: 2 },
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const dados = response.data.assetEarningsModels || []
    return dados
        .filter(d => d.et === 'Rendimento')
        .map(d => ({ data: d.ed, valor: d.v }))
}

/**
 * Buscar rendimentos via Yahoo Finance (nossa fonte)
 */
async function buscarYahoo(ticker) {
    const r = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}.SA?interval=1mo&range=5y&events=div`, {
        httpsAgent: agent,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const res = r.data.chart.result[0]
    const divs = res.events?.dividends ? Object.values(res.events.dividends) : []
    divs.sort((a, b) => b.date - a.date)
    return divs.map(d => ({ data: new Date(d.date * 1000).toLocaleDateString('pt-BR'), valor: d.amount }))
}

// Tickers que sabemos ter quebra recente (ambas fontes encontram)
const TICKERS_COM_QUEBRA = ['MXRF11', 'KNCR11', 'KNRI11', 'PVBI11']
// Tickers com muitos meses (Yahoo tem mais dados que Status Invest API)
const TICKERS_CONSISTENTES = ['HGRU11', 'HGLG11', 'XPLG11']

describe('validação consistência - lógica calcularMesesSemQuebra', () => {

    test('lógica produz mesmo resultado com mesmos dados de entrada', () => {
        // Dados simulados - deve dar 5 meses com quebra no 6o
        const dados = [
            { data: '01/05/2026', valor: 1.00 },
            { data: '01/04/2026', valor: 1.00 },
            { data: '01/03/2026', valor: 1.00 },
            { data: '01/02/2026', valor: 1.00 },
            { data: '01/01/2026', valor: 1.00 },
            { data: '01/12/2025', valor: 1.10 }, // quebra: subiu e não voltou
            { data: '01/11/2025', valor: 1.10 },
            { data: '01/10/2025', valor: 0.90 },
        ]
        const resultado = calcularMesesSemQuebra(dados)
        expect(resultado.meses).toBe(5)
        expect(resultado.quebra).toBe('01/12/2025')
    })

    test('pico temporário é tolerado', () => {
        const dados = [
            { data: '01/05/2026', valor: 1.00 },
            { data: '01/04/2026', valor: 1.00 },
            { data: '01/03/2026', valor: 1.10 }, // pico temporário
            { data: '01/02/2026', valor: 1.00 }, // voltou
            { data: '01/01/2026', valor: 1.00 },
        ]
        const resultado = calcularMesesSemQuebra(dados)
        expect(resultado.meses).toBe(5)
        expect(resultado.quebra).toBeNull()
    })

    test('sem quebra retorna total de meses', () => {
        const dados = [
            { data: '01/05/2026', valor: 1.00 },
            { data: '01/04/2026', valor: 1.00 },
            { data: '01/03/2026', valor: 1.00 },
            { data: '01/02/2026', valor: 1.05 },
            { data: '01/01/2026', valor: 1.10 },
        ]
        const resultado = calcularMesesSemQuebra(dados)
        expect(resultado.meses).toBe(5)
    })
})

describe('validação consistência - Yahoo vs Status Invest (tickers com quebra recente)', () => {

    test.each(TICKERS_COM_QUEBRA)('%s: meses devem ser iguais entre Yahoo e Status Invest', async (ticker) => {
        const yahooData = await buscarYahoo(ticker)
        const statusData = await buscarStatusInvest(ticker)

        const yahooResult = calcularMesesSemQuebra(yahooData)
        const statusResult = calcularMesesSemQuebra(statusData)

        console.log(`${ticker} | Yahoo: ${yahooResult.meses} meses | StatusInvest: ${statusResult.meses} meses`)

        // Quando ambos encontram quebra, o número de meses deve ser igual
        expect(yahooResult.meses).toBe(statusResult.meses)
    }, 15000)
})

describe('validação consistência - Yahoo tem mais dados que Status Invest API', () => {

    test.each(TICKERS_CONSISTENTES)('%s: Yahoo deve ter >= meses que Status Invest (API limitada)', async (ticker) => {
        const yahooData = await buscarYahoo(ticker)
        const statusData = await buscarStatusInvest(ticker)

        const yahooResult = calcularMesesSemQuebra(yahooData)
        const statusResult = calcularMesesSemQuebra(statusData)

        console.log(`${ticker} | Yahoo: ${yahooResult.meses} meses (${yahooData.length} divs) | StatusInvest: ${statusResult.meses} meses (${statusData.length} divs)`)

        // Yahoo tem mais histórico, então deve ter >= meses
        expect(yahooResult.meses).toBeGreaterThanOrEqual(statusResult.meses)
        // Yahoo deve ter mais dados brutos
        expect(yahooData.length).toBeGreaterThan(statusData.length)
    }, 15000)
})
