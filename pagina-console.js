const { headHtml, headerHtml, footerHtml } = require("./componentes")

function gerarConsole() {
    return `${headHtml("InvestPop \u2014 Console", "Painel de acessos do InvestPop.")}
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

    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center bg-card border border-card-border rounded-lg px-3 py-2 gap-2 flex-1 mr-3">
        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" id="busca" placeholder="Filtrar por IP, dispositivo, idioma..." oninput="filtrar()" class="bg-transparent text-sm text-gray-300 outline-none w-full" />
      </div>
      <button onclick="limparDados()" class="px-3 py-2 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30">&#128465; Limpar</button>
    </div>

    <div class="bg-card border border-card-border rounded-xl p-4 overflow-x-auto">
      <table class="w-full text-xs table-fixed">
        <thead>
          <tr class="text-gray-500">
            <th class="text-left pb-2 font-medium w-[140px]">Data</th>
            <th class="text-left pb-2 font-medium w-[120px]">IP</th>
            <th class="text-center pb-2 font-medium w-[40px]" title="Navegador">Nav</th>
            <th class="text-center pb-2 font-medium w-[40px]" title="Dispositivo">Disp</th>
            <th class="text-center pb-2 font-medium w-[40px]" title="Sistema Operacional">OS</th>
            <th class="text-center pb-2 font-medium w-[80px]">Tela</th>
            <th class="text-center pb-2 font-medium w-[40px]" title="Idioma">Lng</th>
            <th class="text-center pb-2 font-medium w-[40px]" title="Pa\u00eds">Pa\u00eds</th>
            <th class="text-left pb-2 font-medium w-[80px]">Cidade</th>
            <th class="text-left pb-2 font-medium">P\u00e1gina</th>
          </tr>
        </thead>
        <tbody id="tabela-body" class="text-gray-200"></tbody>
      </table>
    </div>
    <p class="text-xs text-gray-500 mt-3" id="status">Carregando...</p>

    <div class="bg-card border border-card-border rounded-xl p-4 mt-6">
      <h2 class="text-sm font-semibold text-gray-300 mb-4">Acessos por dia (&#250;ltimos 14 dias)</h2>
      <canvas id="grafico" height="100"></canvas>
    </div>
  </main>

${footerHtml()}

  <script src="console.js"></script>

</body>
</html>`
}

module.exports = { gerarConsole }
