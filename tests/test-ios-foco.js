#!/usr/bin/env node
/**
 * Teste iOS Safari Real — Foco na busca mobile
 * 
 * Usa Appium + XCUITest + Safari no iOS Simulator
 * Verifica que ao clicar na lupa, o input recebe foco (teclado aparece)
 * 
 * Pré-requisitos:
 * - Xcode instalado com iOS Simulator
 * - Appium rodando: appium --relaxed-security
 * - Simulador iPhone bootado
 * 
 * Execução: node tests/test-ios-foco.js
 */
const { remote } = require('webdriverio');

const SITE_URL = 'https://raonirenosto.github.io/investpop/';
const DETALHE_URL = 'https://raonirenosto.github.io/investpop/acoes/VALE3.html';

async function main() {
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║   TESTE iOS SAFARI REAL — Foco busca mobile (#64)          ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')

    console.log('\n⏳ Conectando ao Appium + Safari iOS Simulator...')

    const browser = await remote({
        hostname: '127.0.0.1',
        port: 4723,
        path: '/',
        capabilities: {
            platformName: 'iOS',
            'appium:automationName': 'XCUITest',
            'appium:deviceName': 'iPhone 17 Pro',
            'appium:platformVersion': '26.5',
            'appium:browserName': 'Safari',
            'appium:noReset': true
        },
        connectionRetryTimeout: 120000,
        connectionRetryCount: 3
    });

    console.log('✅ Conectado ao Safari iOS Simulator\n')

    let totalPassou = 0;
    let totalFalhou = 0;

    // TESTE 1: Foco na index
    console.log('🔍 TESTE 1 — Foco ao clicar na lupa (index)')
    try {
        await browser.url(SITE_URL);
        await browser.pause(2000);

        // Encontrar botão da lupa (busca mobile)
        const lupaBtn = await browser.$('button.busca-mobile-trigger');
        await lupaBtn.click();
        await browser.pause(1000);

        // Verificar se o teclado apareceu (indica foco)
        const isKeyboardShown = await browser.execute(() => {
            var input = document.getElementById('busca-mob-input');
            return input && document.activeElement === input;
        });

        if (isKeyboardShown) {
            totalPassou++;
            console.log('   ✅ Index: lupa clicada → input com foco')
        } else {
            totalFalhou++;
            console.log('   ❌ Index: lupa clicada → input SEM foco')
        }
    } catch (e) {
        totalFalhou++;
        console.log('   ❌ Index: erro — ' + e.message)
    }

    // TESTE 2: Foco na página de detalhe de ação
    console.log('\n🔍 TESTE 2 — Foco ao clicar na lupa (detalhe ação)')
    try {
        await browser.url(DETALHE_URL);
        await browser.pause(2000);

        const lupaBtn2 = await browser.$('button.busca-mobile-trigger');
        await lupaBtn2.click();
        await browser.pause(1000);

        const isKeyboardShown2 = await browser.execute(() => {
            var input = document.getElementById('busca-mob-input');
            return input && document.activeElement === input;
        });

        if (isKeyboardShown2) {
            totalPassou++;
            console.log('   ✅ Detalhe ação: lupa clicada → input com foco')
        } else {
            totalFalhou++;
            console.log('   ❌ Detalhe ação: lupa clicada → input SEM foco')
        }
    } catch (e) {
        totalFalhou++;
        console.log('   ❌ Detalhe ação: erro — ' + e.message)
    }

    // TESTE 3: Foco na página de detalhe de FII
    console.log('\n🔍 TESTE 3 — Foco ao clicar na lupa (detalhe FII)')
    try {
        await browser.url(SITE_URL + 'fiis/HGLG11.html');
        await browser.pause(2000);

        const lupaBtn3 = await browser.$('button.busca-mobile-trigger');
        await lupaBtn3.click();
        await browser.pause(1000);

        const isKeyboardShown3 = await browser.execute(() => {
            var input = document.getElementById('busca-mob-input');
            return input && document.activeElement === input;
        });

        if (isKeyboardShown3) {
            totalPassou++;
            console.log('   ✅ Detalhe FII: lupa clicada → input com foco')
        } else {
            totalFalhou++;
            console.log('   ❌ Detalhe FII: lupa clicada → input SEM foco')
        }
    } catch (e) {
        totalFalhou++;
        console.log('   ❌ Detalhe FII: erro — ' + e.message)
    }

    await browser.deleteSession();

    console.log('\n╔══════════════════════════════════════════════════════════════╗')
    console.log('║          RESUMO                                             ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log(`║  ✅ Passou: ${totalPassou}                                              ║`)
    console.log(`║  ❌ Falhou: ${totalFalhou}                                              ║`)
    console.log('╚══════════════════════════════════════════════════════════════╝')

    process.exit(totalFalhou > 0 ? 1 : 0);
}

main().catch(e => { console.error('ERRO FATAL:', e.message); process.exit(1) });
