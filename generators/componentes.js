function headHtml(titulo, descricao, jsonLd) {
    var ldScript = jsonLd ? `\n  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '';
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo}</title>
  <meta name="description" content="${descricao}" />
  <meta name="keywords" content="FIIs, fundos imobiliários, IFIX, investimentos, radar FIIs, cotação FIIs, maiores altas, maiores quedas" />
  <link rel="canonical" href="https://investpop.com.br" />
  <meta property="og:title" content="${titulo}" />
  <meta property="og:description" content="${descricao}" />
  <meta property="og:url" content="https://investpop.com.br" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://investpop.com.br/og-image.svg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${titulo}" />
  <meta name="twitter:description" content="${descricao}" />
  <meta name="twitter:image" content="https://investpop.com.br/og-image.svg" />
  <meta name="robots" content="index, follow" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23070F1F'/><path d='M6 22l8-8 4 4 8-8' stroke='%2310b981' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/><circle cx='26' cy='10' r='2.5' fill='%2310b981'/></svg>" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: { colors: { bg: '#07111F', card: '#0B1A2E', 'card-border': '#132743' } } }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', sans-serif; }
    #modal-breve { display: none; }
    #modal-breve.show { display: flex; }
  </style>${ldScript}
</head>
<body class="bg-bg min-h-screen text-white">`
}

function headerHtml(opts) {
    var base = (opts && opts.basePath) || ''
    var isAcoes = opts && opts.paginaAcoes
    var fiisClass = isAcoes ? 'text-gray-400 hover:text-white' : 'text-emerald-500 font-medium'
    var acoesClass = isAcoes ? 'text-emerald-500 font-medium' : 'text-gray-400 hover:text-white'
    var fiisNavClass = isAcoes ? 'text-gray-500' : 'text-emerald-500'
    var acoesNavClass = isAcoes ? 'text-emerald-500' : 'text-gray-500'
    return `
  <nav class="w-full border-b border-card-border px-4 py-3 md:px-8 md:py-4 flex items-center justify-between">
    <a href="${base}index.html" class="flex items-center gap-2">
      <svg class="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 17l6-6 4 4 8-8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
      <span class="text-xl font-bold">Invest<span class="text-emerald-500">Pop</span></span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm">
      <a href="${base}index.html" class="${fiisClass}">FIIs</a>
      <a href="${base}acoes.html" class="${acoesClass}">A\u00e7\u00f5es</a>
    </div>
    <div class="hidden md:flex items-center gap-3">
      <div class="flex items-center bg-card border border-card-border rounded-md px-3 py-1.5 gap-2">
        <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" placeholder="Buscar FII, ticker..." class="bg-transparent text-sm text-gray-300 outline-none w-40" />
      </div>
    </div>
    <div class="flex md:hidden items-center">
      <button class="text-gray-400 busca-mobile-trigger">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </button>
    </div>
  </nav>`
}

function footerHtml(opts) {
    var base = (opts && opts.basePath) || ''
    var isAcoes = opts && opts.paginaAcoes
    var fiisNavClass = isAcoes ? 'text-gray-500' : 'text-emerald-500'
    var acoesNavClass = isAcoes ? 'text-emerald-500' : 'text-gray-500'
    var fiisLista = []
    try { fiisLista = require('fs').readFileSync(require('path').resolve(__dirname, '../data/lista_fiis.txt'), 'utf-8').split(/[\r\n\s,]+/).map(l => l.trim().toUpperCase()).filter(l => l) } catch(e) {}
    var acoesLista = []
    try { acoesLista = require('fs').readFileSync(require('path').resolve(__dirname, '../data/lista_acoes.txt'), 'utf-8').split(/[\r\n\s,]+/).map(l => l.trim().toUpperCase()).filter(l => l) } catch(e) {}
    var buscaLista = fiisLista.concat(acoesLista)
    // Nomes para busca (gerado em runtime se disponível)
    var nomesMap = global.INVESTPOP_NOMES || {}

    var tracking = '';
    if (!opts || !opts.teste) {
        tracking = `
    // Tracking
    (function() {
      if(document.cookie.includes('ghost=true')) return;
      if(location.pathname.includes('console')) return;
      fetch('https://free.freeipapi.com/api/json').then(r=>r.json()).then(d=>{
        var params = new URLSearchParams({
          data: new Date().toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}),
          ip: d.ipAddress,
          navegador: navigator.userAgent,
          dispositivo: /Mobile|Android|iPhone/.test(navigator.userAgent)?'Mobile':'Desktop',
          os: navigator.platform,
          resolucao: screen.width+'x'+screen.height,
          idioma: navigator.language,
          referrer: document.referrer||'direto',
          pagina: location.pathname||'index',
          pais: d.countryName||'-',
          cidade: d.cityName||'-'
        });
        fetch('https://script.google.com/macros/s/AKfycbw5g5LIgPk0xtQ9mxolmrc1yZfMJggyHlkCNbzGRA6OcQABdthqqyLaGWzVFzRv-XOrYA/exec?'+params,{mode:'no-cors'});
      }).catch(function(){});
    })();`;
    }

    return `
  <footer class="flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-4 border-t border-card-border gap-2">
    <a href="${base}index.html" class="flex items-center gap-2">
      <svg class="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 17l6-6 4 4 8-8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
      </svg>
      <span class="text-sm font-bold">Invest<span class="text-emerald-500">Pop</span></span>
    </a>
    <span class="text-xs text-gray-500">&copy; 2026 InvestPop. Todos os direitos reservados.</span>
  </footer>

  <nav class="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-card-border px-4 py-2 flex items-center justify-around">
    <a href="${base}index.html" class="flex flex-col items-center gap-1 ${fiisNavClass}">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
      <span class="text-[10px] font-medium">FIIs</span>
    </a>
    <a href="${base}acoes.html" class="flex flex-col items-center gap-1 ${acoesNavClass}">
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
      <span class="text-[10px] font-medium">A\u00e7\u00f5es</span>
    </a>
  </nav>

  <div class="lg:hidden h-16"></div>

  <div id="modal-breve" class="fixed inset-0 z-50 items-center justify-center bg-black/60" onclick="fecharModal()">
    <div class="bg-card border border-card-border rounded-xl p-6 mx-4 max-w-sm text-center" onclick="event.stopPropagation()">
      <div class="text-3xl mb-3">\ud83d\udea7</div>
      <h3 class="text-lg font-bold mb-2">Em breve!</h3>
      <p class="text-sm text-gray-400">Essa funcionalidade ainda est\u00e1 em desenvolvimento.</p>
      <button onclick="fecharModal()" class="mt-4 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600">Entendi</button>
    </div>
  </div>

  <script>
    var FIIS_LISTA = ${JSON.stringify(buscaLista)};
    var ACOES_LISTA = ${JSON.stringify(acoesLista)};
    var NOMES_MAP = ${JSON.stringify(nomesMap)};
    var ACOES_BASE = '${base}acoes/';
    function emBreve(e) { e.preventDefault(); document.getElementById('modal-breve').classList.add('show'); }
    function fecharModal() { document.getElementById('modal-breve').classList.remove('show'); }
    window.addEventListener('pageshow', function(e) { if (e.persisted) fecharModal(); });
${tracking}
  </script>
  <script src="${base}busca.js"></script>`
}

module.exports = { headHtml, headerHtml, footerHtml }
