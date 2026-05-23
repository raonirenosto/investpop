const { headHtml, headerHtml, footerHtml } = require('../generators/componentes')
const { gerarHtml } = require('../generators/pagina-index')
const { gerarPaginaLista } = require('../generators/pagina-lista')
const { gerarConsole } = require('../generators/pagina-console')

const mockIfix = { valor: '3.855,09', variacao: '+0,13%' }
const mockAltas = [
  { ticker: 'TRBL11', preco: '66,64', variacao: '+3,14%', varNum: 3.14 },
  { ticker: 'HFOF11', preco: '6,50', variacao: '+2,36%', varNum: 2.36 },
]
const mockQuedas = [
  { ticker: 'HCTR11', preco: '16,59', variacao: '-2,24%', varNum: -2.24 },
  { ticker: 'SNCI11', preco: '85,86', variacao: '-2,18%', varNum: -2.18 },
]

describe('componentes', () => {
  test('headHtml gera DOCTYPE e meta tags', () => {
    const html = headHtml('Titulo', 'Descricao')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<title>Titulo</title>')
    expect(html).toContain('content="Descricao"')
    expect(html).toContain('og:title')
    expect(html).toContain('twitter:card')
    expect(html).toContain('og-image.svg')
  })

  test('headHtml inclui JSON-LD quando fornecido', () => {
    const jsonLd = { "@context": "https://schema.org", "@type": "WebSite" }
    const html = headHtml('T', 'D', jsonLd)
    expect(html).toContain('application/ld+json')
    expect(html).toContain('schema.org')
  })

  test('headerHtml gera nav com logo', () => {
    const html = headerHtml()
    expect(html).toContain('Invest')
    expect(html).toContain('Pop')
    expect(html).toContain('<nav')
    expect(html).toContain('index.html')
  })

  test('footerHtml inclui tracking quando não é teste', () => {
    const html = footerHtml({})
    expect(html).toContain('freeipapi.com')
    expect(html).toContain('script.google.com')
  })

  test('footerHtml omite tracking em modo teste', () => {
    const html = footerHtml({ teste: true })
    expect(html).not.toContain('freeipapi.com')
  })
})

describe('pagina-index', () => {
  test('gera HTML completo com IFIX, altas e quedas', () => {
    global.INVESTPOP_TESTE = true
    const html = gerarHtml(mockIfix, mockAltas, mockQuedas)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('3.855,09')
    expect(html).toContain('+0,13%')
    expect(html).toContain('TRBL11')
    expect(html).toContain('HCTR11')
    expect(html).toContain('</html>')
  })

  test('inclui h1 para SEO', () => {
    global.INVESTPOP_TESTE = true
    const html = gerarHtml(mockIfix, mockAltas, mockQuedas)
    expect(html).toContain('<h1')
  })

  test('inclui JSON-LD', () => {
    global.INVESTPOP_TESTE = true
    const html = gerarHtml(mockIfix, mockAltas, mockQuedas)
    expect(html).toContain('application/ld+json')
  })

  test('inclui links para ver todos', () => {
    global.INVESTPOP_TESTE = true
    const html = gerarHtml(mockIfix, mockAltas, mockQuedas)
    expect(html).toContain('altas.html')
    expect(html).toContain('quedas.html')
  })

  test('lida com listas vazias', () => {
    global.INVESTPOP_TESTE = true
    const html = gerarHtml(mockIfix, [], [])
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('-')
  })
})

describe('pagina-lista', () => {
  test('gera página de altas com título e dados', () => {
    global.INVESTPOP_TESTE = true
    const html = gerarPaginaLista('Maiores Altas do Dia', mockAltas, 'text-emerald-500')
    expect(html).toContain('Maiores Altas do Dia')
    expect(html).toContain('TRBL11')
    expect(html).toContain('+3,14%')
    expect(html).toContain('text-emerald-500')
  })

  test('inclui campo de busca', () => {
    global.INVESTPOP_TESTE = true
    const html = gerarPaginaLista('Teste', mockAltas, 'text-emerald-500')
    expect(html).toContain('id="busca"')
    expect(html).toContain('filtrar()')
  })

  test('inclui link de voltar', () => {
    global.INVESTPOP_TESTE = true
    const html = gerarPaginaLista('Teste', mockAltas, 'text-emerald-500')
    expect(html).toContain('index.html')
    expect(html).toContain('Voltar')
  })
})

describe('pagina-console', () => {
  test('gera HTML do console com gráfico e tabela', () => {
    global.INVESTPOP_TESTE = true
    const html = gerarConsole()
    expect(html).toContain('Console de Acessos')
    expect(html).toContain('chart.js')
    expect(html).toContain('id="grafico"')
    expect(html).toContain('id="tabela-body"')
  })

  test('inclui noindex para SEO', () => {
    global.INVESTPOP_TESTE = true
    const html = gerarConsole()
    expect(html).toContain('noindex')
  })

  test('inclui filtro de bots marcado por padrão', () => {
    global.INVESTPOP_TESTE = true
    const html = gerarConsole()
    expect(html).toContain('filtro-bots')
    expect(html).toContain('checked')
  })

  test('referencia console.js', () => {
    global.INVESTPOP_TESTE = true
    const html = gerarConsole()
    expect(html).toContain('src="console.js"')
  })
})
