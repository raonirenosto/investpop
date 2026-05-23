const { headHtml, headerHtml, footerHtml } = require("./componentes")

function linhasTabela(lista, cor) {
    return lista.map((item, i) => `
              <tr class="border-t border-card-border">
                <td class="py-2.5 text-gray-500">${i + 1}</td>
                <td class="py-2.5 font-medium">${item.ticker}</td>
                <td class="py-2.5 text-right ${cor} font-medium">${item.variacao}</td>
                <td class="py-2.5 text-right text-gray-400">R$ ${item.preco}</td>
              </tr>`).join("\n")
}

function gerarHtml(ifix, altas, quedas) {
    const maiorAlta = altas[0] || { ticker: "-", variacao: "-", preco: "-" }
    const maiorBaixa = quedas[0] || { ticker: "-", variacao: "-", preco: "-" }
    const corIfix = !ifix.variacao.includes("-") ? "text-emerald-500" : "text-red-500"

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "InvestPop",
        "url": "https://investpop.com.br",
        "description": "Acompanhe os Fundos Imobili\u00e1rios (FIIs) em tempo real. Veja IFIX, maiores altas e quedas do dia.",
        "publisher": { "@type": "Organization", "name": "InvestPop" }
    }

    return `${headHtml("InvestPop \u2014 Radar de FIIs em tempo real", "Acompanhe os Fundos Imobili\u00e1rios (FIIs) em tempo real. Veja IFIX, maiores altas e quedas do dia.", jsonLd)}

${headerHtml()}

  <main class="px-4 md:px-8 py-6 md:py-8">
    <h1 class="sr-only">InvestPop \u2014 Radar de Fundos Imobili\u00e1rios em tempo real</h1>
    <div class="flex items-center gap-2 mb-4">
      <svg class="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 17l6-6 4 4 8-8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
      <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Resumo do Mercado</h2>
    </div>

    <div class="grid grid-cols-3 gap-3 md:gap-5">
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-5">
        <span class="text-[10px] md:text-xs text-gray-500 uppercase font-medium">IFIX Hoje</span>
        <p class="text-lg md:text-2xl lg:text-3xl font-bold mt-1">${ifix.valor}</p>
        <span class="text-xs md:text-sm ${corIfix} font-medium">${ifix.variacao}</span>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-5">
        <span class="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Maior Alta</span>
        <p class="text-lg md:text-2xl lg:text-3xl font-bold mt-1">${maiorAlta.ticker}</p>
        <span class="text-xs md:text-sm text-emerald-500 font-medium">${maiorAlta.variacao}</span>
        <div class="hidden md:block mt-1 text-xs text-gray-400">R$ ${maiorAlta.preco}</div>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-5">
        <span class="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Maior Baixa</span>
        <p class="text-lg md:text-2xl lg:text-3xl font-bold mt-1">${maiorBaixa.ticker}</p>
        <span class="text-xs md:text-sm text-red-500 font-medium">${maiorBaixa.variacao}</span>
        <div class="hidden md:block mt-1 text-xs text-gray-400">R$ ${maiorBaixa.preco}</div>
      </div>
    </div>

    <div class="mt-8">
      <div class="flex items-center gap-2 mb-4">
        <div class="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
          <span class="text-[10px] font-bold">+</span>
        </div>
        <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Radar do Dia</h2>
      </div>

      <div class="flex md:hidden gap-4 mb-4 border-b border-card-border">
        <button id="tab-altas" class="pb-2 text-sm font-medium text-emerald-500 border-b-2 border-emerald-500" onclick="showTab('altas')">Maiores Altas</button>
        <button id="tab-quedas" class="pb-2 text-sm font-medium text-gray-500" onclick="showTab('quedas')">Maiores Quedas</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div id="panel-altas" class="bg-card border border-card-border rounded-xl p-4 md:p-5">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
            </svg>
            <h3 class="text-xs font-semibold text-gray-300 uppercase">Top 5 Maiores Altas do Dia</h3>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-gray-500 text-xs">
                <th class="text-left pb-2 font-medium">#</th>
                <th class="text-left pb-2 font-medium">FII</th>
                <th class="text-right pb-2 font-medium">Var. Dia</th>
                <th class="text-right pb-2 font-medium">Pre\u00e7o</th>
              </tr>
            </thead>
            <tbody class="text-gray-200">
${linhasTabela(altas, "text-emerald-500")}
            </tbody>
          </table>
          <div class="mt-3 text-center">
            <a href="altas.html" class="text-emerald-500 text-xs font-medium hover:underline">Ver todos</a>
          </div>
        </div>

        <div id="panel-quedas" class="hidden md:block bg-card border border-card-border rounded-xl p-4 md:p-5">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
            <h3 class="text-xs font-semibold text-gray-300 uppercase">Top 5 Maiores Quedas do Dia</h3>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-gray-500 text-xs">
                <th class="text-left pb-2 font-medium">#</th>
                <th class="text-left pb-2 font-medium">FII</th>
                <th class="text-right pb-2 font-medium">Var. Dia</th>
                <th class="text-right pb-2 font-medium">Pre\u00e7o</th>
              </tr>
            </thead>
            <tbody class="text-gray-200">
${linhasTabela(quedas, "text-red-500")}
            </tbody>
          </table>
          <div class="mt-3 text-center">
            <a href="quedas.html" class="text-red-500 text-xs font-medium hover:underline">Ver todos</a>
          </div>
        </div>
      </div>
    </div>
  </main>

${footerHtml(global.INVESTPOP_TESTE ? {teste:true} : {})}

  <script>
    function showTab(tab) {
      var altas = document.getElementById('panel-altas');
      var quedas = document.getElementById('panel-quedas');
      var tabAltas = document.getElementById('tab-altas');
      var tabQuedas = document.getElementById('tab-quedas');
      if (tab === 'altas') {
        altas.classList.remove('hidden');
        quedas.classList.add('hidden');
        tabAltas.classList.add('text-emerald-500', 'border-b-2', 'border-emerald-500');
        tabAltas.classList.remove('text-gray-500');
        tabQuedas.classList.remove('text-red-500', 'border-b-2', 'border-red-500');
        tabQuedas.classList.add('text-gray-500');
      } else {
        altas.classList.add('hidden');
        quedas.classList.remove('hidden');
        quedas.classList.remove('md:block');
        tabQuedas.classList.add('text-red-500', 'border-b-2', 'border-red-500');
        tabQuedas.classList.remove('text-gray-500');
        tabAltas.classList.remove('text-emerald-500', 'border-b-2', 'border-emerald-500');
        tabAltas.classList.add('text-gray-500');
      }
    }
  </script>

</body>
</html>`
}

module.exports = { gerarHtml }
