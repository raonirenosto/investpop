const { headHtml, headerHtml, footerHtml } = require("./componentes")

function gerarPaginaLista(titulo, lista, cor) {
    const linhas = lista.map((item, i) => `
          <tr class="border-t border-card-border">
            <td class="py-2.5 text-gray-500">${i + 1}</td>
            <td class="py-2.5 font-medium">${item.ticker}</td>
            <td class="py-2.5 text-right ${cor} font-medium">${item.variacao}</td>
            <td class="py-2.5 text-right text-gray-400">R$ ${item.preco}</td>
          </tr>`).join("\n")

    return `${headHtml("InvestPop \u2014 " + titulo, titulo + " - FIIs atualizados a cada 10 minutos.")}

${headerHtml()}

  <main class="px-4 md:px-8 py-6 md:py-8 max-w-3xl mx-auto">
    <a href="index.html" class="text-sm text-gray-400 hover:text-white mb-4 inline-block">&larr; Voltar</a>
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

${footerHtml()}

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

module.exports = { gerarPaginaLista }
