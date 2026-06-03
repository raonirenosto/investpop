# Fluxo padrão para Issues - InvestPop

<!-- ATUALIZAR QUANDO: mudar processo de deploy, adicionar nova suite de testes, ou mudar ferramentas (CLI, CI) -->

## Ao receber um pedido para criar bug ou enhancement:
1. Criar a issue no GitHub com `gh issue create`

## Ao receber um pedido para resolver uma issue (bug ou enhancement):

**IMPORTANTE: Executar TODOS os passos sequencialmente sem pedir confirmação entre eles.**

### Passo 1 — Criar teste que FALHA

**⛔ BLOQUEANTE: NÃO TOCAR em generators/, gerar.js, assets/ ou qualquer código de implementação ANTES deste passo estar completo e o teste falhando ter sido mostrado ao usuário.**

- Adicionar teste automatizado em `tests/validacao-busca.js` (ou suite apropriada)
- O teste deve verificar exatamente o comportamento esperado após a correção
- Rodar o teste e confirmar que **falha** (TDD)
- **MOSTRAR a saída com ❌ ao usuário** antes de prosseguir
- Numerar o teste sequencialmente e referenciar a issue: `(#N)`

### Passo 2 — Implementar a correção/feature
- Fazer a mudança mínima necessária no código
- Regenerar páginas com `node gerar.js --cache --teste --no-open`

### Passo 3 — Rodar testes
- Rodar a suite de testes: `node tests/validacao-busca.js`
- Confirmar que o novo teste **passa**
- Confirmar que todos os outros testes continuam passando

### Passo 4 — Commitar
- `git add -A`
- Commit com mensagem descritiva + `closes #N`
- Mencionar qual teste cobre a issue
- `git push origin main`
- **VERIFICAR** que subiu: `git log origin/main -1 --oneline` deve mostrar o commit recém feito
- Se não subiu, repetir `git push origin main` até confirmar

### Passo 5 — Gerar nova versão
- **OBRIGATÓRIO**: Sempre gerar nova versão após fechar issue(s)
- Se resolveu 1 issue: incrementar patch (ex: v1.4.0 → v1.4.1)
- Se resolveu várias issues de uma vez: incrementar minor (ex: v1.4.0 → v1.5.0)
- Se é uma feature major (nova seção, mudança grande): incrementar major (ex: v1.4.0 → v2.0.0)
- Atualizar `README.md` com a nova versão (vX.Y.Z) e resumo das issues
- Commitar, taguear e push (cada comando separado para garantir):
  ```
  git add README.md
  git commit -m "docs: vX.Y.Z"
  git tag vX.Y.Z
  git push origin main
  git push --tags
  ```
- **VERIFICAR** que subiu: `git log origin/main -1 --oneline`

### Passo 6 — Deploy
- `gh workflow run gerar.yml`

### Passo 7 — Monitorar
- **SEMPRE** monitorar até completar (nunca perguntar se deve monitorar)
- Verificar status a cada 60s até completar: `gh run view <ID> --json status,conclusion`
- Informar quando completou com sucesso
- Se falhar, investigar o erro imediatamente

## Comandos importantes:
- Sempre usar o comando que mostra output completo (sem filtros como `tail`, `grep`, `head`)
- Para gerar localmente rápido: `node gerar.js --cache --teste --no-open`
- Para gerar com dados reais: `node gerar.js --no-open --teste`
- Node 20 obrigatório: `source ~/.nvm/nvm.sh && nvm use 20`

## Testes disponíveis:
- `node tests/validacao-busca.js` — Busca, mobile, navegação, UI (~20s)
- `node tests/validacao-detalhes.js` — Páginas de detalhe dos 107 FIIs (~5s)
- `node tests/validacao-enhancements.js` — Enhancements específicos (~3s)
- `node tests/validacao-tops.js` — Rankings vs fontes externas (~10min, live APIs)
