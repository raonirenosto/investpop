const { headHtml, headerHtml, footerHtml } = require("./componentes")

function gerarPaginaDetalhe(fii, todosFiis, rankings) {
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
    if (posAlta > 0) tops.push({ nome: posAlta <= 5 ? 'Top 5 Maiores Altas do Dia' : 'Maiores Altas do Dia', pos: posAlta, cor: posAlta <= 5 ? 'text-emerald-400' : 'text-gray-400', link: '../altas.html' })
    if (posQueda > 0) tops.push({ nome: posQueda <= 5 ? 'Top 5 Maiores Quedas do Dia' : 'Maiores Quedas do Dia', pos: posQueda, cor: posQueda <= 5 ? 'text-red-400' : 'text-gray-400', link: '../quedas.html' })
    if (posDY > 0) tops.push({ nome: posDY <= 5 ? 'Top 5 Que Mais Pagam' : 'Que Mais Pagam (DY)', pos: posDY, cor: posDY <= 5 ? 'text-emerald-400' : 'text-gray-400', link: '../ranking-dy.html' })
    if (posPVP > 0) tops.push({ nome: posPVP <= 5 ? 'Top 5 Mais Baratos' : 'Mais Baratos (P/VP)', pos: posPVP, cor: posPVP <= 5 ? 'text-blue-400' : 'text-gray-400', link: '../ranking-baratos.html' })
    if (posYTD > 0) tops.push({ nome: posYTD <= 5 ? 'Top 5 Maior Valoriza\u00e7\u00e3o' : 'Maior Valoriza\u00e7\u00e3o (YTD)', pos: posYTD, cor: posYTD <= 5 ? 'text-purple-400' : 'text-gray-400', link: '../ranking-valorizacao.html' })
    if (posCons > 0) tops.push({ nome: posCons <= 5 ? 'Top 5 Mais Consistentes' : 'Mais Consistentes', pos: posCons, cor: posCons <= 5 ? 'text-orange-400' : 'text-gray-400', link: '../ranking-consistentes.html' })

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

    const linhasDividendos = (fii.dividendos || []).slice(0, 5).map(d => `
            <tr class="border-t border-card-border">
              <td class="py-2.5">${d.dataCom}</td>
              <td class="py-2.5">${d.pagamento}</td>
              <td class="py-2.5 text-right text-emerald-400 font-medium">R$ ${d.valor.toFixed(2).replace('.', ',')}</td>
            </tr>`).join('\n')

    // Lista de FIIs para busca (JSON inline)
    const listaBusca = todosFiis.map(f => f.ticker)

    return `${headHtml(fii.ticker + " \u2014 InvestPop", fii.ticker + " - " + (fii.nome || 'Fundo Imobili\u00e1rio') + ". Cota\u00e7\u00e3o, dividendos e indicadores.")}

${headerHtml({basePath: '../'})}

  <main class="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">

    <div class="hidden md:flex items-center gap-2 text-xs text-gray-500 mb-4">
      <a href="../index.html" class="hover:text-white">In\u00edcio</a>
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

${footerHtml(global.INVESTPOP_TESTE ? {teste:true, basePath:'../'} : {basePath:'../'})}

  <script>
    var FIIS_BASE = '';
    var ACOES_BASE = '../acoes/';
  </script>
  <script src="../busca.js"></script>

</body>
</html>`
}

module.exports = { gerarPaginaDetalhe }
