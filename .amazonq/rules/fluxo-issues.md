# Fluxo padrão para Issues - InvestPop

## Ao receber um pedido para criar bug ou enhancement:
1. Criar a issue no GitHub com `gh issue create`

## Ao receber um pedido para resolver uma issue (bug ou enhancement):

**IMPORTANTE: Executar TODOS os passos sequencialmente sem pedir confirmação entre eles.**

### Passo 1 — Criar teste que FALHA
- Adicionar teste automatizado em `tests/validacao-busca.js` (ou suite apropriada)
- O teste deve verificar exatamente o comportamento esperado após a correção
- Rodar o teste e confirmar que **falha** (TDD)
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
- `git push`

### Passo 5 — Gerar nova versão
- Atualizar `README.md` com a nova versão (vX.Y.Z)
- `git add README.md && git commit -m "docs: vX.Y.Z" && git tag vX.Y.Z && git push && git push --tags`

### Passo 6 — Deploy
- `gh workflow run gerar.yml`

### Passo 7 — Monitorar
- Verificar status a cada 60s até completar: `gh run view <ID> --json status,conclusion`
- Informar quando completou com sucesso

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
