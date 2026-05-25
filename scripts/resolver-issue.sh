#!/bin/bash
# Resolve uma issue do InvestPop seguindo o fluxo completo
# Uso: ./scripts/resolver-issue.sh <numero_issue>
#
# Requer: kiro-cli (brew install amazon-q) com trust mode
#
# O que faz:
# 1. Lê a issue do GitHub
# 2. Passa para o Amazon Q CLI resolver seguindo .amazonq/rules/

ISSUE=$1

if [ -z "$ISSUE" ]; then
  echo "Uso: ./scripts/resolver-issue.sh <numero_issue>"
  exit 1
fi

source ~/.nvm/nvm.sh && nvm use 20

cd "$(dirname "$0")/.."

echo "📋 Resolvendo issue #$ISSUE..."

TITLE=$(gh issue view $ISSUE --json title -q .title)
BODY=$(gh issue view $ISSUE --json body -q .body)

echo "Título: $TITLE"
echo "---"

kiro-cli chat --trust-all -m "Resolve a issue #$ISSUE do projeto InvestPop seguindo o fluxo em .amazonq/rules/fluxo-issues.md. Issue: $TITLE. Descrição: $BODY. Executa todos os 7 passos sem pedir confirmação."
