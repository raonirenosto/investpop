const { headHtml, headerHtml, footerHtml } = require("./componentes")

function linhasTabela(lista, cor) {
    return lista.map((item, i) => `
              <tr class="border-t border-card-border">
                <td class="py-2.5 text-gray-500">${i + 1}</td>
                <td class="py-2.5 font-medium"><a href="fiis/${item.ticker}.html" class="hover:underline">${item.ticker}</a></td>
                <td class="py-2.5 text-right ${cor} font-medium">${item.variacao}</td>
                <td class="py-2.5 text-right text-gray-400">R$ ${item.preco}</td>
              </tr>`).join("\n")
}

function linhasRanking(lista, cor) {
    return lista.map((item, i) => `
              <tr class="border-t border-card-border"><td class="py-2.5 text-gray-500">${i + 1}</td><td class="py-2.5 font-medium"><a href="fiis/${item.ticker}.html" class="hover:underline">${item.ticker}</a></td><td class="py-2.5 text-right ${cor} font-medium">${item.valor}</td></tr>`).join("\n")
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
        <p class="text-lg md:text-2xl lg:text-3xl font-bold mt-1"><a href="fiis/${maiorAlta.ticker}.html" class="hover:underline">${maiorAlta.ticker}</a></p>
        <span class="text-xs md:text-sm text-emerald-500 font-medium">${maiorAlta.variacao}</span>
        <div class="hidden md:block mt-1 text-xs text-gray-400">R$ ${maiorAlta.preco}</div>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-5">
        <span class="text-[10px] md:text-xs text-gray-500 uppercase font-medium">Maior Baixa</span>
        <p class="text-lg md:text-2xl lg:text-3xl font-bold mt-1"><a href="fiis/${maiorBaixa.ticker}.html" class="hover:underline">${maiorBaixa.ticker}</a></p>
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

      <div class="flex md:hidden gap-3 mb-4 border-b border-card-border flex-wrap">
        <button id="tab-rank-pagam" class="pb-2 text-sm font-medium text-emerald-500 border-b-2 border-emerald-500 " onclick="showRankTab('pagam')">Mais Pagam</button>
        <button id="tab-rank-baratos" class="pb-2 text-sm font-medium text-gray-500 " onclick="showRankTab('baratos')">Mais Baratos</button>
        <button id="tab-rank-valorizacao" class="pb-2 text-sm font-medium text-gray-500 " onclick="showRankTab('valorizacao')">Valoriza\u00e7\u00e3o</button>
        <button id="tab-rank-consistentes" class="pb-2 text-sm font-medium text-gray-500 " onclick="showRankTab('consistentes')">Consistentes</button>
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
                <th class="text-right pb-2 font-medium">DY (12M) <span class="tooltip-trigger" data-tooltip="tooltip-dy"><svg class="w-4 h-4 inline cursor-pointer" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#475569" stroke="#64748b" stroke-width="1.5"/><path d="M12 16v-4" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="8" r="1" fill="white"/></svg></span></th>
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
            <h3 class="text-xs font-semibold text-gray-300 uppercase">Top 5 Mais Baratos</h3>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="text-gray-500 text-xs">
                <th class="text-left pb-2 font-medium">#</th>
                <th class="text-left pb-2 font-medium">FII</th>
                <th class="text-right pb-2 font-medium">P/VP <span class="tooltip-trigger" data-tooltip="tooltip-pvp"><svg class="w-4 h-4 inline cursor-pointer" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#475569" stroke="#64748b" stroke-width="1.5"/><path d="M12 16v-4" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="8" r="1" fill="white"/></svg></span></th>
              </tr>
            </thead>
            <tbody class="text-gray-200">
${linhasRanking(rankings.topBaratos, "text-blue-400")}
            </tbody>
          </table>
          <div class="mt-3 text-center">
            <a href="ranking-baratos.html" class="text-blue-500 text-xs font-medium hover:underline">Ver todos</a>
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
                <th class="text-right pb-2 font-medium">Var. Ano <span class="tooltip-trigger" data-tooltip="tooltip-varano"><svg class="w-4 h-4 inline cursor-pointer" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#475569" stroke="#64748b" stroke-width="1.5"/><path d="M12 16v-4" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="8" r="1" fill="white"/></svg></span></th>
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
                <th class="text-right pb-2 font-medium">Consist\u00eancia <span class="tooltip-trigger" data-tooltip="tooltip-consistencia"><svg class="w-4 h-4 inline cursor-pointer" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#475569" stroke="#64748b" stroke-width="1.5"/><path d="M12 16v-4" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="8" r="1" fill="white"/></svg></span></th>
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

  <!-- Tooltips -->
  <div id="tooltip-dy" class="tooltip-box hidden">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">DY</span><span class="font-semibold text-sm text-gray-100">Dividend Yield</span></div>
      <button onclick="closeTooltip('tooltip-dy')" class="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button>
    </div>
    <p class="text-xs text-gray-400 mb-2">&Eacute; o retorno anual em dividendos em rela&ccedil;&atilde;o ao pre&ccedil;o atual da cota.</p>
    <p class="text-[10px] text-emerald-400 font-medium mb-1">Exemplo</p>
    <div class="flex items-center gap-3 bg-[#1a2332] rounded-lg p-2">
      <span class="text-[10px] text-gray-400">Se o FII paga R$ 1,00/ano<br>e a cota custa R$ 10,00</span>
      <span class="text-sm font-bold text-emerald-400">DY 10,00%</span>
    </div>
  </div>

  <div id="tooltip-pvp" class="tooltip-box hidden">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400">P/VP</span><span class="font-semibold text-sm text-gray-100">Pre&ccedil;o sobre Valor Patrimonial</span></div>
      <button onclick="closeTooltip('tooltip-pvp')" class="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button>
    </div>
    <p class="text-xs text-gray-400 mb-2">Mostra quanto o mercado paga em rela&ccedil;&atilde;o ao valor patrimonial do fundo.</p>
    <p class="text-[10px] text-emerald-400 font-medium mb-1">Como interpretar</p>
    <ul class="text-[11px] text-gray-400 space-y-0.5">
      <li>&bull; P/VP &lt; 1 &rarr; pode indicar desconto</li>
      <li>&bull; P/VP = 1 &rarr; pre&ccedil;o justo</li>
      <li>&bull; P/VP &gt; 1 &rarr; pode indicar pr&ecirc;mio</li>
    </ul>
  </div>

  <div id="tooltip-varano" class="tooltip-box hidden">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center"><svg class="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg></span><span class="font-semibold text-sm text-gray-100">Valoriza&ccedil;&atilde;o no Ano</span></div>
      <button onclick="closeTooltip('tooltip-varano')" class="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button>
    </div>
    <p class="text-xs text-gray-400 mb-2">Varia&ccedil;&atilde;o do pre&ccedil;o da cota desde o in&iacute;cio do ano (YTD).</p>
    <p class="text-[10px] text-emerald-400 font-medium mb-1">Como interpretar</p>
    <ul class="text-[11px] text-gray-400 space-y-0.5">
      <li>&bull; Positivo &rarr; cota valorizou no ano</li>
      <li>&bull; N&atilde;o inclui dividendos recebidos</li>
    </ul>
  </div>

  <div id="tooltip-consistencia" class="tooltip-box hidden">
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center"><svg class="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></span><span class="font-semibold text-sm text-gray-100">Consist&ecirc;ncia</span></div>
      <button onclick="closeTooltip('tooltip-consistencia')" class="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button>
    </div>
    <p class="text-xs text-gray-400 mb-2">Meses consecutivos sem redu&ccedil;&atilde;o no valor dos dividendos.</p>
    <p class="text-[10px] text-emerald-400 font-medium mb-1">Como interpretar</p>
    <ul class="text-[11px] text-gray-400 space-y-0.5">
      <li>&bull; Quanto maior, mais previs&iacute;vel o rendimento</li>
      <li>&bull; Tolera picos tempor&aacute;rios</li>
    </ul>
  </div>

  <style>
    .tooltip-box {
      position: fixed;
      z-index: 9999;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 14px 16px;
      width: 260px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    @media (max-width: 768px) {
      .tooltip-box {
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        border-radius: 16px 16px 0 0;
        padding: 20px;
      }
    }
  </style>

  <script>
    // Tooltip logic
    (function() {
      var activeTooltip = null;
      var triggers = document.querySelectorAll('.tooltip-trigger');
      triggers.forEach(function(trigger) {
        var tooltipId = trigger.getAttribute('data-tooltip');
        var tooltip = document.getElementById(tooltipId);
        // Desktop: hover
        trigger.addEventListener('mouseenter', function(e) {
          if (window.innerWidth < 768) return;
          showTooltipAt(tooltip, e.target);
        });
        trigger.addEventListener('mouseleave', function() {
          if (window.innerWidth < 768) return;
          hideTooltip(tooltip);
        });
        // Mobile: tap
        trigger.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (activeTooltip && activeTooltip !== tooltip) hideTooltip(activeTooltip);
          if (tooltip.classList.contains('hidden')) {
            if (window.innerWidth < 768) {
              tooltip.style.position = 'fixed';
              tooltip.style.left = '0';
              tooltip.style.right = '0';
              tooltip.style.bottom = '0';
              tooltip.style.top = '';
            } else {
              showTooltipAt(tooltip, e.target);
              return;
            }
            tooltip.classList.remove('hidden');
            activeTooltip = tooltip;
          } else {
            hideTooltip(tooltip);
          }
        });
      });

      function showTooltipAt(tooltip, target) {
        var rect = target.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.top = (rect.bottom + 8) + 'px';
        tooltip.style.left = Math.max(8, Math.min(rect.left - 100, window.innerWidth - 276)) + 'px';
        tooltip.style.bottom = '';
        tooltip.style.right = '';
        tooltip.classList.remove('hidden');
        activeTooltip = tooltip;
      }

      window.closeTooltip = function(id) {
        var el = document.getElementById(id);
        hideTooltip(el);
      };

      function hideTooltip(el) {
        if (el) { el.classList.add('hidden'); }
        if (activeTooltip === el) activeTooltip = null;
      }

      document.addEventListener('click', function(e) {
        if (activeTooltip && !activeTooltip.contains(e.target) && !e.target.closest('.tooltip-trigger')) {
          hideTooltip(activeTooltip);
        }
      });
    })();
  </script>

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
