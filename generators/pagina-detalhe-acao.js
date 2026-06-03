const { headHtml, headerHtml, footerHtml } = require("./componentes")

function gerarPaginaDetalheAcao(acao, todasAcoes, rankings, historico) {
    const corVar = acao.varDia >= 0 ? 'text-emerald-500' : 'text-red-500'
    const setaVar = acao.varDia >= 0 ? '\u2191' : '\u2193'
    const varDiaFmt = (acao.varDia >= 0 ? '+' : '') + acao.varDia.toFixed(2).replace('.', ',') + '%'

    const corYtd = acao.varAno >= 0 ? 'text-emerald-500' : 'text-red-500'
    const ytdFmt = acao.varAno !== 0 ? (acao.varAno >= 0 ? '+' : '') + acao.varAno.toFixed(2).replace('.', ',') + '%' : '-'

    // Tops
    const tops = []
    const r = rankings || {}
    const posAll = (lista, ticker) => { const idx = (lista || []).findIndex(x => x.ticker === ticker); return idx >= 0 ? idx + 1 : -1 }
    const posAlta = posAll(r.topAltas, acao.ticker)
    const posQueda = posAll(r.topQuedas, acao.ticker)
    const posDY = posAll(r.allDY, acao.ticker)
    const posPL = posAll(r.allBaratos, acao.ticker)
    const posYTD = posAll(r.allVarAno, acao.ticker)
    const posCons = posAll(r.allConsistentes, acao.ticker)
    if (posAlta > 0) tops.push({ nome: posAlta <= 5 ? 'Top 5 Maiores Altas do Dia' : 'Maiores Altas do Dia', pos: posAlta, cor: posAlta <= 5 ? 'text-emerald-400' : 'text-gray-400', link: '../../acoes-altas/' })
    if (posQueda > 0) tops.push({ nome: posQueda <= 5 ? 'Top 5 Maiores Quedas do Dia' : 'Maiores Quedas do Dia', pos: posQueda, cor: posQueda <= 5 ? 'text-red-400' : 'text-gray-400', link: '../../acoes-quedas/' })
    if (posDY > 0) tops.push({ nome: posDY <= 5 ? 'Top 5 Que Mais Pagam' : 'Que Mais Pagam (DY)', pos: posDY, cor: posDY <= 5 ? 'text-emerald-400' : 'text-gray-400', link: '../../acoes-ranking-dy/' })
    if (posPL > 0) tops.push({ nome: posPL <= 5 ? 'Top 5 Mais Baratos' : 'Mais Baratos (P/L)', pos: posPL, cor: posPL <= 5 ? 'text-blue-400' : 'text-gray-400', link: '../../acoes-ranking-baratos/' })
    if (posYTD > 0) tops.push({ nome: posYTD <= 5 ? 'Top 5 Maior Valoriza\u00e7\u00e3o' : 'Maior Valoriza\u00e7\u00e3o (YTD)', pos: posYTD, cor: posYTD <= 5 ? 'text-purple-400' : 'text-gray-400', link: '../../acoes-ranking-valorizacao/' })
    if (posCons > 0) tops.push({ nome: posCons <= 5 ? 'Top 5 Mais Consistentes' : 'Mais Consistentes', pos: posCons, cor: posCons <= 5 ? 'text-orange-400' : 'text-gray-400', link: '../../acoes-ranking-consistentes/' })

    // Dividendos - todos com paginação
    const divs = (acao.dividendos || [])
    const POR_PAGINA = 5
    const linhasDividendos = divs.map((d, i) => `
            <tr class="border-t border-card-border div-row" data-page="${Math.floor(i / POR_PAGINA)}"${i >= POR_PAGINA ? ' style="display:none"' : ''}>
              <td class="py-2.5 text-xs text-gray-500">${d.tipo || ''}</td>
              <td class="py-2.5">${d.dataCom || ''}</td>
              <td class="py-2.5">${d.pagamento || ''}</td>
              <td class="py-2.5 text-right text-emerald-400 font-medium">R$ ${d.valor ? d.valor.toFixed(4).replace('.', ',') : '-'}</td>
            </tr>`).join('\n')
    const totalPaginas = Math.ceil(divs.length / POR_PAGINA)

    // Simulador anual baseado no DY
    const simularAnual = (valor) => {
        if (acao.preco <= 0 || acao.dy <= 0) return '-'
        return (valor * acao.dy / 100).toFixed(2).replace('.', ',')
    }

    return `${headHtml(acao.ticker + " \u2014 InvestPop", acao.ticker + " - " + (acao.nome || 'A\u00e7\u00e3o') + ". Cota\u00e7\u00e3o, dividendos e indicadores.", null, "/acoes/" + acao.ticker + "/")}

${headerHtml({basePath: '../../', paginaAcoes: true})}

  <main class="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">

    <div class="hidden md:flex items-center gap-2 text-xs text-gray-500 mb-4">
      <a href="../../acoes/" class="hover:text-white">A\u00e7\u00f5es</a>
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
        <span class="text-[10px] text-gray-500 uppercase">Consist\u00eancia <button onclick="document.getElementById('tooltip-consist-det').classList.toggle('hidden')" class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-700 text-[9px] text-gray-400 hover:text-white">i</button></span>
        <p class="text-lg font-bold text-orange-400 mt-1">${acao.mesesConsistentes > 0 ? acao.mesesConsistentes + ' anos' : '-'}</p>
        <div id="tooltip-consist-det" class="hidden mt-2 text-[11px] text-gray-400">Anos consecutivos em que a a\u00e7\u00e3o pagou dividendos, contando do ano atual para tr\u00e1s.</div>
      </div>
    </div>

${historico && historico.t && historico.t.length > 0 ? `
    <div class="bg-card border border-card-border rounded-xl p-4 md:p-5 mb-5">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-300 uppercase">Cota\u00e7\u00e3o</h2>
        <div class="flex gap-1">
          <button onclick="setChartPeriod('1m')" data-period="1m" class="chart-period-btn px-2 py-1 text-[10px] rounded border border-card-border text-gray-400 hover:text-white">1M</button>
          <button onclick="setChartPeriod('ytd')" data-period="ytd" class="chart-period-btn px-2 py-1 text-[10px] rounded border border-card-border text-gray-400 hover:text-white">YTD</button>
          <button onclick="setChartPeriod('1y')" data-period="1y" class="chart-period-btn px-2 py-1 text-[10px] rounded border border-card-border text-gray-400 hover:text-white">1A</button>
          <button onclick="setChartPeriod('5y')" data-period="5y" class="chart-period-btn px-2 py-1 text-[10px] rounded border border-emerald-500 bg-emerald-500/20 text-emerald-400">5A</button>
        </div>
      </div>
      <canvas id="chart-cotacao" height="200"></canvas>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
    <script>
    var chartData = ${JSON.stringify({t: historico.t, c: historico.c})};
    var chartInstance = null;
    function setChartPeriod(p) {
      var now = Math.floor(Date.now()/1000);
      var cutoff = 0;
      if (p==='1m') cutoff = now - 30*86400;
      else if (p==='ytd') { var jan1 = new Date(new Date().getFullYear(),0,1); cutoff = Math.floor(jan1.getTime()/1000); }
      else if (p==='1y') cutoff = now - 365*86400;
      else cutoff = 0;
      var t=[],c=[];
      for(var i=0;i<chartData.t.length;i++){if(chartData.t[i]>=cutoff&&chartData.c[i]!=null){t.push(chartData.t[i]);c.push(chartData.c[i]);}}
      renderChart(t,c);
      document.querySelectorAll('.chart-period-btn').forEach(function(b){b.className='chart-period-btn px-2 py-1 text-[10px] rounded border border-card-border text-gray-400 hover:text-white';});
      document.querySelector('[data-period="'+p+'"]').className='chart-period-btn px-2 py-1 text-[10px] rounded border border-emerald-500 bg-emerald-500/20 text-emerald-400';
    }
    function renderChart(t,c) {
      var labels = t.map(function(ts){var d=new Date(ts*1000);return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'2-digit'});});
      var cor = c.length>1&&c[c.length-1]>=c[0]?'#10b981':'#ef4444';
      if(chartInstance){chartInstance.destroy();}
      chartInstance = new Chart(document.getElementById('chart-cotacao'),{type:'line',data:{labels:labels,datasets:[{data:c,borderColor:cor,borderWidth:1.5,pointRadius:0,fill:{target:'origin',above:cor+'15',below:cor+'15'},tension:0.1}]},options:{responsive:true,plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false}},scales:{x:{display:true,ticks:{maxTicksLimit:6,font:{size:9},color:'#6b7280'}},y:{display:true,ticks:{font:{size:9},color:'#6b7280',callback:function(v){return'R$'+v.toFixed(0)}}}},interaction:{mode:'nearest',axis:'x',intersect:false}}});
    }
    setChartPeriod('5y');
    </script>` : ''}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
${acao.descricao ? `
      <div class="lg:col-span-2 bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">Sobre a Empresa</h2>
        <p class="text-sm text-gray-400 leading-relaxed">${acao.descricao}</p>
      </div>` : ''}

      <div class="bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">Rentabilidade</h2>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">No ano (YTD)</span>
            <span class="text-sm font-medium ${corYtd}">${ytdFmt}</span>
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
${totalPaginas > 1 ? `        <div class="flex items-center justify-center gap-3 mt-3">
          <button onclick="mudarPagina(-1)" id="pag-anterior" class="px-3 py-1 text-xs border border-card-border rounded-lg text-gray-400 hover:text-white disabled:opacity-30" disabled>Anterior</button>
          <span class="text-xs text-gray-500" id="pag-info">1 / ${totalPaginas}</span>
          <button onclick="mudarPagina(1)" id="pag-proximo" class="px-3 py-1 text-xs border border-card-border rounded-lg text-gray-400 hover:text-white"${totalPaginas <= 1 ? ' disabled' : ''}>Pr\u00f3ximo</button>
        </div>
        <script>
        var paginaAtual=0,totalPags=${totalPaginas};
        function mudarPagina(dir){paginaAtual+=dir;if(paginaAtual<0)paginaAtual=0;if(paginaAtual>=totalPags)paginaAtual=totalPags-1;document.querySelectorAll('.div-row').forEach(function(r){r.style.display=r.getAttribute('data-page')==String(paginaAtual)?'':'none';});document.getElementById('pag-info').textContent=(paginaAtual+1)+' / '+totalPags;document.getElementById('pag-anterior').disabled=paginaAtual===0;document.getElementById('pag-proximo').disabled=paginaAtual>=totalPags-1;}
        </script>` : ''}
      </div>` : `
      <div class="lg:col-span-3 bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">\u00daltimos Proventos</h2>
        <p class="text-sm text-gray-500 text-center py-4">Esta a\u00e7\u00e3o n\u00e3o possui hist\u00f3rico de dividendos</p>
      </div>`}

${acao.dy > 0 ? `
      <div class="lg:col-span-3 bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">Quanto vou receber por ano?</h2>
        <p class="text-xs text-gray-500 mb-3">Baseado nos proventos dos \u00faltimos 12 meses (a\u00e7\u00e3o a R$ ${acao.preco.toFixed(2).replace('.', ',')})</p>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 100</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simularAnual(100)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 500</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simularAnual(500)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 1.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simularAnual(1000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 5.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simularAnual(5000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 10.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simularAnual(10000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 50.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simularAnual(50000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 100.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simularAnual(100000)}</span></div>
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

${footerHtml(global.INVESTPOP_TESTE ? {teste:true, basePath:'../../', paginaAcoes:true, fiisBase:'../../fiis/', acoesBase:'../'} : {basePath:'../../', paginaAcoes:true, fiisBase:'../../fiis/', acoesBase:'../'})}

</body>
</html>`
}

module.exports = { gerarPaginaDetalheAcao }
