const { headHtml, headerHtml, footerHtml } = require("./componentes")

function gerarPaginaLista(titulo, lista, cor) {
    const linhas = lista.map((item, i) => `
          <tr class="border-t border-card-border">
            <td class="py-2.5 text-gray-500">${i + 1}</td>
            <td class="py-2.5 font-medium"><a href="fiis/${item.ticker}.html" class="hover:underline">${item.ticker}</a></td>
            <td class="py-2.5 text-right ${cor} font-medium">${item.variacao}</td>
            <td class="py-2.5 text-right text-gray-400">R$ ${item.preco}</td>
          </tr>`).join("\n")

    return `${headHtml("InvestPop \u2014 " + titulo, titulo + " - FIIs atualizados a cada 10 minutos.")}

${headerHtml()}

  <main class="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
    <h1 class="text-lg md:text-xl font-bold mb-6">${titulo}</h1>

    <div class="mb-4">
      <div class="flex items-center bg-card border border-card-border rounded-lg px-3 py-2 gap-2">
        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" id="busca" placeholder="Filtrar por nome do FII..." oninput="filtrar()" class="bg-transparent text-sm text-gray-300 outline-none w-full" />
      </div>
    </div>

    <div class="bg-card border border-card-border rounded-xl p-4 md:p-5">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-500 text-xs">
            <th class="text-left pb-2 font-medium">#</th>
            <th class="text-left pb-2 font-medium">FII</th>
            <th class="text-right pb-2 font-medium">Var. Dia</th>
            <th class="text-right pb-2 font-medium">Pre\u00e7o</th>
          </tr>
        </thead>
        <tbody id="tabela-body" class="text-gray-200">
${linhas}
        </tbody>
      </table>
    </div>
  </main>

${footerHtml(global.INVESTPOP_TESTE ? {teste:true} : {})}

  <script>
    function filtrar() {
      var termo = document.getElementById('busca').value.toUpperCase();
      var linhas = document.querySelectorAll('#tabela-body tr');
      linhas.forEach(function(tr) {
        var ticker = tr.cells[1] ? tr.cells[1].textContent : '';
        tr.style.display = ticker.toUpperCase().includes(termo) ? '' : 'none';
      });
    }
  </script>

</body>
</html>`
}

function gerarPaginaRanking(titulo, coluna, lista, cor) {
    const tooltipIcon = '<span class="tooltip-trigger" data-tooltip="tooltip-col"><svg class="w-4 h-4 inline cursor-pointer" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="#475569" stroke="#64748b" stroke-width="1.5"/><path d="M12 16v-4" stroke="white" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="8" r="1" fill="white"/></svg></span>'

    const tooltips = {
        'DY (12M)': '<div id="tooltip-col" class="tooltip-box hidden"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] font-bold text-emerald-400">DY</span><span class="font-semibold text-sm text-gray-100">Dividend Yield</span></div><button onclick="closeTooltip()" class="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button></div><p class="text-xs text-gray-400 mb-2">&Eacute; o retorno anual em dividendos em rela&ccedil;&atilde;o ao pre&ccedil;o atual da cota.</p><p class="text-[10px] text-emerald-400 font-medium mb-1">Exemplo</p><div class="flex items-center gap-3 bg-[#1a2332] rounded-lg p-2"><span class="text-[10px] text-gray-400">Se o FII paga R$ 1,00/ano<br>e a cota custa R$ 10,00</span><span class="text-sm font-bold text-emerald-400">DY 10,00%</span></div></div>',
        'P/VP': '<div id="tooltip-col" class="tooltip-box hidden"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] font-bold text-purple-400">P/VP</span><span class="font-semibold text-sm text-gray-100">Pre&ccedil;o sobre Valor Patrimonial</span></div><button onclick="closeTooltip()" class="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button></div><p class="text-xs text-gray-400 mb-2">Mostra quanto o mercado paga em rela&ccedil;&atilde;o ao valor patrimonial do fundo.</p><p class="text-[10px] text-emerald-400 font-medium mb-1">Como interpretar</p><ul class="text-[11px] text-gray-400 space-y-0.5"><li>&bull; P/VP &lt; 1 &rarr; pode indicar desconto</li><li>&bull; P/VP = 1 &rarr; pre&ccedil;o justo</li><li>&bull; P/VP &gt; 1 &rarr; pode indicar pr&ecirc;mio</li></ul></div>',
        'Var. Ano': '<div id="tooltip-col" class="tooltip-box hidden"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center"><svg class="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg></span><span class="font-semibold text-sm text-gray-100">Valoriza&ccedil;&atilde;o no Ano</span></div><button onclick="closeTooltip()" class="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button></div><p class="text-xs text-gray-400 mb-2">Varia&ccedil;&atilde;o do pre&ccedil;o da cota desde o in&iacute;cio do ano (YTD).</p><p class="text-[10px] text-emerald-400 font-medium mb-1">Como interpretar</p><ul class="text-[11px] text-gray-400 space-y-0.5"><li>&bull; Positivo &rarr; cota valorizou no ano</li><li>&bull; N&atilde;o inclui dividendos recebidos</li></ul></div>',
        'Consist\u00eancia': '<div id="tooltip-col" class="tooltip-box hidden"><div class="flex items-center justify-between mb-2"><div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center"><svg class="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></span><span class="font-semibold text-sm text-gray-100">Consist&ecirc;ncia</span></div><button onclick="closeTooltip()" class="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button></div><p class="text-xs text-gray-400 mb-2">Meses consecutivos sem redu&ccedil;&atilde;o no valor dos dividendos.</p><p class="text-[10px] text-emerald-400 font-medium mb-1">Como interpretar</p><ul class="text-[11px] text-gray-400 space-y-0.5"><li>&bull; Quanto maior, mais previs&iacute;vel o rendimento</li><li>&bull; Tolera picos tempor&aacute;rios</li></ul></div>'
    }
    const tooltipHtml = tooltips[coluna] || ''

    const linhas = lista.map((item, i) => `
          <tr class="border-t border-card-border">
            <td class="py-2.5 text-gray-500">${i + 1}</td>
            <td class="py-2.5 font-medium"><a href="fiis/${item.ticker}.html" class="hover:underline">${item.ticker}</a></td>
            <td class="py-2.5 text-right ${cor} font-medium">${item.valor}</td>
          </tr>`).join("\n")

    return `${headHtml("InvestPop \u2014 " + titulo, titulo + " - Ranking de FIIs atualizado.")}

${headerHtml()}

  <main class="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
    <h1 class="text-lg md:text-xl font-bold mb-6">${titulo}</h1>

    <div class="mb-4">
      <div class="flex items-center bg-card border border-card-border rounded-lg px-3 py-2 gap-2">
        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" id="busca" placeholder="Filtrar por nome do FII..." oninput="filtrar()" class="bg-transparent text-sm text-gray-300 outline-none w-full" />
      </div>
    </div>

    <div class="bg-card border border-card-border rounded-xl p-4 md:p-5">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-gray-500 text-xs">
            <th class="text-left pb-2 font-medium">#</th>
            <th class="text-left pb-2 font-medium">FII</th>
            <th class="text-right pb-2 font-medium">${coluna} ${tooltipHtml ? tooltipIcon : ''}</th>
          </tr>
        </thead>
        <tbody id="tabela-body" class="text-gray-200">
${linhas}
        </tbody>
      </table>
    </div>
  </main>

${tooltipHtml}

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

${footerHtml(global.INVESTPOP_TESTE ? {teste:true} : {})}

  <script>
    function filtrar() {
      var termo = document.getElementById('busca').value.toUpperCase();
      var linhas = document.querySelectorAll('#tabela-body tr');
      linhas.forEach(function(tr) {
        var ticker = tr.cells[1] ? tr.cells[1].textContent : '';
        tr.style.display = ticker.toUpperCase().includes(termo) ? '' : 'none';
      });
    }
    (function() {
      var trigger = document.querySelector('.tooltip-trigger');
      var tooltip = document.getElementById('tooltip-col');
      if (!trigger || !tooltip) return;
      trigger.addEventListener('mouseenter', function(e) {
        if (window.innerWidth < 768) return;
        var rect = e.target.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.top = (rect.bottom + 8) + 'px';
        tooltip.style.left = Math.max(8, Math.min(rect.left - 100, window.innerWidth - 276)) + 'px';
        tooltip.style.bottom = '';
        tooltip.classList.remove('hidden');
      });
      trigger.addEventListener('mouseleave', function() {
        if (window.innerWidth < 768) return;
        tooltip.classList.add('hidden');
      });
      trigger.addEventListener('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        if (window.innerWidth < 768) {
          tooltip.style.position = 'fixed'; tooltip.style.left = '0'; tooltip.style.right = '0'; tooltip.style.bottom = '0'; tooltip.style.top = '';
        }
        tooltip.classList.toggle('hidden');
      });
      window.closeTooltip = function() { tooltip.classList.add('hidden'); };
      document.addEventListener('click', function(e) {
        if (!tooltip.contains(e.target) && !e.target.closest('.tooltip-trigger')) tooltip.classList.add('hidden');
      });
    })();
  </script>

</body>
</html>`
}

module.exports = { gerarPaginaLista, gerarPaginaRanking }
