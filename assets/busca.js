// Busca compartilhada - InvestPop
(function() {
  if (typeof FIIS_LISTA === 'undefined') return;

  var base = window.FIIS_BASE !== undefined ? window.FIIS_BASE : 'fiis/';
  var acoesBase = window.ACOES_BASE !== undefined ? window.ACOES_BASE : 'acoes/';
  var acoesList = window.ACOES_LISTA || [];
  var nomesMap = window.NOMES_MAP || {};

  function getLink(ticker) {
    if (acoesList.indexOf(ticker) >= 0) return acoesBase + ticker + '/';
    return base + ticker + '/';
  }

  function normalizar(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  }

  function buscar(termo) {
    var v = normalizar(termo);
    if (v.length < 2) return [];
    return FIIS_LISTA.filter(function(f) {
      if (f.includes(v)) return true;
      var nome = nomesMap[f];
      return nome && normalizar(nome).includes(v);
    }).slice(0, 8);
  }

  function renderItem(f) {
    var nome = nomesMap[f];
    if (!nome) return '<span class="font-bold">' + f + '</span>';
    return '<span class="font-bold">' + f + '</span> <span class="text-gray-500 font-normal text-xs truncate">' + nome + '</span>';
  }

  function fecharOverlay() {
    overlay.classList.add('hidden');
    mobInput.value = '';
    mobResults.innerHTML = '';
    // Move input back to body offscreen for next open
    mobInput.style.cssText = 'position:fixed;top:-9999px;left:0;opacity:0;pointer-events:none;';
    document.body.appendChild(mobInput);
  }

  // Desktop: attach to nav input
  var navInput = document.querySelector('nav input[type="text"]');
  if (navInput) {
    navInput.setAttribute('autocomplete', 'off');
    var container = navInput.parentElement;
    container.style.position = 'relative';
    var dropdown = document.createElement('div');
    dropdown.className = 'hidden absolute top-full mt-1 left-0 right-0 bg-[#0B1A2E] border border-[#132743] rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto';
    container.appendChild(dropdown);
    navInput.addEventListener('input', function() {
      var results = buscar(this.value);
      if (!results.length) { dropdown.classList.add('hidden'); return; }
      dropdown.innerHTML = results.map(function(f) { return '<a href="'+getLink(f)+'" class="flex items-center gap-2 px-3 py-2 hover:bg-[#132743] text-sm overflow-hidden">'+renderItem(f)+'</a>'; }).join('');
      dropdown.classList.remove('hidden');
    });
    document.addEventListener('click', function(e) { if (!container.contains(e.target)) dropdown.classList.add('hidden'); });
  }

  // Mobile: find search button (lupa) in any mobile nav area
  var searchBtn = null;
  document.querySelectorAll('button').forEach(function(b) {
    if (searchBtn) return;
    if (!b.querySelector('path[d*="M21 21l-6-6"]')) return;
    var parent = b.parentElement;
    if (parent && parent.className) {
      if (parent.className.indexOf('md:hidden') !== -1 || parent.className.indexOf('lg:hidden') !== -1) {
        searchBtn = b;
      }
    }
  });

  // Create mobile input ALWAYS in DOM (iOS Safari fix - input must never be display:none)
  var mobInput = document.createElement('input');
  mobInput.type = 'text';
  mobInput.id = 'busca-mob-input';
  mobInput.placeholder = 'Buscar ticker, empresa...';
  mobInput.autocomplete = 'off';
  mobInput.className = 'bg-transparent text-base text-gray-300 outline-none w-full';
  mobInput.style.cssText = 'position:fixed;top:-9999px;left:0;opacity:0;pointer-events:none;';
  document.body.appendChild(mobInput);

  // Create overlay (without the input - input lives outside)
  var overlay = document.createElement('div');
  overlay.id = 'busca-mobile-overlay';
  overlay.className = 'hidden fixed inset-0 z-50 bg-[#07111F]/95';
  overlay.innerHTML = '<div class="px-4 pt-4" id="busca-mob-content"><div class="flex items-center gap-3 mb-4"><div class="flex-1 flex items-center bg-[#0B1A2E] border border-[#132743] rounded-lg px-3 py-2.5 gap-2"><svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><span id="busca-mob-input-slot"></span></div><button id="busca-mob-cancel" class="text-gray-400 text-sm">Cancelar</button></div><div id="busca-mob-results"></div></div>';
  document.body.appendChild(overlay);

  var mobResults = document.getElementById('busca-mob-results');
  var mobContent = document.getElementById('busca-mob-content');
  var inputSlot = document.getElementById('busca-mob-input-slot');

  // Open overlay - iOS fix: focus() FIRST (input is in DOM), then show overlay and move input
  if (searchBtn) {
    searchBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      // Step 1: make input visible and focusable (still offscreen)
      mobInput.style.cssText = '';
      mobInput.className = 'bg-transparent text-base text-gray-300 outline-none w-full';
      // Step 2: focus the input (iOS opens keyboard because input is in DOM)
      mobInput.focus();
      // Step 3: show overlay and move input into slot
      overlay.classList.remove('hidden');
      inputSlot.appendChild(mobInput);
      // Step 4: re-focus after move (for non-iOS browsers that lose focus on DOM move)
      mobInput.focus();
    });
  }

  // Cancel button
  document.getElementById('busca-mob-cancel').addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    fecharOverlay();
  });

  // Tap outside content area closes overlay (#7)
  overlay.addEventListener('click', function(e) {
    if (!mobContent.contains(e.target)) {
      fecharOverlay();
    }
  });

  // Also close on touchstart outside for better mobile response
  overlay.addEventListener('touchstart', function(e) {
    if (!mobContent.contains(e.target)) {
      fecharOverlay();
    }
  });

  // Input handler
  mobInput.addEventListener('input', function() {
    var v = this.value;
    if (v.length < 2) { mobResults.innerHTML = ''; return; }
    var results = buscar(v).slice(0, 10);
    mobResults.innerHTML = results.map(function(f) { return '<a href="'+getLink(f)+'" class="flex items-center gap-2 px-3 py-3 mb-2 bg-[#0B1A2E] border border-[#132743] rounded-lg text-sm overflow-hidden">'+renderItem(f)+'</a>'; }).join('');
  });

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      fecharOverlay();
    }
  });

  // Close overlay on back navigation (bfcache/pageshow) - fix iOS Safari (#13)
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) {
      fecharOverlay();
    }
  });
})();
