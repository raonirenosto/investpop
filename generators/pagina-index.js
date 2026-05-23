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

function linhasRanking(lista, cor) {
    return lista.map((item, i) => `
              <tr class="border-t border-card-border"><td class="py-2.5 text-gray-500">${i + 1}</td><td class="py-2.5 font-medium">${item.ticker}</td><td class="py-2.5 text-right ${cor} font-medium">${item.valor}</td></tr>`).join("\n")
}

function gerarHtml(ifix, altas, quedas, rankings) {
    const maiorAlta = altas[0] || { ticker: "-", variacao: "-", preco: "-" }
    const maiorBaixa = quedas[0] || { ticker: "-", variacao: "-", preco: "-" }
    const corIfix = !ifix.variacao.includes("-") ? "text-emerald-500" : "text-red-500"
    rankings = rankings || { topDY: [], topVarAno: [], topConsistentes: [] }

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
    <div class="mt-8">
      <div class="flex items-center gap-2 mb-4">
        <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
        <h2 class="text-sm font-semibold text-gray-300 uppercase tracking-wide">Rankings</h2>
      </div>

      <div class="flex md:hidden gap-4 mb-4 border-b border-card-border overflow-x-auto">
        <button id="tab-rank-pagam" class="pb-2 text-sm font-medium text-emerald-500 border-b-2 border-emerald-500 whitespace-nowrap" onclick="showRankTab('pagam')">Mais Pagam</button>
        <button id="tab-rank-baratos" class="pb-2 text-sm font-medium text-gray-500 whitespace-nowrap" onclick="showRankTab('baratos')">Mais Baratos</button>
        <button id="tab-rank-valorizacao" class="pb-2 text-sm font-medium text-gray-500 whitespace-nowrap" onclick="showRankTab('valorizacao')">Valoriza\u00e7\u00e3o</button>
        <button id="tab-rank-consistentes" class="pb-2 text-sm font-medium text-gray-500 whitespace-nowrap" onclick="showRankTab('consistentes')">Consistentes</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div id="panel-rank-pagam" class="bg-card border border-card-border rounded-xl p-4 md:p-5">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 class="text-xs font-semibold text-gray-300 uppercase">Top 5 que Mais Pagam</h3>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-gray-500 text-xs">
                <th class="text-left pb-2 font-medium">#</th>
                <th class="text-left pb-2 font-medium">FII</th>
                <th class="text-right pb-2 font-medium">DY (12M)</th>
              </tr>
            </thead>
            <tbody class="text-gray-200">
${linhasRanking(rankings.topDY, "text-emerald-500")}
            </tbody>
          </table>
          <div class="mt-3 text-center">
            <a href="ranking-dy.html" class="text-emerald-500 text-xs font-medium hover:underline">Ver todos</a>
          </div>
        </div>

        <div id="panel-rank-baratos" class="hidden md:block bg-card border border-card-border rounded-xl p-4 md:p-5">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
            <h3 class="text-xs font-semibold text-gray-300 uppercase">Top 5 Mais Baratos (Mockado)</h3>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-gray-500 text-xs">
                <th class="text-left pb-2 font-medium">#</th>
                <th class="text-left pb-2 font-medium">FII</th>
                <th class="text-right pb-2 font-medium">P/VP</th>
              </tr>
            </thead>
            <tbody class="text-gray-200">
              <tr class="border-t border-card-border"><td class="py-2.5 text-gray-500">1</td><td class="py-2.5 font-medium">HCTR11</td><td class="py-2.5 text-right text-blue-400 font-medium">0,75</td></tr>
              <tr class="border-t border-card-border"><td class="py-2.5 text-gray-500">2</td><td class="py-2.5 font-medium">VISC11</td><td class="py-2.5 text-right text-blue-400 font-medium">0,79</td></tr>
              <tr class="border-t border-card-border"><td class="py-2.5 text-gray-500">3</td><td class="py-2.5 font-medium">RBRP11</td><td class="py-2.5 text-right text-blue-400 font-medium">0,82</td></tr>
              <tr class="border-t border-card-border"><td class="py-2.5 text-gray-500">4</td><td class="py-2.5 font-medium">HGRE11</td><td class="py-2.5 text-right text-blue-400 font-medium">0,83</td></tr>
              <tr class="border-t border-card-border"><td class="py-2.5 text-gray-500">5</td><td class="py-2.5 font-medium">XPML11</td><td class="py-2.5 text-right text-blue-400 font-medium">0,85</td></tr>
            </tbody>
          </table>
          <div class="mt-3 text-center">
            <a href="#" onclick="emBreve(event)" class="text-blue-500 text-xs font-medium hover:underline">Ver todos</a>
          </div>
        </div>

        <div id="panel-rank-valorizacao" class="hidden md:block bg-card border border-card-border rounded-xl p-4 md:p-5">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
            </svg>
            <h3 class="text-xs font-semibold text-gray-300 uppercase">Top 5 que Mais Valorizaram no Ano</h3>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-gray-500 text-xs">
                <th class="text-left pb-2 font-medium">#</th>
                <th class="text-left pb-2 font-medium">FII</th>
                <th class="text-right pb-2 font-medium">Var. Ano</th>
              </tr>
            </thead>
            <tbody class="text-gray-200">
${linhasRanking(rankings.topVarAno, "text-emerald-500")}
            </tbody>
          </table>
          <div class="mt-3 text-center">
            <a href="ranking-valorizacao.html" class="text-purple-500 text-xs font-medium hover:underline">Ver todos</a>
          </div>
        </div>

        <div id="panel-rank-consistentes" class="hidden md:block bg-card border border-card-border rounded-xl p-4 md:p-5">
          <div class="flex items-center gap-2 mb-4">
            <svg class="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <h3 class="text-xs font-semibold text-gray-300 uppercase">Top 5 Pagadores Consistentes</h3>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-gray-500 text-xs">
                <th class="text-left pb-2 font-medium">#</th>
                <th class="text-left pb-2 font-medium">FII</th>
                <th class="text-right pb-2 font-medium">\u00cdndice</th>
              </tr>
            </thead>
            <tbody class="text-gray-200">
${linhasRanking(rankings.topConsistentes, "text-orange-400")}
            </tbody>
          </table>
          <div class="mt-3 text-center">
            <a href="ranking-consistentes.html" class="text-orange-500 text-xs font-medium hover:underline">Ver todos</a>
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

    function showRankTab(tab) {
      var tabs = ['pagam','baratos','valorizacao','consistentes'];
      var colors = {'pagam':'emerald','baratos':'blue','valorizacao':'purple','consistentes':'orange'};
      tabs.forEach(function(t) {
        var panel = document.getElementById('panel-rank-'+t);
        var btn = document.getElementById('tab-rank-'+t);
        if (t === tab) {
          panel.classList.remove('hidden');
          btn.classList.add('text-'+colors[t]+'-500', 'border-b-2', 'border-'+colors[t]+'-500');
          btn.classList.remove('text-gray-500');
        } else {
          panel.classList.add('hidden');
          panel.classList.remove('md:block');
          btn.classList.remove('text-'+colors[t]+'-500', 'border-b-2', 'border-'+colors[t]+'-500');
          btn.classList.add('text-gray-500');
        }
      });
    }
  </script>

</body>
</html>`
}

module.exports = { gerarHtml }
