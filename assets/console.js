var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw5g5LIgPk0xtQ9mxolmrc1yZfMJggyHlkCNbzGRA6OcQABdthqqyLaGWzVFzRv-XOrYA/exec';
var CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTvxWt4f-DM6zyWLtpBvA_8CY48e09dGTtnBs65itOeg3LvOhKJW1JEpEkikHiArDJn501UHWx529j7/pub?output=csv';
var dados = [];
var periodoAtual = 'hoje';

function getBrowser(ua) {
  if(ua.includes('Edg')) return '<img src="https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/edge/edge.svg" style="width:20px;height:20px;max-width:none;display:inline" title="Edge">';
  if(ua.includes('Firefox')) return '<img src="https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/firefox/firefox.svg" style="width:20px;height:20px;max-width:none;display:inline" title="Firefox">';
  if(ua.includes('Chrome')) return '<img src="https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/chrome/chrome.svg" style="width:20px;height:20px;max-width:none;display:inline" title="Chrome">';
  if(ua.includes('Safari')) return '<img src="https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/safari/safari.svg" style="width:20px;height:20px;max-width:none;display:inline" title="Safari">';
  if(ua.includes('Opera')) return '<img src="https://cdn.jsdelivr.net/gh/alrra/browser-logos@main/src/opera/opera.svg" style="width:20px;height:20px;max-width:none;display:inline" title="Opera">';
  return '?';
}

function getOS(os, ua) {
  if(ua.includes('Windows')) return '<svg class="w-5 h-5 inline" viewBox="0 0 24 24" fill="#00adef"><title>Windows</title><path d="M0 3.5l9.9-1.4v9.5H0zm11.1-1.6L24 0v11.5H11.1zM0 12.6h9.9v9.5L0 20.7zm11.1-.1H24V24l-12.9-1.8z"/></svg>';
  if(ua.includes('Mac')||ua.includes('iPhone')||ua.includes('iPad')) return '<svg class="w-5 h-5 inline" viewBox="0 0 24 24" fill="#999"><title>Apple</title><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>';
  if(ua.includes('Linux')) return '<svg class="w-5 h-5 inline" viewBox="0 0 24 24" fill="#f5a623"><title>Linux</title><path d="M12.5 2C9.46 2 8 4.69 8 7.5c0 1.87.5 3.11.5 4.5 0 1.59-1.09 2.09-2.5 3.5-1.59 1.59-1.5 3.5-1.5 3.5s1.5-.5 3-1c1.5-.5 2.5-1 3.5-1s2 .5 3.5 1 3 1 3 1 .09-1.91-1.5-3.5c-1.41-1.41-2.5-1.91-2.5-3.5 0-1.39.5-2.63.5-4.5C14.5 4.69 15.54 2 12.5 2z"/></svg>';
  if(ua.includes('Android')) return '<svg class="w-5 h-5 inline" viewBox="0 0 24 24" fill="#3ddc84"><title>Android</title><path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 1.23 12.95 1 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 3.26 6 5.01 6 7h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/></svg>';
  return '?';
}

function getIdioma(lang) {
  if(!lang) return '';
  var code = 'br';
  if(lang.startsWith('pt')) code = 'br';
  else if(lang.startsWith('en')) code = 'us';
  else if(lang.startsWith('es')) code = 'es';
  else if(lang.startsWith('fr')) code = 'fr';
  else if(lang.startsWith('de')) code = 'de';
  return '<img src="https://hatscripts.github.io/circle-flags/flags/'+code+'.svg" style="width:20px;height:20px;max-width:none;display:inline" title="'+lang+'">';
}

function getPais(pais) {
  if(!pais||pais.trim()==='-'||pais.trim()==='') return '-';
  var p=pais.trim();
  var codes={'Brazil':'br','Brasil':'br','United States':'us','EUA':'us','Portugal':'pt','Argentina':'ar','Germany':'de','Alemanha':'de','France':'fr','Spain':'es','Espanha':'es','United Kingdom':'gb','UK':'gb','Japan':'jp','China':'cn','Italy':'it','Mexico':'mx','Colombia':'co','Chile':'cl','Canada':'ca','Australia':'au'};
  var code=codes[p]||p.substring(0,2).toLowerCase();
  return '<img src="https://hatscripts.github.io/circle-flags/flags/'+code+'.svg" style="width:20px;height:20px;max-width:none;display:inline" title="'+p+'">';
}

function truncarIP(ip) {
  if(!ip) return '-';
  if(ip.length > 20) return ip.substring(0,16)+'…';
  return ip;
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
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && csv[i+1] === '\n') i++;
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

function renderizar(lista) {
  document.getElementById('tabela-body').innerHTML = lista.map(function(d) {
    var nav = getBrowser(d.navegador);
    var os = getOS(d.os, d.navegador);
    var disp = d.dispositivo && d.dispositivo.trim()==='Mobile' ? '<span title="Mobile">&#128241;</span>' : '<span title="Desktop">&#128187;</span>';
    return '<tr class="border-t border-card-border hover:bg-card-border/30">' +
      '<td class="py-2.5 pr-6 whitespace-nowrap">' + (d.data||'-') + '</td>' +
      '<td class="py-2.5 pr-6 font-mono text-gray-400 whitespace-nowrap" title="'+(d.ip||'')+'">' + truncarIP(d.ip) + '</td>' +
      '<td class="py-2.5 px-4 text-center">' + nav + '</td>' +
      '<td class="py-2.5 px-4 text-center">' + disp + '</td>' +
      '<td class="py-2.5 px-4 text-center">' + os + '</td>' +
      '<td class="py-2.5 px-4 text-center text-gray-400">' + (d.resolucao||'-') + '</td>' +
      '<td class="py-2.5 px-4 text-center">' + getPais(d.pais) + '</td>' +
      '<td class="py-2.5 pr-6">' + (d.cidade||'-') + '</td>' +
      '<td class="py-2.5 text-gray-400">' + (d.pagina||'-') + '</td>' +
      '</tr>';
  }).join('');
}

function isBot(d) {
  if(d.resolucao && d.resolucao.trim() === '800x600') return true;
  if(d.navegador && (d.navegador.includes('bot') || d.navegador.includes('Bot') || d.navegador.includes('crawler') || d.navegador.includes('spider'))) return true;
  if(d.cidade && (d.cidade.includes('Boardman') || d.cidade.includes('Ashburn') || d.cidade.includes('Dublin'))) return true;
  return false;
}

function setPeriodo(p) {
  periodoAtual = p;
  document.querySelectorAll('[data-periodo]').forEach(function(btn) {
    if (btn.getAttribute('data-periodo') === p) {
      btn.className = 'px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-500 bg-emerald-500/20 text-emerald-400';
    } else {
      btn.className = 'px-3 py-1.5 text-xs font-medium rounded-lg border border-card-border text-gray-400 hover:text-white';
    }
  });
  aplicarFiltros();
}

function filtrarPorPeriodo(lista) {
  var agora = new Date();
  var hoje = agora.toLocaleDateString('pt-BR');
  var inicioSemana = new Date(agora);
  inicioSemana.setDate(agora.getDate() - agora.getDay());
  inicioSemana.setHours(0,0,0,0);

  return lista.filter(function(d) {
    if (!d.data) return false;
    if (periodoAtual === 'hoje') {
      return d.data.includes(hoje);
    } else if (periodoAtual === 'semana') {
      var partes = d.data.split(',')[0].trim().split('/');
      if (partes.length < 3) return false;
      var dataReg = new Date(partes[2], partes[1]-1, partes[0]);
      return dataReg >= inicioSemana && !d.data.includes(hoje);
    } else {
      var partes2 = d.data.split(',')[0].trim().split('/');
      if (partes2.length < 3) return false;
      var dataReg2 = new Date(partes2[2], partes2[1]-1, partes2[0]);
      return dataReg2 < inicioSemana;
    }
  });
}

function aplicarFiltros() {
  var filtrados = filtrarPorPeriodo(dados);
  if(document.getElementById('filtro-bots').checked) {
    filtrados = filtrados.filter(function(d){ return !isBot(d); });
  }
  var t = document.getElementById('busca').value.toLowerCase();
  if(t) {
    filtrados = filtrados.filter(function(d){ return Object.values(d).join(' ').toLowerCase().includes(t); });
  }
  renderizar(filtrados);
  atualizarContadores(filtrados);
  renderGrafico(filtrados);
}

function atualizarContadores(lista) {
  document.getElementById('total').textContent = lista.length;
  var hoje = new Date().toLocaleDateString('pt-BR');
  document.getElementById('hoje').textContent = lista.filter(function(d){return d.data&&d.data.includes(hoje);}).length;
  document.getElementById('mobile').textContent = lista.filter(function(d){return d.dispositivo&&d.dispositivo.trim()==='Mobile';}).length;
  document.getElementById('desktop').textContent = lista.filter(function(d){return d.dispositivo&&d.dispositivo.trim()==='Desktop';}).length;
}

function filtrar() {
  aplicarFiltros();
}

function limparDados() {
  if(!confirm('Tem certeza que deseja limpar todos os dados?')) return;
  fetch(SCRIPT_URL+'?action=clear',{mode:'no-cors'}).then(function() {
    alert('Dados limpos! Recarregue a página.');
    location.reload();
  });
}

var graficoInstance = null;

function renderGrafico(lista) {
  var contagem = {};
  lista.forEach(function(d) {
    if(!d.data) return;
    var dia = d.data.split(',')[0].trim();
    contagem[dia] = (contagem[dia]||0) + 1;
  });
  var labels = Object.keys(contagem).reverse().slice(-14);
  var values = labels.map(function(l){return contagem[l];});

  if(graficoInstance) graficoInstance.destroy();
  var ctx = document.getElementById('grafico').getContext('2d');
  graficoInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Acessos',
        data: values,
        backgroundColor: '#10B981',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#6b7280' }, grid: { display: false } },
        y: { ticks: { color: '#6b7280' }, grid: { color: '#132743' } }
      }
    }
  });
}

// Carregar dados
fetch(CSV_URL).then(function(r){return r.text();}).then(function(csv) {
  var rows = parseCSV(csv);
  if(rows.length < 2) { document.getElementById('status').textContent = 'Sem dados'; return; }
  dados = rows.slice(1).map(function(c) {
    return {data:c[0]||'',ip:c[1]||'',navegador:c[2]||'',dispositivo:c[3]||'',os:c[4]||'',resolucao:c[5]||'',idioma:c[6]||'',referrer:c[7]||'',pagina:c[8]||'',pais:c[9]||'',cidade:c[10]||''};
  }).reverse();

  atualizarContadores(dados);
  aplicarFiltros();
  document.getElementById('status').textContent = 'Atualizado - ' + dados.length + ' registros';
}).catch(function(){ document.getElementById('status').textContent = 'Erro ao carregar'; });
