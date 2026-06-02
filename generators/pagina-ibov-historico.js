const fs = require('fs')
const path = require('path')
const { headHtml, headerHtml, footerHtml } = require("./componentes")

function gerarPaginaIbovHistorico() {
    // Ler lista atual
    const csvPath = path.resolve(__dirname, '../data/ibov_acoes.csv')
    const lista = fs.existsSync(csvPath) ? fs.readFileSync(csvPath, 'utf-8').split('\n').slice(1).filter(l => l.trim()).map(l => { const [c, ...r] = l.split(','); return { cod: c.trim(), nome: r.join(',').trim() } }) : []

    // Ler histórico
    const histPath = path.resolve(__dirname, '../data/ibov_historico.csv')
    const historico = fs.existsSync(histPath) ? fs.readFileSync(histPath, 'utf-8').split('\n').slice(1).filter(l => l.trim()).map(l => { const [data, horario, ticker, nome, tipo] = l.split(','); return { data, horario, ticker, nome, tipo } }) : []

    const linhasLista = lista.map((item, i) => `
          <tr class="border-t border-card-border">
            <td class="py-2 text-gray-500 text-xs">${i + 1}</td>
            <td class="py-2 font-medium text-sm"><a href="acoes/${item.cod}.html" class="hover:underline">${item.cod}</a></td>
            <td class="py-2 text-sm text-gray-400">${item.nome}</td>
          </tr>`).join('\n')

    const linhasHistorico = historico.reverse().map(h => `
          <tr class="border-t border-card-border">
            <td class="py-2 text-xs text-gray-500">${h.data || ''}</td>
            <td class="py-2 text-xs text-gray-500">${h.horario || ''}</td>
            <td class="py-2 font-medium text-sm">${h.ticker || ''}</td>
            <td class="py-2 text-sm text-gray-400">${h.nome || ''}</td>
            <td class="py-2 text-xs font-medium ${h.tipo === 'ADICIONADA' ? 'text-emerald-400' : 'text-red-400'}">${h.tipo || ''}</td>
          </tr>`).join('\n')

    return `${headHtml("InvestPop \u2014 IBOV Composi\u00e7\u00e3o", "Composi\u00e7\u00e3o atual do IBOV e hist\u00f3rico de mudan\u00e7as.")}
  <meta name="robots" content="noindex, nofollow" />

${headerHtml({basePath:'../'})}

  <main class="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
    <a href="console.html" class="text-sm text-gray-400 hover:text-white mb-4 inline-block">&larr; Console</a>
    <h1 class="text-lg md:text-xl font-bold mb-6">\ud83d\udcca Composi\u00e7\u00e3o do IBOV</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">Lista Atual (${lista.length} a\u00e7\u00f5es)</h2>
        <div class="max-h-96 overflow-y-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-gray-500 text-xs"><th class="text-left pb-2">#</th><th class="text-left pb-2">Ticker</th><th class="text-left pb-2">Empresa</th></tr></thead>
            <tbody class="text-gray-200">
${linhasLista}
            </tbody>
          </table>
        </div>
      </div>

      <div class="bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">Hist\u00f3rico de Mudan\u00e7as</h2>
${historico.length > 0 ? `
        <div class="max-h-96 overflow-y-auto">
          <table class="w-full text-sm">
            <thead><tr class="text-gray-500 text-xs"><th class="text-left pb-2">Data</th><th class="text-left pb-2">Hora</th><th class="text-left pb-2">Ticker</th><th class="text-left pb-2">Empresa</th><th class="text-left pb-2">Tipo</th></tr></thead>
            <tbody class="text-gray-200">
${linhasHistorico}
            </tbody>
          </table>
        </div>` : '<p class="text-sm text-gray-500 text-center py-8">Nenhuma mudan\u00e7a registrada ainda</p>'}
      </div>
    </div>
  </main>

${footerHtml(global.INVESTPOP_TESTE ? {teste:true, basePath:'../'} : {basePath:'../'})}

</body>
</html>`
}

module.exports = { gerarPaginaIbovHistorico }
