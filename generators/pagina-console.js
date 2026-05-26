const { headHtml, headerHtml, footerHtml } = require("./componentes")

function gerarConsole() {
    return `${headHtml("InvestPop \u2014 Console", "Painel administrativo do InvestPop.")}
  <meta name="robots" content="noindex, nofollow" />

${headerHtml()}

  <main class="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
    <h1 class="text-lg md:text-xl font-bold mb-6">&#9881; Console Administrativo</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <a href="acessos.html" class="bg-card border border-card-border rounded-xl p-6 hover:border-emerald-500/50 transition-colors">
        <p class="text-2xl mb-2">&#128202;</p>
        <h2 class="text-sm font-bold text-gray-200 mb-1">Acessos</h2>
        <p class="text-xs text-gray-500">Tracking de visitas, dispositivos, pa\u00edses e gr\u00e1fico de acessos</p>
      </a>
      <a href="ibov-historico.html" class="bg-card border border-card-border rounded-xl p-6 hover:border-emerald-500/50 transition-colors">
        <p class="text-2xl mb-2">&#128200;</p>
        <h2 class="text-sm font-bold text-gray-200 mb-1">IBOV - Composi\u00e7\u00e3o</h2>
        <p class="text-xs text-gray-500">Lista atual de a\u00e7\u00f5es do IBOV e hist\u00f3rico de adi\u00e7\u00f5es/remo\u00e7\u00f5es</p>
      </a>
    </div>
  </main>

${footerHtml(global.INVESTPOP_TESTE ? {teste:true} : {})}

</body>
</html>`
}

module.exports = { gerarConsole }
