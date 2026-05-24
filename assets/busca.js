// Busca compartilhada - InvestPop
(function() {
  if (typeof FIIS_LISTA === 'undefined') return;

  var base = window.FIIS_BASE !== undefined ? window.FIIS_BASE : 'fiis/';

  function fecharOverlay() {
    overlay.classList.add('hidden');
    mobInput.value = '';
    mobResults.innerHTML = '';
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
      var v = this.value.toUpperCase();
      if (v.length < 2) { dropdown.classList.add('hidden'); return; }
      var results = FIIS_LISTA.filter(function(f) { return f.includes(v); }).slice(0, 8);
      if (!results.length) { dropdown.classList.add('hidden'); return; }
      dropdown.innerHTML = results.map(function(f) { return '<a href="'+base+f+'.html" class="block px-3 py-2 hover:bg-[#132743] text-sm font-medium">'+f+'</a>'; }).join('');
      dropdown.classList.remove('hidden');
    });
    document.addEventListener('click', function(e) { if (!container.contains(e.target)) dropdown.classList.add('hidden'); });
  }

  // Mobile: find search button (lupa) in any mobile nav area
  var searchBtn = null;
  document.querySelectorAll('button').forEach(function(b) {
    if (searchBtn) return;
    if (!b.querySelector('path[d*="M21 21l-6-6"]')) return;
    // Accept if parent has md:hidden or if button is visible at mobile width
    var parent = b.parentElement;
    if (parent && parent.className) {
      if (parent.className.indexOf('md:hidden') !== -1 || parent.className.indexOf('lg:hidden') !== -1) {
        searchBtn = b;
      }
    }
  });

  // Create overlay
  var overlay = document.createElement('div');
  overlay.id = 'busca-mobile-overlay';
  overlay.className = 'hidden fixed inset-0 z-50 bg-[#07111F]/95';
  overlay.innerHTML = '<div class="px-4 pt-4" id="busca-mob-content"><div class="flex items-center gap-3 mb-4"><div class="flex-1 flex items-center bg-[#0B1A2E] border border-[#132743] rounded-lg px-3 py-2.5 gap-2"><svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg><input type="text" id="busca-mob-input" placeholder="Buscar FII, ticker..." autocomplete="off" class="bg-transparent text-sm text-gray-300 outline-none w-full"/></div><button id="busca-mob-cancel" class="text-gray-400 text-sm">Cancelar</button></div><div id="busca-mob-results"></div></div>';
  document.body.appendChild(overlay);

  var mobInput = document.getElementById('busca-mob-input');
  var mobResults = document.getElementById('busca-mob-results');
  var mobContent = document.getElementById('busca-mob-content');

  // Open overlay
  if (searchBtn) {
    searchBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      overlay.classList.remove('hidden');
      setTimeout(function() { mobInput.focus(); }, 150);
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
    var v = this.value.toUpperCase();
    if (v.length < 2) { mobResults.innerHTML = ''; return; }
    var results = FIIS_LISTA.filter(function(f) { return f.includes(v); }).slice(0, 10);
    mobResults.innerHTML = results.map(function(f) { return '<a href="'+base+f+'.html" class="block px-3 py-3 mb-2 bg-[#0B1A2E] border border-[#132743] rounded-lg text-sm font-medium">'+f+'</a>'; }).join('');
  });

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      fecharOverlay();
    }
  });
})();
