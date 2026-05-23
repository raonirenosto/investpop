const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const PAGES_DIR = path.resolve(__dirname, '../pages')

describe('integração - geração completa', () => {
  beforeAll(() => {
    // Rodar gerar.js com cache e modo teste
    execSync('node gerar.js --no-open --cache --teste', {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, PATH: process.env.PATH }
    })
  })

  test('gera index.html', () => {
    expect(fs.existsSync(path.join(PAGES_DIR, 'index.html'))).toBe(true)
  })

  test('gera altas.html', () => {
    expect(fs.existsSync(path.join(PAGES_DIR, 'altas.html'))).toBe(true)
  })

  test('gera quedas.html', () => {
    expect(fs.existsSync(path.join(PAGES_DIR, 'quedas.html'))).toBe(true)
  })

  test('gera console.html', () => {
    expect(fs.existsSync(path.join(PAGES_DIR, 'console.html'))).toBe(true)
  })

  test('gera ghost.html', () => {
    expect(fs.existsSync(path.join(PAGES_DIR, 'ghost.html'))).toBe(true)
  })

  test('index.html contém estrutura válida', () => {
    const html = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf-8')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
    expect(html).toContain('IFIX')
  })

  test('index.html não contém tracking em modo teste', () => {
    const html = fs.readFileSync(path.join(PAGES_DIR, 'index.html'), 'utf-8')
    expect(html).not.toContain('freeipapi.com')
  })

  test('console.html contém noindex', () => {
    const html = fs.readFileSync(path.join(PAGES_DIR, 'console.html'), 'utf-8')
    expect(html).toContain('noindex')
  })

  test('ghost.html seta cookie', () => {
    const html = fs.readFileSync(path.join(PAGES_DIR, 'ghost.html'), 'utf-8')
    expect(html).toContain('ghost=true')
  })
})
