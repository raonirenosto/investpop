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

    return `${headHtml("InvestPop \u2014 Radar de FIIs em tempo real", "Acompanhe os Fundos Imobili\u00e1rios (FIIs) em tempo real. Veja IFIX, maiores altas e quedas do dia.")}

${headerHtml()}

  <main class="px-4 md:px-8 py-6 md:py-8">
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

${footerHtml()}

  <script>
    function showTab(tab) {
      const altas = document.getElementById('panel-altas');
      const quedas = document.getElementById('panel-quedas');
      const tabAltas = document.getElementById('tab-altas');
      const tabQuedas = document.getElementById('tab-quedas');
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

function gerarPaginaLista(titulo, lista, cor) {
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
${linhasTabela(lista, cor)}
        </tbody>
      </table>
    </div>
  </main>

${footerHtml()}

  <script>
    function filtrar() {
      const termo = document.getElementById('busca').value.toUpperCase();
      const linhas = document.querySelectorAll('#tabela-body tr');
      linhas.forEach(tr => {
        const ticker = tr.cells[1]?.textContent || '';
        tr.style.display = ticker.toUpperCase().includes(termo) ? '' : 'none';
      });
    }
  </script>

</body>
</html>`
}

function gerarConsole() {
    const { headHtml, headerHtml, footerHtml } = require("./componentes")
    return `${headHtml("InvestPop \u2014 Console", "Painel de acessos do InvestPop.")}

${headerHtml()}

  <main class="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto">
    <a href="index.html" class="text-sm text-gray-400 hover:text-white mb-4 inline-block">&larr; Voltar</a>
    <h1 class="text-lg md:text-xl font-bold mb-6">\ud83d\udcca Console de Acessos</h1>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div class="bg-card border border-card-border rounded-xl p-4 text-center">
        <p class="text-3xl mb-1">\ud83d\udc65</p>
        <p class="text-2xl font-bold" id="total">-</p>
        <span class="text-xs text-gray-500">Total Acessos</span>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-4 text-center">
        <p class="text-3xl mb-1">\ud83d\udcc5</p>
        <p class="text-2xl font-bold" id="hoje">-</p>
        <span class="text-xs text-gray-500">Hoje</span>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-4 text-center">
        <p class="text-3xl mb-1">\ud83d\udcf1</p>
        <p class="text-2xl font-bold" id="mobile">-</p>
        <span class="text-xs text-gray-500">Mobile</span>
      </div>
      <div class="bg-card border border-card-border rounded-xl p-4 text-center">
        <p class="text-3xl mb-1">\ud83d\udcbb</p>
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
      <button onclick="limparDados()" class="px-3 py-2 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/30">\ud83d\uddd1 Limpar</button>
    </div>

    <div class="bg-card border border-card-border rounded-xl p-4 overflow-x-auto">
      <table class="w-full text-xs table-fixed">
        <thead>
          <tr class="text-gray-500">
            <th class="text-left pb-2 font-medium w-[140px]">\ud83d\udcc6 Data</th>
            <th class="text-left pb-2 font-medium w-[120px]">\ud83c\udf10 IP</th>
            <th class="text-center pb-2 font-medium w-[40px]">\ud83e\udee3</th>
            <th class="text-center pb-2 font-medium w-[40px]">\ud83d\udcf1</th>
            <th class="text-center pb-2 font-medium w-[40px]">\ud83d\udda5</th>
            <th class="text-center pb-2 font-medium w-[80px]">\ud83d\udccf</th>
            <th class="text-center pb-2 font-medium w-[40px]">\ud83c\udf0d</th>
            <th class="text-center pb-2 font-medium w-[40px]">\ud83c\udde7\ud83c\uddf7</th>
            <th class="text-left pb-2 font-medium w-[80px]">\ud83c\udfd9 Cidade</th>
            <th class="text-left pb-2 font-medium">\ud83d\udcc4 P\u00e1gina</th>
          </tr>
        </thead>
        <tbody id="tabela-body" class="text-gray-200"></tbody>
      </table>
    </div>
    <p class="text-xs text-gray-500 mt-3" id="status">Carregando...</p>
  </main>

${footerHtml()}

  <script>
    var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw5g5LIgPk0xtQ9mxolmrc1yZfMJggyHlkCNbzGRA6OcQABdthqqyLaGWzVFzRv-XOrYA/exec';
    var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvxWt4f-DM6zyWLtpBvA_8CY48e09dGTtnBs65itOeg3LvOhKJW1JEpEkikHiArDJn501UHWx529j7/pub?output=csv';
    var dados = [];

    function getBrowser(ua) {
      if(ua.includes('Edg')) return '<img src="https://cdn.jsdelivr.net/gh/nicedoc/browser-logos/edge/edge.svg" class="w-5 h-5 inline">';
      if(ua.includes('Firefox')) return '<img src="https://cdn.jsdelivr.net/gh/nicedoc/browser-logos/firefox/firefox.svg" class="w-5 h-5 inline">';
      if(ua.includes('Chrome')) return '<img src="https://cdn.jsdelivr.net/gh/nicedoc/browser-logos/chrome/chrome.svg" class="w-5 h-5 inline">';
      if(ua.includes('Safari')) return '<img src="https://cdn.jsdelivr.net/gh/nicedoc/browser-logos/safari/safari.svg" class="w-5 h-5 inline">';
      if(ua.includes('Opera')) return '<img src="https://cdn.jsdelivr.net/gh/nicedoc/browser-logos/opera/opera.svg" class="w-5 h-5 inline">';
      return '?';
    }

    function getOS(os, ua) {
      if(ua.includes('Windows')) return '<svg class="w-5 h-5 inline" viewBox="0 0 24 24" fill="#00adef"><path d="M0 3.5l9.9-1.4v9.5H0zm11.1-1.6L24 0v11.5H11.1zM0 12.6h9.9v9.5L0 20.7zm11.1-.1H24V24l-12.9-1.8z"/></svg>';
      if(ua.includes('Mac')||ua.includes('iPhone')||ua.includes('iPad')) return '<svg class="w-5 h-5 inline" viewBox="0 0 24 24" fill="#999"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';
      if(ua.includes('Linux')) return '<svg class="w-5 h-5 inline" viewBox="0 0 24 24" fill="#f5a623"><path d="M12.5 2C9.46 2 8 4.69 8 7.5c0 1.87.5 3.11.5 4.5 0 1.59-1.09 2.09-2.5 3.5-1.59 1.59-1.5 3.5-1.5 3.5s1.5-.5 3-1c1.5-.5 2.5-1 3.5-1s2 .5 3.5 1 3 1 3 1 .09-1.91-1.5-3.5c-1.41-1.41-2.5-1.91-2.5-3.5 0-1.39.5-2.63.5-4.5C14.5 4.69 15.54 2 12.5 2z"/></svg>';
      if(ua.includes('Android')) return '<svg class="w-5 h-5 inline" viewBox="0 0 24 24" fill="#3ddc84"><path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/></svg>';
      return '?';
    }

    function getIdioma(lang) {
      if(!lang) return '';
      var code = lang.split('-')[1] || lang.split('-')[0];
      code = code.toLowerCase();
      if(lang.startsWith('pt')) code = 'br';
      if(lang.startsWith('en')) code = 'us';
      if(lang.startsWith('es')) code = 'es';
      return '<img src="https://hatscripts.github.io/circle-flags/flags/'+code+'.svg" class="w-5 h-5 inline">';
    }

    function parseCSV(csv) {
      var rows = [];
      var row = [];
      var field = '';
      var inQuotes = false;
      for (var i = 0; i < csv.length; i++) {
        var c = csv[i];
        if (inQuotes) {
          if (c === '"' && csv[i+1] === '"') { field += '"'; i++; }
          else if (c === '"') { inQuotes = false; }
          else { field += c; }
        } else {
          if (c === '"') { inQuotes = true; }
          else if (c === ',') { row.push(field); field = ''; }
          else if (c === String.fromCharCode(10) || c === String.fromCharCode(13)) {
            if (c === String.fromCharCode(13) && csv[i+1] === String.fromCharCode(10)) i++;
            row.push(field); field = '';
            if (row.length > 1 || row[0] !== '') rows.push(row);
            row = [];
          } else { field += c; }
        }
      }
      row.push(field);
      if (row.length > 1 || row[0] !== '') rows.push(row);
      return rows;
    }

    fetch(CSV_URL).then(function(r){return r.text();}).then(function(csv){
      var rows = parseCSV(csv);
      if(rows.length<2){document.getElementById('status').textContent='Sem dados';return;}
      dados = rows.slice(1).map(function(c){
        return {data:c[0]||'',ip:c[1]||'',navegador:c[2]||'',dispositivo:c[3]||'',os:c[4]||'',resolucao:c[5]||'',idioma:c[6]||'',referrer:c[7]||'',pagina:c[8]||'',pais:c[9]||'',cidade:c[10]||''};
      }).reverse();

      document.getElementById('total').textContent=dados.length;
      var hoje=new Date().toLocaleDateString('pt-BR');
      document.getElementById('hoje').textContent=dados.filter(function(d){return d.data&&d.data.includes(hoje);}).length;
      document.getElementById('mobile').textContent=dados.filter(function(d){return d.dispositivo&&d.dispositivo.trim()==='Mobile';}).length;
      document.getElementById('desktop').textContent=dados.filter(function(d){return d.dispositivo&&d.dispositivo.trim()==='Desktop';}).length;

      renderizar(dados);
      document.getElementById('status').textContent='\u2705 Atualizado - ' + dados.length + ' registros';
    }).catch(function(){document.getElementById('status').textContent='\u274c Erro ao carregar';});

    function getPais(pais) {
      if(!pais||pais.trim()==='-'||pais.trim()==='') return '-';
      var p=pais.trim();
      var codes={'Brazil':'br','Brasil':'br','United States':'us','EUA':'us','Portugal':'pt','Argentina':'ar','Germany':'de','Alemanha':'de','France':'fr','Spain':'es','Espanha':'es','United Kingdom':'gb','UK':'gb','Japan':'jp','China':'cn','Italy':'it','Mexico':'mx','Colombia':'co','Chile':'cl','Canada':'ca','Australia':'au'};
      var code=codes[p]||p.substring(0,2).toLowerCase();
      return '<img src="https://hatscripts.github.io/circle-flags/flags/'+code+'.svg" class="w-5 h-5 inline">';
    }

    function renderizar(lista){
      document.getElementById('tabela-body').innerHTML=lista.map(function(d){
        var nav = getBrowser(d.navegador);
        var os = getOS(d.os, d.navegador);
        var idioma = getIdioma(d.idioma);
        var disp = d.dispositivo&&d.dispositivo.trim()==='Mobile' ? '\ud83d\udcf1' : '\ud83d\udcbb';
        return '<tr class="border-t border-card-border hover:bg-card-border/30">'+
          '<td class="py-2.5 whitespace-nowrap">'+(d.data||'-')+'</td>'+
          '<td class="py-2.5 font-mono text-gray-400">'+(d.ip||'-')+'</td>'+
          '<td class="py-2.5 text-center">'+nav+'</td>'+
          '<td class="py-2.5 text-center">'+disp+'</td>'+
          '<td class="py-2.5 text-center">'+os+'</td>'+
          '<td class="py-2.5 text-center text-gray-400">'+(d.resolucao||'-')+'</td>'+
          '<td class="py-2.5 text-center">'+idioma+'</td>'+
          '<td class="py-2.5 text-center">'+getPais(d.pais)+'</td>'+
          '<td class="py-2.5">'+(d.cidade||'-')+'</td>'+
          '<td class="py-2.5 text-gray-400">'+(d.pagina||'-')+'</td>'+
          '</tr>';
      }).join('');
    }

    function filtrar(){
      var t=document.getElementById('busca').value.toLowerCase();
      renderizar(dados.filter(function(d){return Object.values(d).join(' ').toLowerCase().includes(t);}));
    }

    function limparDados(){
      if(!confirm('Tem certeza que deseja limpar todos os dados?')) return;
      fetch(SCRIPT_URL+'?action=clear',{mode:'no-cors'}).then(function(){
        alert('Dados limpos! Recarregue a p\u00e1gina.');
        location.reload();
      });
    }
  </script>

</body>
</html>`
}

module.exports = { gerarHtml, gerarPaginaLista, gerarConsole }
