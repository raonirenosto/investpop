#!/usr/bin/env node
/**
 * Teste da Busca - InvestPop
 *
 * Verifica que todas as páginas geradas têm busca funcional:
 * - FIIS_LISTA presente com 107 tickers
 * - busca.js incluído
 * - Input de busca no nav (desktop)
 * - Ícone de lupa (mobile)
 * - Links clicáveis nos tickers
 * - busca.js funciona (simula busca e verifica resultado)
 *
 * Execução: nvm use 20 && node tests/validacao-busca.js
 */
const fs = require('fs')
const path = require('path')
const puppeteer = require('puppeteer')

const PAGES_DIR = path.resolve(__dirname, '../pages')
const TODAS_PAGINAS = [
    'index.html',
    'altas.html',
    'quedas.html',
    'ranking-dy.html',
    'ranking-baratos.html',
    'ranking-valorizacao.html',
    'ranking-consistentes.html',
]

// Pegar 5 páginas de detalhe
const detalhes = fs.readdirSync(path.join(PAGES_DIR, 'fiis')).filter(f => /^[A-Z]{4}\d{2}\.html$/.test(f)).slice(0, 5).map(f => 'fiis/' + f)
const PAGINAS = [...TODAS_PAGINAS, ...detalhes]

let totalPassou = 0
let totalFalhou = 0

async function testarEstruturaHTML() {
    console.log('\n🔍 TESTE 1 — Estrutura HTML da busca (' + PAGINAS.length + ' páginas)')

    let ok = true
    for (const p of PAGINAS) {
        const html = fs.readFileSync(path.join(PAGES_DIR, p), 'utf-8')
        const temFiisLista = html.includes('FIIS_LISTA')
        const temBuscaJs = html.includes('busca.js')
        const temLupa = html.includes('M21 21l-6-6')

        if (!temFiisLista || !temBuscaJs || !temLupa) {
            ok = false
            console.log('   ❌ ' + p + ' — FIIS_LISTA:' + (temFiisLista ? '✓' : '✗') + ' busca.js:' + (temBuscaJs ? '✓' : '✗') + ' lupa:' + (temLupa ? '✓' : '✗'))
        } else {
            console.log('   ✅ ' + p)
        }
    }

    // Verificar FIIS_LISTA tem 107 tickers
    const indexHtml = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf-8')
    const match = indexHtml.match(/FIIS_LISTA\s*=\s*\[([^\]]+)\]/)
    if (match) {
        const count = match[1].split(',').length
        if (count >= 100) {
            console.log('   ✅ FIIS_LISTA: ' + count + ' tickers')
        } else {
            ok = false
            console.log('   ❌ FIIS_LISTA: apenas ' + count + ' tickers (esperado 107)')
        }
    } else {
        ok = false
        console.log('   ❌ FIIS_LISTA não encontrado na index')
    }

    // Verificar busca.js existe
    if (fs.existsSync(path.join(PAGES_DIR, 'busca.js'))) {
        console.log('   ✅ busca.js presente em pages/')
    } else {
        ok = false
        console.log('   ❌ busca.js NÃO encontrado em pages/')
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarLinksClicaveis() {
    console.log('\n🔍 TESTE 2 — Tickers clicáveis nas tabelas')

    let ok = true
    const paginas = ['index.html', 'altas.html', 'ranking-dy.html']

    for (const p of paginas) {
        const html = fs.readFileSync(path.join(PAGES_DIR, p), 'utf-8')
        const links = html.match(/<a href="fiis\/[A-Z]{4}\d{2}\.html"/g) || []
        if (links.length > 0) {
            console.log('   ✅ ' + p + ': ' + links.length + ' tickers clicáveis')
        } else {
            ok = false
            console.log('   ❌ ' + p + ': nenhum ticker clicável')
        }
    }

    // Verificar Maior Alta e Maior Baixa na index
    const indexHtml = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf-8')
    const resumoLinks = indexHtml.match(/font-bold mt-1"><a href="fiis\/[A-Z]{4}\d{2}\.html"/g) || []
    if (resumoLinks.length >= 2) {
        console.log('   ✅ Resumo do Mercado: Maior Alta e Maior Baixa clicáveis')
    } else {
        ok = false
        console.log('   ❌ Resumo do Mercado: links faltando (' + resumoLinks.length + '/2)')
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarBuscaFuncional(browser) {
    console.log('\n🔍 TESTE 3 — Busca funcional (Puppeteer)')

    const paginas = ['index.html', 'ranking-dy.html', detalhes[0] || 'HCTR11.html']
    let ok = true

    for (const p of paginas) {
        const filePath = path.join(PAGES_DIR, p)
        if (!fs.existsSync(filePath)) { console.log('   ⚠️ ' + p + ' não existe'); continue }

        const page = await browser.newPage()
        await page.goto('file://' + filePath, { waitUntil: 'domcontentloaded' })
        await new Promise(r => setTimeout(r, 500))

        // Desktop: digitar no input e verificar dropdown
        const resultado = await page.evaluate(() => {
            var input = document.querySelector('nav input[type="text"]')
            if (!input) return { erro: 'input não encontrado' }

            // Simular digitação
            input.value = 'HG'
            input.dispatchEvent(new Event('input'))

            // Esperar dropdown
            return new Promise(resolve => {
                setTimeout(() => {
                    var dropdown = input.parentElement.querySelector('[class*="absolute"]')
                    if (dropdown && !dropdown.classList.contains('hidden')) {
                        var links = dropdown.querySelectorAll('a')
                        var tickers = Array.from(links).map(a => a.textContent.trim())
                        resolve({ ok: true, resultados: tickers.length, tickers: tickers.slice(0, 3) })
                    } else {
                        resolve({ erro: 'dropdown não apareceu' })
                    }
                }, 300)
            })
        })

        if (resultado.ok && resultado.resultados > 0) {
            console.log('   ✅ ' + p + ': busca "HG" → ' + resultado.resultados + ' resultados (' + resultado.tickers.join(', ') + ')')
        } else {
            ok = false
            console.log('   ❌ ' + p + ': ' + (resultado.erro || 'sem resultados'))
        }

        await page.close()
    }

    if (ok) { totalPassou++; console.log('   Status: ✅ PASSOU') }
    else { totalFalhou++; console.log('   Status: ❌ FALHOU') }
}

async function testarBuscaMobile(browser) {
    console.log('\n🔍 TESTE 4 — Busca mobile (Puppeteer)')

    const page = await browser.newPage()
    await page.setViewport({ width: 414, height: 896 })
    await page.goto('file://' + path.join(PAGES_DIR, 'index.html'), { waitUntil: 'domcontentloaded' })
    await new Promise(r => setTimeout(r, 500))

    const resultado = await page.evaluate(() => {
        // Clicar na lupa mobile
        var btns = document.querySelectorAll('button')
        var lupaBtn = null
        btns.forEach(function(b) {
            if (b.querySelector('path[d*="M21 21l-6-6"]') && b.offsetHeight > 0) lupaBtn = b
        })
        if (!lupaBtn) return { erro: 'botão lupa não encontrado' }
        lupaBtn.click()

        return new Promise(resolve => {
            setTimeout(() => {
                var overlay = document.getElementById('busca-mobile-overlay')
                if (!overlay || overlay.classList.contains('hidden')) {
                    resolve({ erro: 'overlay não abriu' })
                    return
                }
                var input = document.getElementById('busca-mob-input')
                if (!input) { resolve({ erro: 'input mobile não encontrado' }); return }

                input.value = 'MX'
                input.dispatchEvent(new Event('input'))

                setTimeout(() => {
                    var results = document.getElementById('busca-mob-results')
                    var links = results ? results.querySelectorAll('a') : []
                    if (links.length > 0) {
                        resolve({ ok: true, resultados: links.length, primeiro: links[0].textContent.trim() })
                    } else {
                        resolve({ erro: 'sem resultados mobile' })
                    }
                }, 300)
            }, 300)
        })
    })

    if (resultado.ok) {
        console.log('   ✅ Mobile: lupa → overlay → busca "MX" → ' + resultado.resultados + ' resultado(s) (' + resultado.primeiro + ')')
    } else {
        totalFalhou++
        console.log('   ❌ Mobile: ' + resultado.erro)
        console.log('   Status: ❌ FALHOU')
        await page.close()
        return
    }

    // Testar cancelar fecha overlay
    const cancelOk = await page.evaluate(() => {
        var cancelBtn = document.getElementById('busca-mob-cancel')
        if (!cancelBtn) return { erro: 'botão cancelar não encontrado' }
        cancelBtn.click()
        return new Promise(resolve => {
            setTimeout(() => {
                var overlay = document.getElementById('busca-mobile-overlay')
                resolve({ fechou: overlay && overlay.classList.contains('hidden') })
            }, 200)
        })
    })

    if (cancelOk.fechou) {
        console.log('   ✅ Cancelar fecha overlay')
    } else {
        totalFalhou++
        console.log('   ❌ Cancelar não fechou overlay: ' + (cancelOk.erro || ''))
        console.log('   Status: ❌ FALHOU')
        await page.close()
        return
    }

    // Testar click fora fecha overlay
    const clickForaOk = await page.evaluate(() => {
        // Reabrir overlay
        var btns = document.querySelectorAll('button')
        var lupaBtn = null
        btns.forEach(function(b) {
            if (b.querySelector('path[d*="M21 21l-6-6"]') && b.offsetHeight > 0) lupaBtn = b
        })
        if (lupaBtn) lupaBtn.click()
        return new Promise(resolve => {
            setTimeout(() => {
                var overlay = document.getElementById('busca-mobile-overlay')
                if (!overlay || overlay.classList.contains('hidden')) { resolve({ erro: 'overlay não reabriu' }); return }
                // Click no overlay (fora do conteúdo)
                overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }))
                setTimeout(() => {
                    resolve({ fechou: overlay.classList.contains('hidden') })
                }, 200)
            }, 300)
        })
    })

    if (clickForaOk.fechou) {
        console.log('   ✅ Click fora fecha overlay')
    } else {
        totalFalhou++
        console.log('   ❌ Click fora não fechou overlay: ' + (clickForaOk.erro || ''))
        console.log('   Status: ❌ FALHOU')
        await page.close()
        return
    }

    await page.close()
    totalPassou++
    console.log('   Status: ✅ PASSOU')
}

async function testarBuscaMobileDetalhe(browser) {
    console.log('\n🔍 TESTE 5 — Busca mobile na página de detalhe')

    const page = await browser.newPage()
    await page.setViewport({ width: 414, height: 896 })
    await page.goto('file://' + path.join(PAGES_DIR, 'fiis', 'HGLG11.html'), { waitUntil: 'domcontentloaded' })
    await new Promise(r => setTimeout(r, 500))

    const resultado = await page.evaluate(() => {
        var historyBefore = history.length

        // Encontrar e clicar na lupa
        var btns = document.querySelectorAll('button')
        var lupaBtn = null
        btns.forEach(function(b) {
            if (b.querySelector('path[d*="M21 21l-6-6"]') && b.offsetHeight > 0) lupaBtn = b
        })
        if (!lupaBtn) return { erro: 'botão lupa não encontrado na página de detalhe' }
        lupaBtn.click()

        return new Promise(resolve => {
            setTimeout(() => {
                var overlay = document.getElementById('busca-mobile-overlay')
                if (!overlay || overlay.classList.contains('hidden')) {
                    resolve({ erro: 'overlay não abriu na página de detalhe' })
                    return
                }

                var historyAfterOpen = history.length

                var input = document.getElementById('busca-mob-input')
                if (!input) { resolve({ erro: 'input não encontrado' }); return }

                input.value = 'MX'
                input.dispatchEvent(new Event('input'))

                setTimeout(() => {
                    var results = document.getElementById('busca-mob-results')
                    var links = results ? results.querySelectorAll('a') : []

                    // Fechar overlay
                    var cancelBtn = document.getElementById('busca-mob-cancel')
                    if (cancelBtn) cancelBtn.click()

                    setTimeout(() => {
                        var historyAfterClose = history.length

                        if (links.length > 0) {
                            var href = links[0].getAttribute('href')
                            resolve({
                                ok: true,
                                resultados: links.length,
                                primeiro: links[0].textContent.trim(),
                                href: href,
                                historyBefore: historyBefore,
                                historyAfterOpen: historyAfterOpen,
                                historyAfterClose: historyAfterClose
                            })
                        } else {
                            resolve({ erro: 'sem sugestões na página de detalhe' })
                        }
                    }, 200)
                }, 300)
            }, 300)
        })
    })

    await page.close()

    if (resultado.ok) {
        var pathOk = resultado.href && !resultado.href.includes('fiis/fiis/')
        var historyOk = resultado.historyBefore === resultado.historyAfterOpen && resultado.historyAfterOpen === resultado.historyAfterClose

        if (pathOk && historyOk) {
            totalPassou++
            console.log('   ✅ Detalhe mobile: lupa → busca "MX" → ' + resultado.resultados + ' resultado(s), link: ' + resultado.href)
            console.log('   ✅ Histórico não poluído (antes=' + resultado.historyBefore + ' abrir=' + resultado.historyAfterOpen + ' fechar=' + resultado.historyAfterClose + ')')
            console.log('   Status: ✅ PASSOU')
        } else {
            totalFalhou++
            if (!pathOk) console.log('   ❌ Path duplicado no link: ' + resultado.href)
            if (!historyOk) console.log('   ❌ Histórico poluído (antes=' + resultado.historyBefore + ' abrir=' + resultado.historyAfterOpen + ' fechar=' + resultado.historyAfterClose + ')')
            console.log('   Status: ❌ FALHOU')
        }
    } else {
        totalFalhou++
        console.log('   ❌ ' + resultado.erro)
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarTabletBusca(browser) {
    console.log('\n🔍 TESTE 6 — Busca visível no tablet retrato (768px)')

    const page = await browser.newPage()
    await page.setViewport({ width: 768, height: 1024 })
    await page.goto('file://' + path.join(PAGES_DIR, 'index.html'), { waitUntil: 'domcontentloaded' })
    await new Promise(r => setTimeout(r, 500))

    const resultado = await page.evaluate(() => {
        var input = document.querySelector('nav input[type="text"]')
        if (!input) return { visivel: false, erro: 'input não encontrado' }
        var rect = input.getBoundingClientRect()
        return { visivel: rect.width > 0 && rect.height > 0 }
    })

    await page.close()

    if (resultado.visivel) {
        totalPassou++
        console.log('   ✅ Input de busca visível no tablet 768px')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Input de busca NÃO visível no tablet 768px: ' + (resultado.erro || ''))
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarTabsRanking(browser) {
    console.log('\n🔍 TESTE 7 — Tabs de ranking não cortadas no mobile (414px)')

    const page = await browser.newPage()
    await page.setViewport({ width: 414, height: 896 })
    await page.goto('file://' + path.join(PAGES_DIR, 'index.html'), { waitUntil: 'domcontentloaded' })
    await new Promise(r => setTimeout(r, 500))

    const resultado = await page.evaluate(() => {
        var tabs = document.querySelectorAll('[id^="tab-rank-"]')
        if (!tabs.length) return { erro: 'tabs não encontradas' }
        var todas_visiveis = true
        var cortadas = []
        tabs.forEach(function(tab) {
            var rect = tab.getBoundingClientRect()
            // Tab está cortada se o right ultrapassa a viewport
            if (rect.right > window.innerWidth) {
                todas_visiveis = false
                cortadas.push(tab.textContent.trim())
            }
        })
        return { ok: todas_visiveis, cortadas: cortadas, total: tabs.length }
    })

    await page.close()

    if (resultado.ok) {
        totalPassou++
        console.log('   ✅ Todas as ' + resultado.total + ' tabs visíveis sem corte')
        console.log('   Status: ✅ PASSOU')
    } else {
        totalFalhou++
        console.log('   ❌ Tabs cortadas: ' + resultado.cortadas.join(', '))
        console.log('   Status: ❌ FALHOU')
    }
}

async function testarNavegacao(browser) {
    console.log('\n🔍 TESTE 8 — Navegação busca → detalhe')

    const page = await browser.newPage()
    await page.goto('file://' + path.join(PAGES_DIR, 'index.html'), { waitUntil: 'domcontentloaded' })
    await new Promise(r => setTimeout(r, 500))

    // Digitar e clicar no resultado
    const navOk = await page.evaluate(() => {
        var input = document.querySelector('nav input[type="text"]')
        if (!input) return false
        input.value = 'HGLG'
        input.dispatchEvent(new Event('input'))
        return true
    })

    if (!navOk) {
        totalFalhou++
        console.log('   ❌ Input não encontrado')
        console.log('   Status: ❌ FALHOU')
        await page.close()
        return
    }

    await new Promise(r => setTimeout(r, 400))

    const linkHref = await page.evaluate(() => {
        var dropdown = document.querySelector('[class*="absolute"] a')
        return dropdown ? dropdown.getAttribute('href') : null
    })

    if (linkHref === 'fiis/HGLG11.html') {
        console.log('   ✅ Busca "HGLG" → link para fiis/HGLG11.html')
    } else {
        totalFalhou++
        console.log('   ❌ Link esperado fiis/HGLG11.html, obteve: ' + linkHref)
        console.log('   Status: ❌ FALHOU')
        await page.close()
        return
    }

    await page.close()
    totalPassou++
    console.log('   Status: ✅ PASSOU')
}

async function main() {
    const startTotal = Date.now()

    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║          VALIDAÇÃO DA BUSCA - InvestPop                     ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log('║  Testa: estrutura HTML, links, busca desktop/mobile         ║')
    console.log('║  Páginas: index, rankings, ver todos, detalhes              ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')

    await testarEstruturaHTML()
    await testarLinksClicaveis()

    console.log('\n⏳ Abrindo browser...')
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-gpu', '--allow-file-access-from-files'] })
    console.log('✅ Browser pronto')

    await testarBuscaFuncional(browser)
    await testarBuscaMobile(browser)
    await testarBuscaMobileDetalhe(browser)
    await testarTabletBusca(browser)
    await testarTabsRanking(browser)
    await testarNavegacao(browser)

    await browser.close()

    const elapsed = ((Date.now() - startTotal) / 1000).toFixed(1)
    console.log('\n╔══════════════════════════════════════════════════════════════╗')
    console.log('║          RESUMO                                             ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log(`║  ✅ Passou: ${totalPassou}                                              ║`)
    console.log(`║  ❌ Falhou: ${totalFalhou}                                              ║`)
    console.log(`║  ⏱️  Tempo total: ${elapsed}s                                      ║`)
    console.log('╚══════════════════════════════════════════════════════════════╝')

    process.exit(totalFalhou > 0 ? 1 : 0)
}

main().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1) })
