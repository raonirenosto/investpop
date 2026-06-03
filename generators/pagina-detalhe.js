const { headHtml, headerHtml, footerHtml } = require("./componentes")

function gerarPaginaDetalhe(fii, todosFiis, rankings, historico) {
    const corVar = fii.varDia >= 0 ? 'text-emerald-500' : 'text-red-500'
    const setaVar = fii.varDia >= 0 ? '↑' : '↓'
    const varDiaFmt = (fii.varDia >= 0 ? '+' : '') + fii.varDia.toFixed(2).replace('.', ',') + '%'
    const diffPreco = Math.abs(fii.preco * fii.varDia / (100 + fii.varDia)).toFixed(2).replace('.', ',')

    const corYtd = fii.varAno >= 0 ? 'text-emerald-500' : 'text-red-500'
    const ytdFmt = (fii.varAno >= 0 ? '+' : '') + fii.varAno.toFixed(2).replace('.', ',') + '%'

    // Verificar em quais tops o FII aparece
    const tops = []
    const r = rankings || {}
    const posAll = (lista, ticker) => { const idx = (lista || []).findIndex(x => x.ticker === ticker); return idx >= 0 ? idx + 1 : -1 }
    const posDY = posAll(r.allDY, fii.ticker)
    const posPVP = posAll(r.allBaratos, fii.ticker)
    const posYTD = posAll(r.allVarAno, fii.ticker)
    const posCons = posAll(r.allConsistentes, fii.ticker)
    const posAlta = posAll(r.topAltas, fii.ticker)
    const posQueda = posAll(r.topQuedas, fii.ticker)
    if (posAlta > 0) tops.push({ nome: posAlta <= 5 ? 'Top 5 Maiores Altas do Dia' : 'Maiores Altas do Dia', pos: posAlta, cor: posAlta <= 5 ? 'text-emerald-400' : 'text-gray-400', link: '../../altas/' })
    if (posQueda > 0) tops.push({ nome: posQueda <= 5 ? 'Top 5 Maiores Quedas do Dia' : 'Maiores Quedas do Dia', pos: posQueda, cor: posQueda <= 5 ? 'text-red-400' : 'text-gray-400', link: '../../quedas/' })
    if (posDY > 0) tops.push({ nome: posDY <= 5 ? 'Top 5 Que Mais Pagam' : 'Que Mais Pagam (DY)', pos: posDY, cor: posDY <= 5 ? 'text-emerald-400' : 'text-gray-400', link: '../../ranking-dy/' })
    if (posPVP > 0) tops.push({ nome: posPVP <= 5 ? 'Top 5 Mais Baratos' : 'Mais Baratos (P/VP)', pos: posPVP, cor: posPVP <= 5 ? 'text-blue-400' : 'text-gray-400', link: '../../ranking-baratos/' })
    if (posYTD > 0) tops.push({ nome: posYTD <= 5 ? 'Top 5 Maior Valoriza\u00e7\u00e3o' : 'Maior Valoriza\u00e7\u00e3o (YTD)', pos: posYTD, cor: posYTD <= 5 ? 'text-purple-400' : 'text-gray-400', link: '../../ranking-valorizacao/' })
    if (posCons > 0) tops.push({ nome: posCons <= 5 ? 'Top 5 Mais Consistentes' : 'Mais Consistentes', pos: posCons, cor: posCons <= 5 ? 'text-orange-400' : 'text-gray-400', link: '../../ranking-consistentes/' })

    const mediaMensal = fii.dividendos && fii.dividendos.length > 0
        ? fii.dividendos.slice(0, 12).reduce((s, d) => s + d.valor, 0) / Math.min(fii.dividendos.length, 12)
        : 0
    const mediaMensalFmt = mediaMensal.toFixed(2).replace('.', ',')
    const totalAnual = fii.dividendos ? fii.dividendos.slice(0, 12).reduce((s, d) => s + d.valor, 0) : 0
    const totalAnualFmt = totalAnual.toFixed(2).replace('.', ',')

    const simular = (valor) => {
        if (fii.preco <= 0 || mediaMensal <= 0) return '-'
        return ((valor / fii.preco) * mediaMensal).toFixed(2).replace('.', ',')
    }

    const allDivsFii = (fii.dividendos || [])
    const POR_PAGINA_FII = 5
    const totalPaginasFii = Math.ceil(allDivsFii.length / POR_PAGINA_FII)
    const linhasDividendos = allDivsFii.map((d, i) => `
            <tr class="border-t border-card-border div-row" data-page="${Math.floor(i / POR_PAGINA_FII)}"${i >= POR_PAGINA_FII ? ' style="display:none"' : ''}>
              <td class="py-2.5">${d.dataCom}</td>
              <td class="py-2.5">${d.pagamento}</td>
              <td class="py-2.5 text-right text-emerald-400 font-medium">R$ ${d.valor.toFixed(2).replace('.', ',')}</td>
            </tr>`).join('\n')

    // Lista de FIIs para busca (JSON inline)
    const listaBusca = todosFiis.map(f => f.ticker)

    return `${headHtml(fii.ticker + " \u2014 InvestPop", fii.ticker + " - " + (fii.nome || 'Fundo Imobili\u00e1rio') + ". Cota\u00e7\u00e3o, dividendos e indicadores.", null, "/fiis/" + fii.ticker + "/")}

${headerHtml({basePath: '../../'})}

  <main class="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">

    <div class="hidden md:flex items-center gap-2 text-xs text-gray-500 mb-4">
      <a href="../../" class="hover:text-white">In\u00edcio</a>
      <span>\u203a</span>
      <span>Fundos Imobili\u00e1rios</span>
      <span>\u203a</span>
      <span class="text-gray-300">${fii.ticker}</span>
    </div>

    <div class="flex items-center justify-between gap-3 mb-6">
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-xl md:text-3xl font-bold">${fii.ticker}</h1>
          <span class="text-xs md:text-sm text-gray-400">${fii.nome || ''}</span>
        </div>
      </div>
      <div class="text-right">
        <p class="text-xl md:text-3xl font-bold whitespace-nowrap">R$ ${fii.preco.toFixed(2).replace('.', ',')}</p>
        <div class="flex items-center gap-1 justify-end">
          <span class="text-xs md:text-sm ${corVar} font-medium">${varDiaFmt}</span>
          <span class="text-[10px] md:text-xs text-gray-500">(${setaVar} R$ ${diffPreco})</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-4">
        <span class="text-[10px] text-gray-500 uppercase">Dividend Yield (12M)</span>
        <p class="text-lg font-bold text-emerald-400 mt-1">${fii.dy.toFixed(2).replace('.', ',')}%</p>
        <span class="text-[10px] text-gray-500">\u00daltimos 12 meses</span>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-4">
        <span class="text-[10px] text-gray-500 uppercase">P/VP</span>
        <p class="text-lg font-bold mt-1">${fii.pvp ? fii.pvp.toFixed(2).replace('.', ',') : '-'}</p>
        <span class="text-[10px] text-gray-500">${fii.pvp && fii.preco ? 'Val. Patrim. R$ ' + (fii.preco / fii.pvp).toFixed(2).replace('.', ',') : ''}</span>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-4">
        <span class="text-[10px] text-gray-500 uppercase">Patrim\u00f4nio L\u00edquido</span>
        <p class="text-lg font-bold mt-1">${fii.patrimonio || '-'}</p>
        <span class="text-[10px] text-gray-500">${fii.cotas || ''}</span>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-3 md:p-4">
        <span class="text-[10px] text-gray-500 uppercase">Cotistas</span>
        <p class="text-lg font-bold mt-1">${fii.cotistas || '-'}</p>
        <span class="text-[10px] text-gray-500">${fii.taxaAdm ? 'Taxa Adm: ' + fii.taxaAdm : ''}</span>
      </div>
    </div>

${historico && historico.t && historico.t.length > 0 ? `
    <div class="bg-card border border-card-border rounded-xl p-4 md:p-5 mb-5">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-gray-300 uppercase">Cota\u00e7\u00e3o</h2>
        <div class="flex gap-1">
          <button onclick="setChartPeriod('1d')" data-period="1d" class="chart-period-btn px-2 py-1 text-[10px] rounded border border-emerald-500 bg-emerald-500/20 text-emerald-400">1D</button>
          <button onclick="setChartPeriod('1m')" data-period="1m" class="chart-period-btn px-2 py-1 text-[10px] rounded border border-card-border text-gray-400 hover:text-white">1M</button>
          <button onclick="setChartPeriod('ytd')" data-period="ytd" class="chart-period-btn px-2 py-1 text-[10px] rounded border border-card-border text-gray-400 hover:text-white">YTD</button>
          <button onclick="setChartPeriod('1y')" data-period="1y" class="chart-period-btn px-2 py-1 text-[10px] rounded border border-card-border text-gray-400 hover:text-white">1A</button>
          <button onclick="setChartPeriod('5y')" data-period="5y" class="chart-period-btn px-2 py-1 text-[10px] rounded border border-card-border text-gray-400 hover:text-white">5A</button>
        </div>
      </div>
      <canvas id="chart-cotacao" height="200"></canvas>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
    <script>
    var chartData = ${JSON.stringify({t: historico.t, c: historico.c})};
    var intradayData = ${historico.intra ? JSON.stringify({t: historico.intra.t, c: historico.intra.c}) : 'null'};
    var chartInstance = null;
    var crosshairPlugin = {id:'crosshair',afterDraw:function(chart){if(chart.tooltip&&chart.tooltip._active&&chart.tooltip._active.length){var x=chart.tooltip._active[0].element.x;var ctx=chart.ctx;var top=chart.scales.y.top;var bottom=chart.scales.y.bottom;ctx.save();ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.lineWidth=1;ctx.strokeStyle='rgba(107,114,128,0.5)';ctx.setLineDash([4,4]);ctx.stroke();ctx.restore();}}};
    Chart.register(crosshairPlugin);
    function setChartPeriod(p) {
      var now = Math.floor(Date.now()/1000);
      var t=[],c=[];
      if (p==='1d') { var src=intradayData||chartData;var lastT=src.t[src.t.length-1];var cutoff1d=lastT-86400;t=[];c=[];for(var i=0;i<src.t.length;i++){if(src.t[i]>=cutoff1d&&src.c[i]!=null){t.push(src.t[i]);c.push(src.c[i]);}} }
      else {
        var cutoff = 0;
        if (p==='1m') cutoff = now - 30*86400;
        else if (p==='ytd') { var jan1 = new Date(new Date().getFullYear(),0,1); cutoff = Math.floor(jan1.getTime()/1000); }
        else if (p==='1y') cutoff = now - 365*86400;
        for(var i=0;i<chartData.t.length;i++){if(chartData.t[i]>=cutoff&&chartData.c[i]!=null){t.push(chartData.t[i]);c.push(chartData.c[i]);}}
      }
      renderChart(t,c,p);
      document.querySelectorAll('.chart-period-btn').forEach(function(b){b.className='chart-period-btn px-2 py-1 text-[10px] rounded border border-card-border text-gray-400 hover:text-white';});
      document.querySelector('[data-period="'+p+'"]').className='chart-period-btn px-2 py-1 text-[10px] rounded border border-emerald-500 bg-emerald-500/20 text-emerald-400';
    }
    function renderChart(t,c,period) {
      var fmt = period==='1d' ? {hour:'2-digit',minute:'2-digit'} : {day:'2-digit',month:'short',year:'2-digit'};
      var labels = t.map(function(ts){return new Date(ts*1000).toLocaleDateString('pt-BR',fmt);});
      var cor = c.length>1&&c[c.length-1]>=c[0]?'#10b981':'#ef4444';
      if(chartInstance){chartInstance.destroy();}
      chartInstance = new Chart(document.getElementById('chart-cotacao'),{type:'line',data:{labels:labels,datasets:[{data:c,borderColor:cor,borderWidth:1.5,pointRadius:0,fill:{target:'origin',above:cor+'15',below:cor+'15'},tension:0.1}]},options:{responsive:true,plugins:{legend:{display:false},tooltip:{mode:'index',intersect:false,callbacks:{label:function(ctx){return'R$ '+ctx.parsed.y.toFixed(2)}}}},scales:{x:{display:true,ticks:{maxTicksLimit:6,font:{size:9},color:'#6b7280'}},y:{display:true,ticks:{font:{size:9},color:'#6b7280',callback:function(v){return'R$'+v.toFixed(0)}}}},interaction:{mode:'nearest',axis:'x',intersect:false}}});
    }
    setChartPeriod('1d');
    </script>` : ''}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

      <div class="lg:col-span-2 bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">Sobre o Fundo</h2>
        <p class="text-sm text-gray-400 leading-relaxed mb-4">${fii.descricao || 'Informa\u00e7\u00f5es n\u00e3o dispon\u00edveis.'}</p>
        <div class="grid grid-cols-2 gap-y-2 text-xs">
          ${fii.tipo ? '<div><span class="text-gray-500">Tipo</span></div><div class="text-gray-300">' + fii.tipo + '</div>' : ''}
          ${fii.segmento ? '<div><span class="text-gray-500">Segmento</span></div><div class="text-gray-300">' + fii.segmento + '</div>' : ''}
          ${fii.taxaAdm ? '<div><span class="text-gray-500">Taxa de Administra\u00e7\u00e3o</span></div><div class="text-gray-300">' + fii.taxaAdm + '</div>' : ''}
          ${fii.cnpj ? '<div><span class="text-gray-500">CNPJ</span></div><div class="text-gray-300">' + fii.cnpj + '</div>' : ''}
        </div>
      </div>

      <div class="bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">Rentabilidade</h2>
        <div class="space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">No ano (YTD)</span>
            <span class="text-sm font-medium ${corYtd}">${ytdFmt}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500">Consist\u00eancia</span>
            <span class="text-sm font-medium text-orange-400">${fii.mesesConsistentes} meses</span>
          </div>
        </div>
      </div>

      <div class="lg:col-span-3 bg-card border border-card-border rounded-xl p-4 md:p-5">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-300 uppercase">\u00daltimos Dividendos</h2>
          <span class="text-xs text-gray-500">M\u00e9dia: R$ ${mediaMensalFmt}/m\u00eas</span>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-gray-500 text-xs">
              <th class="text-left pb-2 font-medium">Data Com</th>
              <th class="text-left pb-2 font-medium">Pagamento</th>
              <th class="text-right pb-2 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody class="text-gray-200">
${linhasDividendos}
          </tbody>
        </table>
${totalPaginasFii > 1 ? `        <div class="flex items-center justify-center gap-3 mt-3">
          <button onclick="mudarPagina(-1)" id="pag-anterior" class="px-3 py-1 text-xs border border-card-border rounded-lg text-gray-400 hover:text-white disabled:opacity-30" disabled>Anterior</button>
          <span class="text-xs text-gray-500" id="pag-info">1 / ${totalPaginasFii}</span>
          <button onclick="mudarPagina(1)" id="pag-proximo" class="px-3 py-1 text-xs border border-card-border rounded-lg text-gray-400 hover:text-white">Pr\u00f3ximo</button>
        </div>
        <script>
        var paginaAtual=0,totalPags=${totalPaginasFii};
        function mudarPagina(dir){paginaAtual+=dir;if(paginaAtual<0)paginaAtual=0;if(paginaAtual>=totalPags)paginaAtual=totalPags-1;document.querySelectorAll('.div-row').forEach(function(r){r.style.display=r.getAttribute('data-page')==String(paginaAtual)?'':'none';});document.getElementById('pag-info').textContent=(paginaAtual+1)+' / '+totalPags;document.getElementById('pag-anterior').disabled=paginaAtual===0;document.getElementById('pag-proximo').disabled=paginaAtual>=totalPags-1;}
        </script>` : ''}
        <div class="mt-3 pt-3 border-t border-card-border text-xs text-gray-500">
          Total 12M: R$ ${totalAnualFmt} por cota \u2022 DY 12M: ${fii.dy.toFixed(2).replace('.', ',')}%
        </div>
      </div>

      <div class="lg:col-span-3 bg-card border border-card-border rounded-xl p-4 md:p-5">
        <h2 class="text-sm font-semibold text-gray-300 uppercase mb-3">Quanto vou receber por m\u00eas?</h2>
        <p class="text-xs text-gray-500 mb-3">Baseado na m\u00e9dia mensal de R$ ${mediaMensalFmt}/cota (cota a R$ ${fii.preco.toFixed(2).replace('.', ',')})</p>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 100</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(100)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 500</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(500)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 1.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(1000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 5.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(5000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 10.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(10000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 50.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(50000)}</span></div>
          <div class="text-center py-2"><span class="text-xs text-gray-500 block">R$ 100.000</span><span class="text-sm font-bold text-emerald-400 mt-1 block">R$ ${simular(100000)}</span></div>
        </div>
      </div>
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

${footerHtml(global.INVESTPOP_TESTE ? {teste:true, basePath:'../../', fiisBase:'../', acoesBase:'../../acoes/'} : {basePath:'../../', fiisBase:'../', acoesBase:'../../acoes/'})}

</body>
</html>`
}

module.exports = { gerarPaginaDetalhe }
