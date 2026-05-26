const { headHtml, headerHtml, footerHtml } = require("./componentes")

function gerarPaginaDetalheAcao(acao, todasAcoes, rankings) {
    const corVar = acao.varDia >= 0 ? 'text-emerald-500' : 'text-red-500'
    const setaVar = acao.varDia >= 0 ? '\u2191' : '\u2193'
    const varDiaFmt = (acao.varDia >= 0 ? '+' : '') + acao.varDia.toFixed(2).replace('.', ',') + '%'

    const corYtd = acao.varAno >= 0 ? 'text-emerald-500' : 'text-red-500'
    const ytdFmt = acao.varAno !== 0 ? (acao.varAno >= 0 ? '+' : '') + acao.varAno.toFixed(2).replace('.', ',') + '%' : '-'

    // Tops
    const tops = []
    const r = rankings || {}
    const posTop = (lista, ticker) => { const idx = (lista || []).findIndex(x => x.ticker === ticker); return idx >= 0 && idx < 5 ? idx + 1 : -1 }
    const posAlta = posTop(r.topAltas, acao.ticker)
    const posQueda = posTop(r.topQuedas, acao.ticker)
    const posDY = posTop(r.allDY, acao.ticker)
    const posPL = posTop(r.allBaratos, acao.ticker)
    const posYTD = posTop(r.allVarAno, acao.ticker)
    const posCons = posTop(r.allConsistentes, acao.ticker)
    if (posAlta > 0) tops.push({ nome: 'Maior Alta do Dia', pos: posAlta, cor: 'text-emerald-400', link: '../acoes-altas.html' })
    if (posQueda > 0) tops.push({ nome: 'Maior Queda do Dia', pos: posQueda, cor: 'text-red-400', link: '../acoes-quedas.html' })
    if (posDY > 0) tops.push({ nome: 'Mais Pagam', pos: posDY, cor: 'text-emerald-400', link: '../acoes-ranking-dy.html' })
    if (posPL > 0) tops.push({ nome: 'Mais Baratos', pos: posPL, cor: 'text-blue-400', link: '../acoes-ranking-baratos.html' })
    if (posYTD > 0) tops.push({ nome: 'Maior Valoriza\u00e7\u00e3o', pos: posYTD, cor: 'text-purple-400', link: '../acoes-ranking-valorizacao.html' })
    if (posCons > 0) tops.push({ nome: 'Mais Consistentes', pos: posCons, cor: 'text-orange-400', link: '../acoes-ranking-consistentes.html' })

    // Dividendos
    const divs = (acao.dividendos || []).slice(0, 5)
    const linhasDividendos = divs.map(d => `
            <tr class="border-t border-card-border">
              <td class="py-2.5 text-xs text-gray-500">${d.tipo || ''}</td>
              <td class="py-2.5">${d.dataCom || ''}</td>
              <td class="py-2.5">${d.pagamento || ''}</td>
              <td class="py-2.5 text-right text-emerald-400 font-medium">R$ ${d.valor ? d.valor.toFixed(4).replace('.', ',') : '-'}</td>
            </tr>`).join('\n')

    // Simulador
    const totalAnual = (acao.dividendos || []).slice(0, 20).reduce((s, d) => s + (d.valor || 0), 0)
    const mediaMensal = totalAnual / 12
    const simular = (valor) => {
        if (acao.preco <= 0 || mediaMensal <= 0) return '-'
        return ((valor / acao.preco) * mediaMensal).toFixed(2).replace('.', ',')
    }

    return `${headHtml(acao.ticker + " \u2014 InvestPop", acao.ticker + " - " + (acao.nome || 'A\u00e7\u00e3o') + ". Cota\u00e7\u00e3o, dividendos e indicadores.")}

${headerHtml({basePath: '../', paginaAcoes: true})}

  <main class="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">

    <div class="hidden md:flex items-center gap-2 text-xs text-gray-500 mb-4">
      <a href="../acoes.html" class="hover:text-white">A\u00e7\u00f5es</a>
      <span>\u203a</span>
      <span class="text-gray-300">${acao.ticker}</span>
    </div>

    <div class="flex items-center justify-between gap-3 mb-6">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl md:text-3xl font-bold">${acao.ticker}</h1>
          <span class="text-xs md:text-sm text-gray-400">${acao.nome || ''}</span>
        </div>

      </div>
      <div class="text-right">
        <p class="text-xl md:text-3xl font-bold whitespace-nowrap">R$ ${acao.preco.toFixed(2).replace('.', ',')}</p>
        <div class="flex items-center gap-1 justify-end">
          <span class="text-xs md:text-sm ${corVar} font-medium">${varDiaFmt}</span>
          <span class="text-[10px] md:text-xs text-gray-500">${setaVar}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-4">
        <span class="text-[10px] text-gray-500 uppercase">Dividend Yield (12M)</span>
        <p class="text-lg font-bold text-emerald-400 mt-1">${acao.dy > 0 ? acao.dy.toFixed(2).replace('.', ',') + '%' : '-'}</p>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-4">
        <span class="text-[10px] text-gray-500 uppercase">P/L</span>
        <p class="text-lg font-bold mt-1">${acao.pl ? acao.pl.toFixed(2).replace('.', ',') : '-'}</p>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-4">
        <span class="text-[10px] text-gray-500 uppercase">Var. Ano (YTD)</span>
        <p class="text-lg font-bold mt-1 ${corYtd}">${ytdFmt}</p>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-4">
        <span class="text-[10px] text-gray-500 uppercase">Consist\u00eancia</span>
        <p class="text-lg font-bold text-orange-400 mt-1">${acao.mesesConsistentes > 0 ? acao.mesesConsistentes + ' anos' : '-'}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">


      <div class="bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">Rentabilidade</h2>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">No ano (YTD)</span>
            <span class="text-sm font-medium ${corYtd}">${ytdFmt}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">Consist\u00eancia</span>
            <span class="text-sm font-medium text-orange-400">${acao.mesesConsistentes > 0 ? acao.mesesConsistentes + ' anos' : '-'}</span>
          </div>
        </div>
      </div>

${divs.length > 0 ? `
      <div class="lg:col-span-3 bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">\u00daltimos Proventos</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-gray-500 text-xs">
              <th class="text-left pb-2 font-medium">Tipo</th>
              <th class="text-left pb-2 font-medium">Data Com</th>
              <th class="text-left pb-2 font-medium">Pagamento</th>
              <th class="text-right pb-2 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody class="text-gray-200">
${linhasDividendos}
          </tbody>
        </table>
      </div>` : ''}

${mediaMensal > 0 ? `
      <div class="lg:col-span-3 bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">Quanto vou receber por m\u00eas?</h2>
        <p class="text-xs text-gray-500 mb-3">Baseado nos proventos dos \u00faltimos 12 meses (a\u00e7\u00e3o a R$ ${acao.preco.toFixed(2).replace('.', ',')})</p>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 1.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(1000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 5.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(5000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 10.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(10000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 25.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(25000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 50.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(50000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 100.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(100000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 500.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(500000)}</span></div>
        </div>
      </div>` : ''}

${tops.length > 0 ? `
      <div class="lg:col-span-3 bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">Aparece nos Rankings</h2>
        <div class="flex flex-wrap gap-3">
${tops.map(t => `          <a href="${t.link}" class="flex items-center gap-2 bg-[#132743] rounded-lg px-3 py-2 hover:bg-[#1a3352]">
            <span class="text-xs font-bold ${t.cor}">#${t.pos}</span>
            <span class="text-sm text-gray-300">${t.nome}</span>
          </a>`).join('\n')}
        </div>
      </div>` : ''}

    </div>
  </main>

${footerHtml(global.INVESTPOP_TESTE ? {teste:true, basePath:'../', paginaAcoes:true} : {basePath:'../', paginaAcoes:true})}

  <script>
    var FIIS_BASE = '../fiis/';
    var ACOES_BASE = '';
  </script>
  <script src="../busca.js"></script>

</body>
</html>`
}

module.exports = { gerarPaginaDetalheAcao }
