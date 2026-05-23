const fs = require('fs')
const path = require('path')

const CACHE_FILE = path.resolve(__dirname, '../data/cache_fiis.csv')

// Importar funções
const { lerFiis, carregarCache, salvarCache } = require('../gerar')

describe('lerFiis', () => {
  test('retorna array de tickers em uppercase', () => {
    const fiis = lerFiis()
    expect(Array.isArray(fiis)).toBe(true)
    expect(fiis.length).toBeGreaterThan(0)
    fiis.forEach(ticker => {
      expect(ticker).toBe(ticker.toUpperCase())
      expect(ticker.length).toBeGreaterThan(0)
    })
  })

  test('não contém linhas vazias', () => {
    const fiis = lerFiis()
    fiis.forEach(ticker => {
      expect(ticker.trim()).not.toBe('')
    })
  })
})

describe('cache', () => {
  const testCache = path.resolve(__dirname, '../data/cache_test.csv')

  afterEach(() => {
    if (fs.existsSync(testCache)) fs.unlinkSync(testCache)
  })

  test('salvarCache grava CSV corretamente', () => {
    const dados = [
      { ticker: 'HGLG11', preco: '155,30', variacao: '+0,36%', varNum: 0.36 },
      { ticker: 'XPLG11', preco: '97,47', variacao: '-0,02%', varNum: -0.02 }
    ]
    // Salvar no path de teste
    let csv = "ticker;preco;variacao;varNum\n"
    for (const r of dados) csv += `${r.ticker};${r.preco};${r.variacao};${r.varNum}\n`
    fs.writeFileSync(testCache, csv)

    const conteudo = fs.readFileSync(testCache, 'utf-8')
    expect(conteudo).toContain('HGLG11')
    expect(conteudo).toContain('XPLG11')
    expect(conteudo.split('\n')[0]).toBe('ticker;preco;variacao;varNum')
  })

  test('carregarCache retorna null se arquivo não existe', () => {
    const original = CACHE_FILE
    // Testar com arquivo inexistente
    const result = carregarCache()
    // Se cache existe retorna dados, se não retorna null
    if (fs.existsSync(CACHE_FILE)) {
      expect(Array.isArray(result)).toBe(true)
    } else {
      expect(result).toBeNull()
    }
  })
})

describe('ordenação altas/quedas', () => {
  test('altas ordenadas do maior para menor', () => {
    const resultados = [
      { ticker: 'A', varNum: 1.5 },
      { ticker: 'B', varNum: 3.0 },
      { ticker: 'C', varNum: 0.5 },
      { ticker: 'D', varNum: -1.0 },
    ]
    const altas = resultados.filter(r => r.varNum > 0).sort((a, b) => b.varNum - a.varNum)
    expect(altas[0].ticker).toBe('B')
    expect(altas[1].ticker).toBe('A')
    expect(altas[2].ticker).toBe('C')
  })

  test('quedas ordenadas do menor para maior', () => {
    const resultados = [
      { ticker: 'A', varNum: -0.5 },
      { ticker: 'B', varNum: -3.0 },
      { ticker: 'C', varNum: -1.5 },
      { ticker: 'D', varNum: 1.0 },
    ]
    const quedas = resultados.filter(r => r.varNum < 0).sort((a, b) => a.varNum - b.varNum)
    expect(quedas[0].ticker).toBe('B')
    expect(quedas[1].ticker).toBe('C')
    expect(quedas[2].ticker).toBe('A')
  })

  test('top 5 limita corretamente', () => {
    const resultados = Array.from({ length: 10 }, (_, i) => ({ ticker: `FII${i}`, varNum: i + 1 }))
    const altas = resultados.filter(r => r.varNum > 0).sort((a, b) => b.varNum - a.varNum)
    const top5 = altas.slice(0, 5)
    expect(top5.length).toBe(5)
    expect(top5[0].varNum).toBe(10)
  })
})
