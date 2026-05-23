const axios = require("axios")
const fs = require("fs")
const path = require("path")
const https = require("https")
const { gerarHtml } = require("./generators/pagina-index")
const { gerarPaginaLista } = require("./generators/pagina-lista")
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

    const pasta = "pages"
    if (!fs.existsSync(pasta)) fs.mkdirSync(pasta)

    fs.writeFileSync(path.join(pasta, "index.html"), gerarHtml(ifix, altas, quedas))
    fs.writeFileSync(path.join(pasta, "altas.html"), gerarPaginaLista("Maiores Altas do Dia", todasAltas, "text-emerald-500"))
    fs.writeFileSync(path.join(pasta, "quedas.html"), gerarPaginaLista("Maiores Quedas do Dia", todasQuedas, "text-red-500"))
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

module.exports = { lerFiis, buscarIfix, buscarFiis, carregarCache, salvarCache, main }
