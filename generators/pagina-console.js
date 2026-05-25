const { headHtml, headerHtml, footerHtml } = require("./componentes")

function gerarConsole() {
    return `${headHtml("InvestPop \u2014 Console", "Painel de acessos do InvestPop.")}
  <meta name="robots" content="noindex, nofollow" />
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

${headerHtml()}

  <main class="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
    <a href="index.html" class="text-sm text-gray-400 hover:text-white mb-4 inline-block">&larr; Voltar</a>
    <h1 class="text-lg md:text-xl font-bold mb-6">&#128202; Console de Acessos</h1>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="bg-card border border-card-border rounded-xl p-4 text-center">
        <p class="text-3xl mb-1">&#128101;</p>
        <p class="text-2xl font-bold" id="total">-</p>
        <span class="text-xs text-gray-500">Total Acessos</span>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-4 text-center">
        <p class="text-3xl mb-1">&#128197;</p>
        <p class="text-2xl font-bold" id="hoje">-</p>
        <span class="text-xs text-gray-500">Hoje</span>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-4 text-center">
        <p class="text-3xl mb-1">&#128241;</p>
        <p class="text-2xl font-bold" id="mobile">-</p>
        <span class="text-xs text-gray-500">Mobile</span>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-4 text-center">
        <p class="text-3xl mb-1">&#128187;</p>
        <p class="text-2xl font-bold" id="desktop">-</p>
        <span class="text-xs text-gray-500">Desktop</span>
      </div>
    </div>

    <div class="flex items-center gap-2 mb-4">
      <button data-periodo="hoje" onclick="setPeriodo('hoje')" class="px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-500 bg-emerald-500/20 text-emerald-400">Hoje</button>
      <button data-periodo="ontem" onclick="setPeriodo('ontem')" class="px-3 py-1.5 text-xs font-medium rounded-lg border border-card-border text-gray-400 hover:text-white">Ontem</button>
      <button data-periodo="antigo" onclick="setPeriodo('antigo')" class="px-3 py-1.5 text-xs font-medium rounded-lg border border-card-border text-gray-400 hover:text-white">Mais Antigo</button>
    </div>

    <div class="mb-4">
      <label class="text-xs text-gray-400 cursor-pointer flex items-center gap-2">
        <input type="checkbox" id="filtro-bots" onchange="aplicarFiltros()" class="rounded" checked />
        Filtrar bots
      </label>
    </div>

    <div class="bg-card border border-card-border rounded-xl p-4 overflow-x-auto">
      <table class="text-xs min-w-[800px] w-full" id="tabela-console" style="display:none">
        <thead>
          <tr class="text-gray-500">
            <th class="text-left pb-2 font-medium whitespace-nowrap pr-3">Data</th>
            <th class="text-left pb-2 font-medium whitespace-nowrap pr-3">IP</th>
            <th class="text-center pb-2 font-medium pr-2" title="Navegador">Nav</th>
            <th class="text-center pb-2 font-medium pr-2" title="Dispositivo">Disp</th>
            <th class="text-center pb-2 font-medium pr-2" title="Sistema Operacional">OS</th>
            <th class="text-center pb-2 font-medium whitespace-nowrap pr-3">Tela</th>
            <th class="text-center pb-2 font-medium pr-2" title="Pa\u00eds">Pa\u00eds</th>
            <th class="text-left pb-2 font-medium whitespace-nowrap pr-3">Cidade</th>
            <th class="text-left pb-2 font-medium">P\u00e1gina</th>
          </tr>
        </thead>
        <tbody id="tabela-body" class="text-gray-200"></tbody>
      </table>
      <p id="msg-vazio" class="text-sm text-gray-500 text-center py-8">Nenhum acesso registrado neste per\u00edodo</p>
    </div>
    <p class="text-xs text-gray-500 mt-3" id="status">Carregando...</p>

    <div class="bg-card border border-card-border rounded-xl p-4 mt-6">
      <h2 class="text-sm font-semibold text-gray-300 mb-4">Acessos por dia (\u00faltimos 14 dias)</h2>
      <canvas id="grafico" height="100"></canvas>
    </div>
  </main>

${footerHtml(global.INVESTPOP_TESTE ? {teste:true} : {})}

  <script src="console.js"></script>

</body>
</html>`
}

module.exports = { gerarConsole }
