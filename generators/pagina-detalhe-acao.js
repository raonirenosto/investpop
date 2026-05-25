const { headHtml, headerHtml, footerHtml } = require("./componentes")

function gerarPaginaDetalheAcao(acao, todasAcoes) {
    const corVar = acao.varDia >= 0 ? 'text-emerald-500' : 'text-red-500'
    const setaVar = acao.varDia >= 0 ? '\u2191' : '\u2193'
    const varDiaFmt = (acao.varDia >= 0 ? '+' : '') + acao.varDia.toFixed(2).replace('.', ',') + '%'

    const listaBusca = todasAcoes.map(a => a.ticker)

    return `${headHtml(acao.ticker + " \u2014 InvestPop", acao.ticker + " - Cota\u00e7\u00e3o e indicadores.")}

${headerHtml({basePath: '../', paginaAcoes: true})}

  <main class="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">

    <div class="hidden md:flex items-center gap-2 text-xs text-gray-500 mb-4">
      <a href="../acoes.html" class="hover:text-white">A\u00e7\u00f5es</a>
      <span>\u203a</span>
      <span class="text-gray-300">${acao.ticker}</span>
    </div>

    <div class="flex items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-xl md:text-3xl font-bold">${acao.ticker}</h1>
      </div>
      <div class="text-right">
        <p class="text-xl md:text-3xl font-bold whitespace-nowrap">R$ ${acao.preco.toFixed(2).replace('.', ',')}</p>
        <span class="text-xs md:text-sm ${corVar} font-medium">${varDiaFmt} ${setaVar}</span>
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
        <p class="text-lg font-bold mt-1 ${acao.varAno >= 0 ? 'text-emerald-400' : 'text-red-400'}">${acao.varAno !== 0 ? (acao.varAno >= 0 ? '+' : '') + acao.varAno.toFixed(2).replace('.', ',') + '%' : '-'}</p>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-4">
        <span class="text-[10px] text-gray-500 uppercase">Consist\u00eancia</span>
        <p class="text-lg font-bold text-orange-400 mt-1">${acao.mesesConsistentes > 0 ? acao.mesesConsistentes + ' meses' : '-'}</p>
      </div>
    </div>

  </main>

${footerHtml(global.INVESTPOP_TESTE ? {teste:true, basePath:'../', paginaAcoes:true} : {basePath:'../', paginaAcoes:true})}

  <script>
    var FIIS_LISTA = ${JSON.stringify(listaBusca)};
    var FIIS_BASE = '';
  </script>
  <script src="../busca.js"></script>

</body>
</html>`
}

module.exports = { gerarPaginaDetalheAcao }
