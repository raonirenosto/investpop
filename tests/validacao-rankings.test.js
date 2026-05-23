const axios = require('axios')
const https = require('https')
const agent = new https.Agent({ rejectUnauthorized: false })

// Importar funções
const { buscarRankings } = require('../gerar')

// Buscar dados de referência do Investidor 10
async function buscarReferencia(ticker) {
  const r = await axios.get('https://investidor10.com.br/fiis/' + ticker.toLowerCase() + '/', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })
  const html = r.data
  const dyMatch = html.match(/dividend\s*yield\s*de\s*(\d+[,.]\d+)\s*%/i)
  const pvpMatch = html.match(/P\/VP\s*de\s*(\d+[,.]\d+)/i)
  return {
    dy: dyMatch ? parseFloat(dyMatch[1].replace(',', '.')) : null,
    pvp: pvpMatch ? parseFloat(pvpMatch[1].replace(',', '.')) : null
  }
}

const TICKERS_TESTE = ['MXRF11', 'HGLG11', 'KNCR11', 'XPLG11', 'BTLG11']
const MARGEM_DY = 1.0 // tolerância de 1% absoluto no DY

describe('validação rankings vs Investidor 10', () => {
  let nossosDados = {}
  let refDados = {}

  beforeAll(async () => {
    // Buscar nossos dados
    const rankings = await buscarRankings(TICKERS_TESTE)
    // Mapear por ticker
    for (const item of rankings.allDY) {
      nossosDados[item.ticker] = nossosDados[item.ticker] || {}
      nossosDados[item.ticker].dy = parseFloat(item.valor.replace(',', '.'))
    }

    // Buscar referência do Investidor 10
    for (const t of TICKERS_TESTE) {
      try {
        refDados[t] = await buscarReferencia(t)
        await new Promise(r => setTimeout(r, 500))
      } catch (e) {
        refDados[t] = { dy: null, pvp: null }
      }
    }
  }, 60000)

  test.each(TICKERS_TESTE)('DY de %s dentro da margem de ' + MARGEM_DY + '%', (ticker) => {
    const nosso = nossosDados[ticker]?.dy
    const ref = refDados[ticker]?.dy
    if (!nosso || !ref) {
      console.log(`⚠️ ${ticker}: dados insuficientes (nosso: ${nosso}, ref: ${ref})`)
      return
    }
    const diff = Math.abs(nosso - ref)
    console.log(`${ticker} | Nosso DY: ${nosso.toFixed(2)}% | Ref: ${ref}% | Diff: ${diff.toFixed(2)}%`)
    expect(diff).toBeLessThanOrEqual(MARGEM_DY)
  })

  test('ranking DY tem pelo menos 5 resultados', () => {
    expect(Object.keys(nossosDados).length).toBeGreaterThanOrEqual(5)
  })
})
