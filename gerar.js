const axios = require("axios")
const fs = require("fs")
const path = require("path")
const https = require("https")
const { gerarHtml } = require("./generators/pagina-index")
const { gerarPaginaLista, gerarPaginaRanking } = require("./generators/pagina-lista")
const { gerarPaginaDetalhe } = require("./generators/pagina-detalhe")
const { gerarHtmlAcoes } = require("./generators/pagina-index-acoes")
const { gerarPaginaListaAcoes, gerarPaginaRankingAcoes } = require("./generators/pagina-lista-acoes")
const { gerarPaginaDetalheAcao } = require("./generators/pagina-detalhe-acao")
const { gerarConsole } = require("./generators/pagina-console")
const { gerarPaginaAcessos } = require("./generators/pagina-acessos")
const { gerarPaginaIbovHistorico } = require("./generators/pagina-ibov-historico")

const agentSemSSL = new https.Agent({ rejectUnauthorized: false })
const CACHE_FILE = path.resolve(__dirname, "data/cache_fiis.csv")
const CACHE_FULL = path.resolve(__dirname, "data/cache_full.json")

// ===============================
// 📥 LER FIIs
// ===============================

function lerFiis() {
    if (!fs.existsSync("data/lista_fiis.txt")) {
        console.log("⚠️ Arquivo data/lista_fiis.txt não encontrado")
        return []
    }
    return fs.readFileSync("data/lista_fiis.txt", "utf-8")
        .split(/[\r\n\s,]+/)
        .map(l => l.trim().toUpperCase())
        .filter(l => l)
}

function lerAcoes() {
    const csvPath = path.resolve(__dirname, 'data/ibov_acoes.csv')
    if (!fs.existsSync(csvPath)) {
        console.log("⚠️ Arquivo data/ibov_acoes.csv não encontrado")
        return []
    }
    return fs.readFileSync(csvPath, 'utf-8').split('\n').slice(1).filter(l => l.trim()).map(l => l.split(',')[0].trim().toUpperCase())
}

async function sincronizarIBOV() {
    try {
        const r = await axios.get('https://sistemaswebb3-listados.b3.com.br/indexProxy/indexCall/GetPortfolioDay/eyJsYW5ndWFnZSI6InB0LWJyIiwicGFnZU51bWJlciI6MSwicGFnZVNpemUiOjEyMCwiaW5kZXgiOiJJQk9WIiwic2VnbWVudCI6IjEifQ==', {
            httpsAgent: agentSemSSL, headers: { "User-Agent": "Mozilla/5.0" }
        })
        const apiList = r.data.results.map(x => ({ cod: x.cod.trim().toUpperCase(), nome: x.asset.trim() }))

        // Ler CSV atual
        const csvPath = path.resolve(__dirname, 'data/ibov_acoes.csv')
        const csvAtual = fs.existsSync(csvPath) ? fs.readFileSync(csvPath, 'utf-8').split('\n').slice(1).filter(l => l.trim()).map(l => { const [c, ...r] = l.split(','); return { cod: c.trim().toUpperCase(), nome: r.join(',').trim() } }) : []
        const csvCods = csvAtual.map(x => x.cod)
        const apiCods = apiList.map(x => x.cod)

        const adicionadas = apiList.filter(x => !csvCods.includes(x.cod))
        const removidas = csvAtual.filter(x => !apiCods.includes(x.cod))

        if (adicionadas.length === 0 && removidas.length === 0) {
            console.log(`✅ IBOV sincronizado (${apiList.length} ações, sem mudanças)`)
            return
        }

        // Atualizar CSV principal
        let novoCSV = 'codigo,acao\n'
        for (const a of apiList) novoCSV += a.cod + ',' + a.nome + '\n'
        fs.writeFileSync(csvPath, novoCSV)

        // Registrar histórico
        const histPath = path.resolve(__dirname, 'data/ibov_historico.csv')
        const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        const data = agora.split(',')[0].trim()
        const horario = agora.split(',')[1] ? agora.split(',')[1].trim() : ''
        let hist = ''
        if (!fs.existsSync(histPath)) hist = 'data,horario,ticker,nome,tipo\n'
        for (const a of adicionadas) hist += `${data},${horario},${a.cod},${a.nome},ADICIONADA\n`
        for (const r of removidas) hist += `${data},${horario},${r.cod},${r.nome},REMOVIDA\n`
        fs.appendFileSync(histPath, hist)

        console.log(`🔄 IBOV atualizado: +${adicionadas.length} adicionadas, -${removidas.length} removidas`)
        if (adicionadas.length) console.log(`   Adicionadas: ${adicionadas.map(x => x.cod).join(', ')}`)
        if (removidas.length) console.log(`   Removidas: ${removidas.map(x => x.cod).join(', ')}`)
    } catch (e) {
        console.log(`⚠️ Erro ao sincronizar IBOV: ${e.message} (usando CSV local)`)
    }
}

function lerNomesAcoes() {
    const csvPath = path.resolve(__dirname, 'data/ibov_acoes.csv')
    const mapa = {}
    if (!fs.existsSync(csvPath)) return mapa
    const linhas = fs.readFileSync(csvPath, 'utf-8').split('\n').slice(1).filter(l => l.trim())
    for (const l of linhas) {
        const [codigo, ...resto] = l.split(',')
        if (codigo && resto.length) mapa[codigo.trim().toUpperCase()] = resto.join(',').trim()
    }
    return mapa
}

function lerDescricoesAcoes() {
    const csvPath = path.resolve(__dirname, 'data/descricoes_acoes.csv')
    const mapa = {}
    if (!fs.existsSync(csvPath)) return mapa
    const linhas = fs.readFileSync(csvPath, 'utf-8').split('\n').slice(1).filter(l => l.trim())
    for (const l of linhas) {
        const [codigo, ...resto] = l.split(',')
        if (codigo && resto.length) mapa[codigo.trim().toUpperCase()] = resto.join(',').trim()
    }
    return mapa
}

// ===============================
// 🌐 BUSCAR IFIX (Yahoo Finance)
// ===============================

async function buscarIfix() {
    try {
        const r = await axios.get("https://query1.finance.yahoo.com/v8/finance/chart/IFIX.SA?interval=1d&range=1d", {
            httpsAgent: agentSemSSL,
            headers: { "User-Agent": "Mozilla/5.0" }
        })
        const meta = r.data.chart.result[0].meta
        const preco = meta.regularMarketPrice
        const anterior = meta.chartPreviousClose
        const varNum = ((preco - anterior) / anterior) * 100

        const valor = preco.toFixed(2).replace(".", ",")
        const variacao = (varNum >= 0 ? "+" : "") + varNum.toFixed(2).replace(".", ",") + "%"

        console.log(`📊 IFIX: ${valor} | ${variacao}`)
        return { valor, variacao }
    } catch (e) {
        console.log(`❌ Erro ao buscar IFIX: ${e.message}`)
        return { valor: "-", variacao: "-" }
    }
}

// ===============================
// 🌐 BUSCAR FIIs (Yahoo Finance - batch)
// ===============================

async function buscarFiis(tickers) {
    const resultados = []
    const batchSize = 20

    for (let i = 0; i < tickers.length; i += batchSize) {
        const batch = tickers.slice(i, i + batchSize)
        const symbols = batch.map(t => t + '.SA').join(',')

        try {
            const r = await axios.get(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=1d&interval=1d`, {
                httpsAgent: agentSemSSL,
                headers: { "User-Agent": "Mozilla/5.0" }
            })

            for (const ticker of batch) {
                const dados = r.data[ticker + '.SA']
                if (dados && dados.close && dados.close.length > 0) {
                    const precoNum = dados.close[dados.close.length - 1]
                    const anterior = dados.chartPreviousClose
                    const varNum = anterior > 0 ? ((precoNum - anterior) / anterior) * 100 : 0

                    const preco = precoNum.toFixed(2).replace(".", ",")
                    const variacao = (varNum >= 0 ? "+" : "") + varNum.toFixed(2).replace(".", ",") + "%"

                    console.log(`✅ ${ticker}: R$ ${preco} | ${variacao}`)
                    resultados.push({ ticker, preco, variacao, varNum })
                } else {
                    console.log(`❌ ${ticker}: sem dados`)
                    resultados.push({ ticker, preco: "-", variacao: "0,00%", varNum: 0 })
                }
            }
        } catch (e) {
            console.log(`❌ Batch erro: ${e.message}`)
            for (const ticker of batch) {
                resultados.push({ ticker, preco: "-", variacao: "0,00%", varNum: 0 })
            }
        }

        if (i + batchSize < tickers.length) await new Promise(r => setTimeout(r, 500))
    }

    return resultados
}

// ===============================
// 💾 CACHE
// ===============================

function carregarCacheFull() {
    if (!fs.existsSync(CACHE_FULL)) return null
    try {
        const data = JSON.parse(fs.readFileSync(CACHE_FULL, "utf-8"))
        console.log(`💾 Cache full carregado (${data.fiis.length} FIIs, rankings, IFIX)`)
        return data
    } catch (e) { return null }
}

function salvarCacheFull(data) {
    fs.writeFileSync(CACHE_FULL, JSON.stringify(data))
    console.log(`💾 Cache full salvo`)
}

function carregarCache() {
    if (!fs.existsSync(CACHE_FILE)) return null
    const linhas = fs.readFileSync(CACHE_FILE, "utf-8").split(/\r?\n/).filter(l => l.trim())
    if (linhas.length < 2) return null
    const resultados = []
    for (let i = 1; i < linhas.length; i++) {
        const [ticker, preco, variacao, varNum] = linhas[i].split(";")
        if (ticker) resultados.push({ ticker, preco, variacao, varNum: parseFloat(varNum) })
    }
    console.log(`💾 Cache carregado: ${resultados.length} FIIs`)
    return resultados
}

function salvarCache(resultados) {
    let csv = "ticker;preco;variacao;varNum\n"
    for (const r of resultados) {
        csv += `${r.ticker};${r.preco};${r.variacao};${r.varNum}\n`
    }
    fs.writeFileSync(CACHE_FILE, csv)
    console.log(`💾 Cache salvo: ${resultados.length} FIIs`)
}

// ===============================
// 🏆 BUSCAR RANKINGS (Yahoo Finance - chart + dividendos)
// ===============================

function calcularMesesSemQuebra(rendimentos) {
    if (rendimentos.length < 3) return { meses: rendimentos.length, quebra: null }
    let meses = 1
    for (let i = 0; i < rendimentos.length - 2; i++) {
        const atual = rendimentos[i]
        const proximo = rendimentos[i + 1]
        const depois = rendimentos[i + 2]
        if (atual.valor >= proximo.valor) { meses++; continue }
        if (proximo.valor > atual.valor && depois.valor <= atual.valor) { meses++; continue }
        return { meses, quebra: proximo.dataCom || proximo.data }
    }
    return { meses: rendimentos.length, quebra: null }
}

async function buscarRankings(tickers) {
    const resultados = []
    const startTime = Date.now()

    // Buscar variação do dia e YTD via Yahoo Finance (batch, rápido)
    const varDiaBatch = {}
    const varAnoBatch = {}
    for (let i = 0; i < tickers.length; i += 20) {
        const batch = tickers.slice(i, i + 20)
        const symbols = batch.map(t => t + '.SA').join(',')
        try {
            const [rDia, rYtd] = await Promise.all([
                axios.get(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=1d&interval=1d`, { httpsAgent: agentSemSSL, headers: { "User-Agent": "Mozilla/5.0" } }),
                axios.get(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=ytd&interval=1mo`, { httpsAgent: agentSemSSL, headers: { "User-Agent": "Mozilla/5.0" } })
            ])
            for (const t of batch) {
                const dDia = rDia.data[t + '.SA']
                if (dDia && dDia.close && dDia.close.length > 0 && dDia.chartPreviousClose > 0) {
                    varDiaBatch[t] = ((dDia.close[dDia.close.length - 1] - dDia.chartPreviousClose) / dDia.chartPreviousClose) * 100
                }
                const dYtd = rYtd.data[t + '.SA']
                if (dYtd && dYtd.close && dYtd.close.length > 0 && dYtd.chartPreviousClose > 0) {
                    varAnoBatch[t] = ((dYtd.close[dYtd.close.length - 1] - dYtd.chartPreviousClose) / dYtd.chartPreviousClose) * 100
                }
            }
        } catch (e) {}
        if (i + 20 < tickers.length) await new Promise(r => setTimeout(r, 300))
    }
    console.log(`  Yahoo batch: ${Object.keys(varDiaBatch).length} preços, ${Object.keys(varAnoBatch).length} YTD (${Date.now() - startTime}ms)`)

    // Buscar DY, P/VP e consistência via Investidor 10 (1 ticker por vez, 2 chamadas paralelas)
    for (let i = 0; i < tickers.length; i++) {
        const t = tickers[i]
        try {
            const [rPrincipal, rDivs] = await Promise.all([
                axios.get(`https://investidor10.com.br/fiis/${t.toLowerCase()}/`, { httpsAgent: agentSemSSL, headers: { "User-Agent": "Mozilla/5.0" } }),
                axios.get(`https://investidor10.com.br/fiis/${t.toLowerCase()}/dividendos/`, { httpsAgent: agentSemSSL, headers: { "User-Agent": "Mozilla/5.0" } })
            ])

            // Extrair DY e P/VP
            const html = rPrincipal.data
            const dyMatch = html.match(/dividend\s*yield\s*de\s*(\d+[,.]\d+)\s*%/i)
            const pvpMatch = html.match(/P\/VP\s*de\s*(\d+[,.]\d+)/i)
            const dy = dyMatch ? parseFloat(dyMatch[1].replace(',', '.')) : 0
            const pvp = pvpMatch ? parseFloat(pvpMatch[1].replace(',', '.')) : null

            // Extrair dados extras para página de detalhe
            const articleMatch = html.match(/"articleBody":\s*"([^"]+)"/)
            const articleBody = articleMatch ? articleMatch[1] : ''
            const nomeMatch = articleBody.match(/O fundo ([^,]+),/i)
            const cnpjMatch = articleBody.match(/CNPJ\s*([\d.\/\-]+)/)
            const tipoMatch = articleBody.match(/tipo\s+([^e]+?)\s+e do segmento/i)
            const segMatch = articleBody.match(/segmento\s+([^.]+)/i)
            const cotasMatch = articleBody.match(/([\d.]+)\s*cotas/)
            const cotistasMatch = html.match(/(\d[\d.]+)\s*cotistas/i)
            const patrMatch = html.match(/patrim[\u00f4o]nio de R\$\s*([\d,]+)\s*(Bilh[\u00f5o]es|Milh[\u00f5o]es|bi|mi)/i)
            const taxaMatch = html.match(/taxa de administra[\s\S]{0,100}?([\d,]+\s*%)/i)

            // Extrair rendimentos com datas
            const rendimentos = []
            const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
            let trMatch
            while ((trMatch = trRegex.exec(rDivs.data)) !== null) {
                const tds = []
                const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
                let tdMatch
                while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
                    tds.push(tdMatch[1].replace(/<[^>]+>/g, '').trim())
                }
                if (tds.length >= 4 && tds[0].toLowerCase().includes('dividendo')) {
                    rendimentos.push({ dataCom: tds[1], pagamento: tds[2], valor: parseFloat(tds[3].replace(/\./g, '').replace(',', '.')) })
                }
            }

            const consistencia = calcularMesesSemQuebra(rendimentos)

            resultados.push({
                ticker: t,
                dy,
                pvp,
                varDia: varDiaBatch[t] || 0,
                varAno: varAnoBatch[t] || 0,
                mesesConsistentes: consistencia.meses,
                nome: nomeMatch ? nomeMatch[1].trim() : '',
                cnpj: cnpjMatch ? cnpjMatch[1] : '',
                tipo: tipoMatch ? tipoMatch[1].trim() : '',
                segmento: segMatch ? segMatch[1].trim() : '',
                cotas: cotasMatch ? cotasMatch[1] + ' cotas' : '',
                cotistas: cotistasMatch ? cotistasMatch[1] : '',
                patrimonio: patrMatch ? 'R$ ' + patrMatch[1] + ' ' + patrMatch[2].replace('Bilhões', 'bi').replace('Milhões', 'mi') : '',
                taxaAdm: taxaMatch ? taxaMatch[1] + ' a.a.' : '',
                descricao: articleBody.replace(/\s+/g, ' ').substring(0, 300),
                dividendos: rendimentos,
                preco: 0
            })

            if ((i + 1) % 10 === 0) console.log(`  Investidor 10: ${i + 1}/${tickers.length} (${Date.now() - startTime}ms)`)
        } catch (e) {
            resultados.push({ ticker: t, dy: 0, pvp: null, varDia: varDiaBatch[t] || 0, varAno: varAnoBatch[t] || 0, mesesConsistentes: 0, nome: '', cnpj: '', tipo: '', segmento: '', cotas: '', cotistas: '', patrimonio: '', taxaAdm: '', descricao: '', dividendos: [], preco: 0 })
        }
        if (i < tickers.length - 1) await new Promise(r => setTimeout(r, 500))
    }

    const allDY = resultados.filter(r => r.dy > 0).sort((a, b) => b.dy - a.dy)
        .map(r => ({ ticker: r.ticker, valor: r.dy.toFixed(2).replace('.', ',') + '%' }))
    const allBaratos = resultados.filter(r => r.pvp && r.pvp > 0).sort((a, b) => a.pvp - b.pvp)
        .map(r => ({ ticker: r.ticker, valor: r.pvp.toFixed(2).replace('.', ',') }))
    const allVarAno = resultados.filter(r => r.varAno > 0).sort((a, b) => b.varAno - a.varAno)
        .map(r => ({ ticker: r.ticker, valor: '+' + r.varAno.toFixed(2).replace('.', ',') + '%' }))
    const allConsistentes = resultados.sort((a, b) => b.mesesConsistentes - a.mesesConsistentes)
        .map(r => ({ ticker: r.ticker, valor: r.mesesConsistentes + ' meses' }))

    const topDY = allDY.slice(0, 5)
    const topBaratos = allBaratos.slice(0, 5)
    const topVarAno = allVarAno.slice(0, 5)
    const topConsistentes = allConsistentes.slice(0, 5)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`🏆 Rankings: DY(${allDY.length}) | Baratos(${allBaratos.length}) | Var.Ano(${allVarAno.length}) | Consistentes(${allConsistentes.length}) | Tempo: ${elapsed}s`)
    return { topDY, topBaratos, topVarAno, topConsistentes, allDY, allBaratos, allVarAno, allConsistentes, detalhes: resultados }
}


// ===============================
// 📊 BUSCAR IBOV (Yahoo Finance)
// ===============================

async function buscarIbov() {
    try {
        const r = await axios.get("https://query1.finance.yahoo.com/v8/finance/chart/%5EBVSP?interval=1d&range=1d", {
            httpsAgent: agentSemSSL,
            headers: { "User-Agent": "Mozilla/5.0" }
        })
        const meta = r.data.chart.result[0].meta
        const preco = meta.regularMarketPrice
        const anterior = meta.chartPreviousClose
        const varNum = ((preco - anterior) / anterior) * 100

        const valor = Math.round(preco).toLocaleString('pt-BR')
        const variacao = (varNum >= 0 ? "+" : "") + varNum.toFixed(2).replace(".", ",") + "%"

        console.log(`📊 IBOV: ${valor} | ${variacao}`)
        return { valor, variacao }
    } catch (e) {
        console.log(`❌ Erro ao buscar IBOV: ${e.message}`)
        return { valor: "-", variacao: "-" }
    }
}

// ===============================
// 📊 BUSCAR AÇÕES (Yahoo Finance - batch)
// ===============================

async function buscarAcoes(tickers) {
    const resultados = []
    const batchSize = 20

    for (let i = 0; i < tickers.length; i += batchSize) {
        const batch = tickers.slice(i, i + batchSize)
        const symbols = batch.map(t => t + '.SA').join(',')

        try {
            const r = await axios.get(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=1d&interval=1d`, {
                httpsAgent: agentSemSSL,
                headers: { "User-Agent": "Mozilla/5.0" }
            })

            for (const ticker of batch) {
                const dados = r.data[ticker + '.SA']
                if (dados && dados.close && dados.close.length > 0) {
                    const precoNum = dados.close[dados.close.length - 1]
                    const anterior = dados.chartPreviousClose
                    const varNum = anterior > 0 ? ((precoNum - anterior) / anterior) * 100 : 0

                    const preco = precoNum.toFixed(2).replace(".", ",")
                    const variacao = (varNum >= 0 ? "+" : "") + varNum.toFixed(2).replace(".", ",") + "%"

                    resultados.push({ ticker, preco, variacao, varNum })
                } else {
                    resultados.push({ ticker, preco: "-", variacao: "0,00%", varNum: 0 })
                }
            }
        } catch (e) {
            for (const ticker of batch) {
                resultados.push({ ticker, preco: "-", variacao: "0,00%", varNum: 0 })
            }
        }

        if (i + batchSize < tickers.length) await new Promise(r => setTimeout(r, 500))
    }

    return resultados
}

// ===============================
// 🏆 BUSCAR RANKINGS AÇÕES (Investidor 10)
// ===============================

async function buscarRankingsAcoes(tickers) {
    const resultados = []
    const startTime = Date.now()

    // Buscar variação YTD via Yahoo Finance (batch)
    const varAnoBatch = {}
    for (let i = 0; i < tickers.length; i += 20) {
        const batch = tickers.slice(i, i + 20)
        const symbols = batch.map(t => t + '.SA').join(',')
        try {
            const rYtd = await axios.get(`https://query1.finance.yahoo.com/v8/finance/spark?symbols=${symbols}&range=ytd&interval=1mo`, { httpsAgent: agentSemSSL, headers: { "User-Agent": "Mozilla/5.0" } })
            for (const t of batch) {
                const dYtd = rYtd.data[t + '.SA']
                if (dYtd && dYtd.close && dYtd.close.length > 0 && dYtd.chartPreviousClose > 0) {
                    varAnoBatch[t] = ((dYtd.close[dYtd.close.length - 1] - dYtd.chartPreviousClose) / dYtd.chartPreviousClose) * 100
                }
            }
        } catch (e) {}
        if (i + 20 < tickers.length) await new Promise(r => setTimeout(r, 300))
    }
    console.log(`  Yahoo batch ações: ${Object.keys(varAnoBatch).length} YTD (${Date.now() - startTime}ms)`)

    // Carregar nomes do CSV (fonte primária)
    const nomesCSV = lerNomesAcoes()

    // Buscar DY, P/L, nome, setor e dividendos via Investidor 10
    for (let i = 0; i < tickers.length; i++) {
        const t = tickers[i]
        try {
            const [rPrincipal, rDivs] = await Promise.all([
                axios.get(`https://investidor10.com.br/acoes/${t.toLowerCase()}/`, { httpsAgent: agentSemSSL, headers: { "User-Agent": "Mozilla/5.0" } }),
                axios.get(`https://investidor10.com.br/acoes/${t.toLowerCase()}/dividendos/`, { httpsAgent: agentSemSSL, headers: { "User-Agent": "Mozilla/5.0" } })
            ])
            const html = rPrincipal.data

            const dyMatch = html.match(/dividend\s*yield[^\d]*(\d+[,.]\d+)\s*%/i)
            const plMatch = html.match(/P\/L[^\d]*(\d+[,.]\d+)/i)
            const dy = dyMatch ? parseFloat(dyMatch[1].replace(',', '.')) : 0
            const pl = plMatch ? parseFloat(plMatch[1].replace(',', '.')) : null

            // Extrair nome e setor
            const articleMatch = html.match(/"articleBody":\s*"([^"]+)"/)
            const articleBody = articleMatch ? articleMatch[1] : ''
            const setorMatch = articleBody.match(/setor[^.]*?([A-Z\u00c0-\u00ff][^.]{3,40})/i)
            const nome = nomesCSV[t] || ''
            const setor = setorMatch ? setorMatch[1].trim() : ''

            // Extrair dividendos com datas
            const rendimentos = []
            const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
            let trMatch
            while ((trMatch = trRegex.exec(rDivs.data)) !== null) {
                const tds = []
                const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
                let tdMatch
                while ((tdMatch = tdRegex.exec(trMatch[1])) !== null) {
                    tds.push(tdMatch[1].replace(/<[^>]+>/g, '').trim())
                }
                if (tds.length >= 4 && (tds[0].toLowerCase().includes('dividendo') || tds[0].toLowerCase().includes('jscp') || tds[0].toLowerCase().includes('jcp'))) {
                    rendimentos.push({ tipo: tds[0], dataCom: tds[1], pagamento: tds[2], valor: parseFloat(tds[3].replace(/\./g, '').replace(',', '.')) })
                }
            }

            // Consistência para ações: anos seguidos que pagou dividendos
            const porAno = {}
            for (const r of rendimentos) {
                const anoMatch = (r.dataCom && r.dataCom.match(/(\d{4})/)) || (r.pagamento && r.pagamento.match(/(\d{4})/))
                if (anoMatch) {
                    const ano = anoMatch[1]
                    porAno[ano] = (porAno[ano] || 0) + r.valor
                }
            }
            const anos = Object.keys(porAno).sort().reverse()
            let anosConsistentes = 0
            const anoVigente = new Date().getFullYear().toString()
            // Comecar do ano vigente ou do ano mais recente com pagamento
            const anoInicio = anos[0] && parseInt(anos[0]) >= parseInt(anoVigente) - 1 ? anos[0] : null
            if (!anoInicio || !porAno[anoInicio] || porAno[anoInicio] <= 0) {
                anosConsistentes = 0
            } else {
                for (let j = 0; j < anos.length; j++) {
                    if (parseInt(anos[j]) > parseInt(anoVigente)) continue
                    if (porAno[anos[j]] > 0) anosConsistentes++
                    else break
                }
            }

            resultados.push({ ticker: t, dy, pl, varAno: varAnoBatch[t] || 0, mesesConsistentes: anosConsistentes, nome, setor, dividendos: rendimentos.slice(0, 10), descricao: articleBody.replace(/\s+/g, ' ').substring(0, 300) })

            if ((i + 1) % 10 === 0) console.log(`  Investidor 10 ações: ${i + 1}/${tickers.length} (${Date.now() - startTime}ms)`)
        } catch (e) {
            resultados.push({ ticker: t, dy: 0, pl: null, varAno: varAnoBatch[t] || 0, mesesConsistentes: 0, nome: '', setor: '', dividendos: [], descricao: '' })
        }
        if (i < tickers.length - 1) await new Promise(r => setTimeout(r, 500))
    }

    const allDY = resultados.filter(r => r.dy > 0).sort((a, b) => b.dy - a.dy)
        .map(r => ({ ticker: r.ticker, valor: r.dy.toFixed(2).replace('.', ',') + '%' }))
    const allBaratos = resultados.filter(r => r.pl && r.pl > 0).sort((a, b) => a.pl - b.pl)
        .map(r => ({ ticker: r.ticker, valor: r.pl.toFixed(2).replace('.', ',') }))
    const allVarAno = resultados.filter(r => r.varAno > 0).sort((a, b) => b.varAno - a.varAno)
        .map(r => ({ ticker: r.ticker, valor: '+' + r.varAno.toFixed(2).replace('.', ',') + '%' }))
    const allConsistentes = resultados.sort((a, b) => b.mesesConsistentes - a.mesesConsistentes)
        .map(r => ({ ticker: r.ticker, valor: r.mesesConsistentes + ' anos' }))

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`🏆 Rankings ações: DY(${allDY.length}) | Baratos(${allBaratos.length}) | Var.Ano(${allVarAno.length}) | Consistentes(${allConsistentes.length}) | Tempo: ${elapsed}s`)
    return { topDY: allDY.slice(0, 5), topBaratos: allBaratos.slice(0, 5), topVarAno: allVarAno.slice(0, 5), topConsistentes: allConsistentes.slice(0, 5), allDY, allBaratos, allVarAno, allConsistentes, detalhes: resultados }
}


// ===============================
// 🚀 MAIN
// ===============================

async function main() {
    console.log("🚀 InvestPop — Gerando página...\n")

    const fiis = lerFiis()
    const args = process.argv.slice(2)
    const limitFlag = args.find(a => a.startsWith("--limit="))
    const limit = limitFlag ? parseInt(limitFlag.split("=")[1]) : fiis.length
    const fiisLimitados = fiis.slice(0, limit)
    const usarCache = args.includes("--cache")
    const teste = args.includes("--teste")
    global.INVESTPOP_TESTE = teste
    if (teste) console.log("⚠️ Modo teste: tracking desativado\n")

    console.log(`📋 ${fiisLimitados.length} FIIs carregados\n`)

    const ifix = await buscarIfix()

    let resultados = []

    if (usarCache) {
        const cacheFull = carregarCacheFull()
        if (cacheFull) {
            const ifix = cacheFull.ifix
            const resultados = cacheFull.fiis
            const rankings = cacheFull.rankings

            const todasAltas = resultados.filter(r => r.varNum > 0).sort((a, b) => b.varNum - a.varNum)
            const todasQuedas = resultados.filter(r => r.varNum < 0).sort((a, b) => a.varNum - b.varNum)
            const altas = todasAltas.slice(0, 5)
            const quedas = todasQuedas.slice(0, 5)
            rankings.topAltas = altas.map(r => ({ ticker: r.ticker }))
            rankings.topQuedas = quedas.map(r => ({ ticker: r.ticker }))

            console.log(`\n📈 Altas: ${todasAltas.length} | 📉 Quedas: ${todasQuedas.length}`)

            const pasta = "pages"
            if (!fs.existsSync(pasta)) fs.mkdirSync(pasta)

            // Popular nomes para busca (FIIs + Ações CSV)
            global.INVESTPOP_NOMES = {}
            for (const det of rankings.detalhes) { if (det.nome) global.INVESTPOP_NOMES[det.ticker] = det.nome }
            const nomesCSV = lerNomesAcoes()
            for (const [ticker, nome] of Object.entries(nomesCSV)) { global.INVESTPOP_NOMES[ticker] = nome }

            fs.writeFileSync(path.join(pasta, "index.html"), gerarHtml(ifix, altas, quedas, rankings))
            fs.writeFileSync(path.join(pasta, "altas.html"), gerarPaginaLista("Maiores Altas do Dia", todasAltas, "text-emerald-500"))
            fs.writeFileSync(path.join(pasta, "quedas.html"), gerarPaginaLista("Maiores Quedas do Dia", todasQuedas, "text-red-500"))
            fs.writeFileSync(path.join(pasta, "ranking-dy.html"), gerarPaginaRanking("FIIs que Mais Pagam (DY 12M)", "DY (12M)", rankings.allDY, "text-emerald-500"))
            fs.writeFileSync(path.join(pasta, "ranking-baratos.html"), gerarPaginaRanking("FIIs Mais Baratos (P/VP)", "P/VP", rankings.allBaratos, "text-blue-400"))
            fs.writeFileSync(path.join(pasta, "ranking-valorizacao.html"), gerarPaginaRanking("FIIs que Mais Valorizaram no Ano", "Var. Ano", rankings.allVarAno, "text-emerald-500"))
            fs.writeFileSync(path.join(pasta, "ranking-consistentes.html"), gerarPaginaRanking("FIIs Pagadores Consistentes", "Consist\u00eancia", rankings.allConsistentes, "text-orange-400"))
            fs.writeFileSync(path.join(pasta, "console.html"), gerarConsole())
            fs.writeFileSync(path.join(pasta, "acessos.html"), gerarPaginaAcessos())
            fs.writeFileSync(path.join(pasta, "ibov-historico.html"), gerarPaginaIbovHistorico())
            fs.writeFileSync(path.join(pasta, "ghost.html"), '<!DOCTYPE html><html><head><script>document.cookie="ghost=true;path=/;max-age=31536000";location.href="index.html";<\/script></head></html>')

            // Gerar páginas de detalhe (via cache)
            const pastaFiisCache = path.join(pasta, "fiis")
            if (!fs.existsSync(pastaFiisCache)) fs.mkdirSync(pastaFiisCache)
            for (const det of rankings.detalhes) {
                fs.writeFileSync(path.join(pastaFiisCache, det.ticker + ".html"), gerarPaginaDetalhe(det, rankings.detalhes, rankings))
            }

            fs.copyFileSync(path.resolve(__dirname, "assets/busca.js"), path.join(pasta, "busca.js"))
            fs.copyFileSync(path.resolve(__dirname, "assets/console.js"), path.join(pasta, "console.js"))

            // Gerar sitemap dinâmico
            const sitemapUrls = ['index.html','acoes.html','altas.html','quedas.html','acoes-altas.html','acoes-quedas.html','ranking-dy.html','ranking-baratos.html','ranking-valorizacao.html','ranking-consistentes.html','acoes-ranking-dy.html','acoes-ranking-baratos.html','acoes-ranking-valorizacao.html','acoes-ranking-consistentes.html']
            const fiisFiles = fs.readdirSync(path.join(pasta,'fiis')).filter(f=>f.endsWith('.html')).map(f=>'fiis/'+f)
            const acoesFiles = fs.existsSync(path.join(pasta,'acoes')) ? fs.readdirSync(path.join(pasta,'acoes')).filter(f=>f.endsWith('.html')).map(f=>'acoes/'+f) : []
            const allUrls = sitemapUrls.concat(fiisFiles, acoesFiles)
            let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            for (const u of allUrls) {
                const prio = u === 'index.html' || u === 'acoes.html' ? '1.0' : u.includes('/') ? '0.6' : '0.8'
                sitemap += `  <url><loc>https://investpop.com.br/${u === 'index.html' ? '' : u}</loc><changefreq>hourly</changefreq><priority>${prio}</priority></url>\n`
            }
            sitemap += '</urlset>'
            fs.writeFileSync(path.join(pasta, 'sitemap.xml'), sitemap)
            console.log(`📍 Sitemap gerado: ${allUrls.length} URLs`)

            // Gerar páginas de ações (via cache)
            await sincronizarIBOV()
            const acoes = lerAcoes()
            console.log(`\n📊 Gerando páginas de ações (${acoes.length} tickers)...`)
            const ibovData = await buscarIbov()
            const resAcoes = await buscarAcoes(acoes)
            const todasAltasAcoes = resAcoes.filter(r => r.varNum > 0).sort((a, b) => b.varNum - a.varNum)
            const todasQuedasAcoes = resAcoes.filter(r => r.varNum < 0).sort((a, b) => a.varNum - b.varNum)
            const altasAcoes = todasAltasAcoes.slice(0, 5)
            const quedasAcoes = todasQuedasAcoes.slice(0, 5)
            console.log(`📈 Ações altas: ${todasAltasAcoes.length} | 📉 Quedas: ${todasQuedasAcoes.length}`)

            console.log("\n🏆 Buscando rankings de ações...")
            const rankingsAcoes = await buscarRankingsAcoes(acoes)

            // Adicionar nomes de ações ao mapa ANTES de gerar páginas (CSV tem prioridade)
            const nomesCSVPre = lerNomesAcoes()
            for (const det of (rankingsAcoes.detalhes || [])) {
                const n = nomesCSVPre[det.ticker] || det.nome
                if (n) global.INVESTPOP_NOMES[det.ticker] = n
            }
            for (const [ticker, nome] of Object.entries(nomesCSVPre)) {
                if (!global.INVESTPOP_NOMES[ticker]) global.INVESTPOP_NOMES[ticker] = nome
            }


            fs.writeFileSync(path.join(pasta, "acoes.html"), gerarHtmlAcoes(ibovData, altasAcoes, quedasAcoes, rankingsAcoes))
            fs.writeFileSync(path.join(pasta, "acoes-altas.html"), gerarPaginaListaAcoes("Maiores Altas do Dia - Ações", todasAltasAcoes, "text-emerald-500"))
            fs.writeFileSync(path.join(pasta, "acoes-quedas.html"), gerarPaginaListaAcoes("Maiores Quedas do Dia - Ações", todasQuedasAcoes, "text-red-500"))
            fs.writeFileSync(path.join(pasta, "acoes-ranking-dy.html"), gerarPaginaRankingAcoes("Ações que Mais Pagam (DY 12M)", "DY (12M)", rankingsAcoes.allDY, "text-emerald-500"))
            fs.writeFileSync(path.join(pasta, "acoes-ranking-baratos.html"), gerarPaginaRankingAcoes("Ações Mais Baratas (P/L)", "P/L", rankingsAcoes.allBaratos, "text-blue-400"))
            fs.writeFileSync(path.join(pasta, "acoes-ranking-valorizacao.html"), gerarPaginaRankingAcoes("Ações que Mais Valorizaram no Ano", "Var. Ano", rankingsAcoes.allVarAno, "text-emerald-500"))
            fs.writeFileSync(path.join(pasta, "acoes-ranking-consistentes.html"), gerarPaginaRankingAcoes("Ações Pagadoras Consistentes", "Consistência", rankingsAcoes.allConsistentes, "text-orange-400"))

            // Gerar páginas de detalhe de ações
            const pastaAcoesCache = path.join(pasta, "acoes")
            if (!fs.existsSync(pastaAcoesCache)) fs.mkdirSync(pastaAcoesCache)
            const tickersUnicos = [...new Set(acoes)]
            rankingsAcoes.topAltas = altasAcoes.map(r => ({ ticker: r.ticker }))
            rankingsAcoes.topQuedas = quedasAcoes.map(r => ({ ticker: r.ticker }))
            // Adicionar nomes de ações ao mapa (CSV tem prioridade)
            const nomesCSVCache = lerNomesAcoes()
            const descCSVCache = lerDescricoesAcoes()
            for (const det of (rankingsAcoes.detalhes || [])) {
                const n = nomesCSVCache[det.ticker] || det.nome
                if (n) global.INVESTPOP_NOMES[det.ticker] = n
            }
            for (const t of tickersUnicos) {
                const det = (rankingsAcoes.detalhes || []).find(r => r.ticker === t) || {}
                const cotacao = resAcoes.find(r => r.ticker === t)
                const preco = cotacao ? parseFloat(cotacao.preco.replace(',','.')) || 0 : 0
                const varDia = cotacao ? cotacao.varNum : 0
                const nomeAcao = nomesCSVCache[t] || det.nome || ''
                fs.writeFileSync(path.join(pastaAcoesCache, t + ".html"), gerarPaginaDetalheAcao({ticker: t, preco, varDia, dy: det.dy||0, pl: det.pl||null, varAno: det.varAno||0, mesesConsistentes: det.mesesConsistentes||0, nome: nomeAcao, setor: det.setor||'', dividendos: det.dividendos||[], descricao: descCSVCache[t]||det.descricao||''}, tickersUnicos.map(x => ({ticker: x})), rankingsAcoes))
            }
            console.log(`✅ ${tickersUnicos.length} páginas de detalhe de ações geradas`)

            console.log("\n✅ Páginas geradas em pages/ (via cache)")

            if (args.includes("--serve")) {
                const { exec } = require("child_process")
                exec(`npx http-server pages -p 8080 -o /console.html`, { cwd: __dirname })
                console.log("\n🌐 Servidor local: http://localhost:8080/console.html")
            } else if (!args.includes("--no-open")) {
                const { exec } = require("child_process")
                const caminho = path.resolve(pasta, "index.html")
                if (process.platform === "darwin") exec(`open "${caminho}"`)
                else if (process.platform === "win32") exec(`start "" "${caminho}"`)
                else exec(`xdg-open "${caminho}"`)
            }
            return
        }
        console.log("⚠️ Cache full não encontrado, buscando online...\n")
    }

    resultados = await buscarFiis(fiisLimitados)

    const todasAltas = resultados.filter(r => r.varNum > 0).sort((a, b) => b.varNum - a.varNum)
    const todasQuedas = resultados.filter(r => r.varNum < 0).sort((a, b) => a.varNum - b.varNum)
    const altas = todasAltas.slice(0, 5)
    const quedas = todasQuedas.slice(0, 5)

    console.log(`\n📈 Altas: ${todasAltas.length} | 📉 Quedas: ${todasQuedas.length}`)

    // Rankings
    console.log("\n🏆 Buscando rankings...")
    const rankings = await buscarRankings(fiis)
    rankings.topAltas = altas.map(r => ({ ticker: r.ticker }))
    rankings.topQuedas = quedas.map(r => ({ ticker: r.ticker }))

    const pasta = "pages"
    if (!fs.existsSync(pasta)) fs.mkdirSync(pasta)

    // Popular nomes para busca (FIIs + Ações CSV)
    global.INVESTPOP_NOMES = {}
    for (const det of rankings.detalhes) { if (det.nome) global.INVESTPOP_NOMES[det.ticker] = det.nome }
    const nomesCSVOnline = lerNomesAcoes()
    for (const [ticker, nome] of Object.entries(nomesCSVOnline)) { global.INVESTPOP_NOMES[ticker] = nome }

    fs.writeFileSync(path.join(pasta, "index.html"), gerarHtml(ifix, altas, quedas, rankings))
    fs.writeFileSync(path.join(pasta, "altas.html"), gerarPaginaLista("Maiores Altas do Dia", todasAltas, "text-emerald-500"))
    fs.writeFileSync(path.join(pasta, "quedas.html"), gerarPaginaLista("Maiores Quedas do Dia", todasQuedas, "text-red-500"))
    fs.writeFileSync(path.join(pasta, "ranking-dy.html"), gerarPaginaRanking("FIIs que Mais Pagam (DY 12M)", "DY (12M)", rankings.allDY, "text-emerald-500"))
    fs.writeFileSync(path.join(pasta, "ranking-baratos.html"), gerarPaginaRanking("FIIs Mais Baratos (P/VP)", "P/VP", rankings.allBaratos, "text-blue-400"))
    fs.writeFileSync(path.join(pasta, "ranking-valorizacao.html"), gerarPaginaRanking("FIIs que Mais Valorizaram no Ano", "Var. Ano", rankings.allVarAno, "text-emerald-500"))
    fs.writeFileSync(path.join(pasta, "ranking-consistentes.html"), gerarPaginaRanking("FIIs Pagadores Consistentes", "Consist\u00eancia", rankings.allConsistentes, "text-orange-400"))
    fs.writeFileSync(path.join(pasta, "console.html"), gerarConsole())
    fs.writeFileSync(path.join(pasta, "acessos.html"), gerarPaginaAcessos())
    fs.writeFileSync(path.join(pasta, "ibov-historico.html"), gerarPaginaIbovHistorico())
    fs.writeFileSync(path.join(pasta, "ghost.html"), '<!DOCTYPE html><html><head><script>document.cookie="ghost=true;path=/;max-age=31536000";location.href="index.html";<\/script></head></html>')

    // Gerar páginas de detalhe
    const pastaFiis = path.join(pasta, "fiis")
    if (!fs.existsSync(pastaFiis)) fs.mkdirSync(pastaFiis)
    for (const det of rankings.detalhes) {
        const cotacao = resultados.find(r => r.ticker === det.ticker)
        if (cotacao) det.preco = parseFloat(cotacao.preco.replace(',', '.')) || 0
        fs.writeFileSync(path.join(pastaFiis, det.ticker + ".html"), gerarPaginaDetalhe(det, rankings.detalhes, rankings))
    }
    fs.copyFileSync(path.resolve(__dirname, "assets/busca.js"), path.join(pasta, "busca.js"))
    fs.copyFileSync(path.resolve(__dirname, "assets/console.js"), path.join(pasta, "console.js"))
    console.log(`📄 ${rankings.detalhes.length} páginas de detalhe geradas`)

    // Gerar páginas de ações
    await sincronizarIBOV()
    const acoes = lerAcoes()
    console.log(`\n📊 Gerando páginas de ações (${acoes.length} tickers)...`)
    const ibovData = await buscarIbov()
    const resAcoes = await buscarAcoes(acoes)
    const todasAltasAcoes = resAcoes.filter(r => r.varNum > 0).sort((a, b) => b.varNum - a.varNum)
    const todasQuedasAcoes = resAcoes.filter(r => r.varNum < 0).sort((a, b) => a.varNum - b.varNum)
    const altasAcoes = todasAltasAcoes.slice(0, 5)
    const quedasAcoes = todasQuedasAcoes.slice(0, 5)
    console.log(`📈 Ações altas: ${todasAltasAcoes.length} | 📉 Quedas: ${todasQuedasAcoes.length}`)

    console.log("\n🏆 Buscando rankings de ações...")
    const rankingsAcoes = await buscarRankingsAcoes(acoes)

    // Adicionar nomes de ações ao mapa ANTES de gerar páginas (CSV tem prioridade)
    const nomesCSVPre2 = lerNomesAcoes()
    for (const det of (rankingsAcoes.detalhes || [])) {
        const n = nomesCSVPre2[det.ticker] || det.nome
        if (n) global.INVESTPOP_NOMES[det.ticker] = n
    }
    for (const [ticker, nome] of Object.entries(nomesCSVPre2)) {
        if (!global.INVESTPOP_NOMES[ticker]) global.INVESTPOP_NOMES[ticker] = nome
    }


    fs.writeFileSync(path.join(pasta, "acoes.html"), gerarHtmlAcoes(ibovData, altasAcoes, quedasAcoes, rankingsAcoes))
    fs.writeFileSync(path.join(pasta, "acoes-altas.html"), gerarPaginaListaAcoes("Maiores Altas do Dia - Ações", todasAltasAcoes, "text-emerald-500"))
    fs.writeFileSync(path.join(pasta, "acoes-quedas.html"), gerarPaginaListaAcoes("Maiores Quedas do Dia - Ações", todasQuedasAcoes, "text-red-500"))
    fs.writeFileSync(path.join(pasta, "acoes-ranking-dy.html"), gerarPaginaRankingAcoes("Ações que Mais Pagam (DY 12M)", "DY (12M)", rankingsAcoes.allDY, "text-emerald-500"))
    fs.writeFileSync(path.join(pasta, "acoes-ranking-baratos.html"), gerarPaginaRankingAcoes("Ações Mais Baratas (P/L)", "P/L", rankingsAcoes.allBaratos, "text-blue-400"))
    fs.writeFileSync(path.join(pasta, "acoes-ranking-valorizacao.html"), gerarPaginaRankingAcoes("Ações que Mais Valorizaram no Ano", "Var. Ano", rankingsAcoes.allVarAno, "text-emerald-500"))
    fs.writeFileSync(path.join(pasta, "acoes-ranking-consistentes.html"), gerarPaginaRankingAcoes("Ações Pagadoras Consistentes", "Consistência", rankingsAcoes.allConsistentes, "text-orange-400"))

    // Gerar páginas de detalhe de ações
    const pastaAcoes2 = path.join(pasta, "acoes")
    if (!fs.existsSync(pastaAcoes2)) fs.mkdirSync(pastaAcoes2)
    const tickersAcoesUnicos = [...new Set(acoes)]
    rankingsAcoes.topAltas = altasAcoes.map(r => ({ ticker: r.ticker }))
    rankingsAcoes.topQuedas = quedasAcoes.map(r => ({ ticker: r.ticker }))
    // Adicionar nomes de ações ao mapa (CSV tem prioridade)
    const nomesCSVFull = lerNomesAcoes()
    const descCSVFull = lerDescricoesAcoes()
    for (const det of (rankingsAcoes.detalhes || [])) {
        const n = nomesCSVFull[det.ticker] || det.nome
        if (n) global.INVESTPOP_NOMES[det.ticker] = n
    }
    for (const t of tickersAcoesUnicos) {
        const det = (rankingsAcoes.detalhes || []).find(r => r.ticker === t) || {}
        const cotacao = resAcoes.find(r => r.ticker === t)
        const preco = cotacao ? parseFloat(cotacao.preco.replace(',','.')) || 0 : 0
        const varDia = cotacao ? cotacao.varNum : 0
        const nomeAcao = nomesCSVFull[t] || det.nome || ''
        fs.writeFileSync(path.join(pastaAcoes2, t + ".html"), gerarPaginaDetalheAcao({ticker: t, preco, varDia, dy: det.dy||0, pl: det.pl||null, varAno: det.varAno||0, mesesConsistentes: det.mesesConsistentes||0, nome: nomeAcao, setor: det.setor||'', dividendos: det.dividendos||[], descricao: descCSVFull[t]||det.descricao||''}, tickersAcoesUnicos.map(x => ({ticker: x})), rankingsAcoes))
    }
    console.log(`✅ ${tickersAcoesUnicos.length} páginas de detalhe de ações geradas`)

    console.log("\n✅ Páginas geradas em pages/")

    // Salvar cache full para uso local
    salvarCacheFull({ ifix, fiis: resultados, rankings })

    if (args.includes("--serve")) {
        const { exec } = require("child_process")
        exec(`npx http-server pages -p 8080 -o /console.html`, { cwd: __dirname })
        console.log("\n🌐 Servidor local: http://localhost:8080/console.html")
    } else if (!args.includes("--no-open")) {
        const { exec } = require("child_process")
        const caminho = path.resolve(pasta, "index.html")
        if (process.platform === "win32") exec(`start "" "${caminho}"`)
        else if (process.platform === "darwin") exec(`open "${caminho}"`)
        else exec(`xdg-open "${caminho}"`)
    }
}

if (require.main === module) {
    main()
}

module.exports = { lerFiis, buscarIfix, buscarFiis, buscarRankings, calcularMesesSemQuebra, carregarCache, salvarCache, main }
