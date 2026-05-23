const axios = require("axios")
const fs = require("fs")
const path = require("path")
const https = require("https")
const { gerarHtml } = require("./generators/pagina-index")
const { gerarPaginaLista, gerarPaginaRanking } = require("./generators/pagina-lista")
const { gerarConsole } = require("./generators/pagina-console")

const agentSemSSL = new https.Agent({ rejectUnauthorized: false })
const CACHE_FILE = path.resolve(__dirname, "data/cache_fiis.csv")

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
        return { meses, quebra: proximo.data }
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

            // Extrair rendimentos
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
                    rendimentos.push({ data: tds[1], valor: parseFloat(tds[3].replace(/\./g, '').replace(',', '.')) })
                }
            }

            const consistencia = calcularMesesSemQuebra(rendimentos)

            resultados.push({
                ticker: t,
                dy,
                pvp,
                varDia: varDiaBatch[t] || 0,
                varAno: varAnoBatch[t] || 0,
                mesesConsistentes: consistencia.meses
            })

            if ((i + 1) % 10 === 0) console.log(`  Investidor 10: ${i + 1}/${tickers.length} (${Date.now() - startTime}ms)`)
        } catch (e) {
            resultados.push({ ticker: t, dy: 0, pvp: null, varDia: varDiaBatch[t] || 0, varAno: varAnoBatch[t] || 0, mesesConsistentes: 0 })
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
    return { topDY, topBaratos, topVarAno, topConsistentes, allDY, allBaratos, allVarAno, allConsistentes }
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
        const cached = carregarCache()
        if (cached) {
            resultados = cached
        } else {
            console.log("⚠️ Cache não encontrado, buscando todos online...\n")
            resultados = await buscarFiis(fiis)
            salvarCache(resultados)
        }
    } else {
        resultados = await buscarFiis(fiisLimitados)
    }

    const todasAltas = resultados.filter(r => r.varNum > 0).sort((a, b) => b.varNum - a.varNum)
    const todasQuedas = resultados.filter(r => r.varNum < 0).sort((a, b) => a.varNum - b.varNum)
    const altas = todasAltas.slice(0, 5)
    const quedas = todasQuedas.slice(0, 5)

    console.log(`\n📈 Altas: ${todasAltas.length} | 📉 Quedas: ${todasQuedas.length}`)

    // Rankings
    console.log("\n🏆 Buscando rankings...")
    const rankings = await buscarRankings(fiis)

    const pasta = "pages"
    if (!fs.existsSync(pasta)) fs.mkdirSync(pasta)

    fs.writeFileSync(path.join(pasta, "index.html"), gerarHtml(ifix, altas, quedas, rankings))
    fs.writeFileSync(path.join(pasta, "altas.html"), gerarPaginaLista("Maiores Altas do Dia", todasAltas, "text-emerald-500"))
    fs.writeFileSync(path.join(pasta, "quedas.html"), gerarPaginaLista("Maiores Quedas do Dia", todasQuedas, "text-red-500"))
    fs.writeFileSync(path.join(pasta, "ranking-dy.html"), gerarPaginaRanking("FIIs que Mais Pagam (DY 12M)", "DY (12M)", rankings.allDY, "text-emerald-500"))
    fs.writeFileSync(path.join(pasta, "ranking-baratos.html"), gerarPaginaRanking("FIIs Mais Baratos (P/VP)", "P/VP", rankings.allBaratos, "text-blue-400"))
    fs.writeFileSync(path.join(pasta, "ranking-valorizacao.html"), gerarPaginaRanking("FIIs que Mais Valorizaram no Ano", "Var. Ano", rankings.allVarAno, "text-emerald-500"))
    fs.writeFileSync(path.join(pasta, "ranking-consistentes.html"), gerarPaginaRanking("FIIs Pagadores Consistentes", "Consist\u00eancia", rankings.allConsistentes, "text-orange-400"))
    fs.writeFileSync(path.join(pasta, "console.html"), gerarConsole())
    fs.writeFileSync(path.join(pasta, "ghost.html"), '<!DOCTYPE html><html><head><script>document.cookie="ghost=true;path=/;max-age=31536000";location.href="index.html";<\/script></head></html>')
    console.log("\n✅ Páginas geradas em pages/")

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

module.exports = { lerFiis, buscarIfix, buscarFiis, buscarRankings, carregarCache, salvarCache, main }
