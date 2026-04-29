#!/usr/bin/env bash
set -euo pipefail

DOMAIN="vizuden.com"

# 팀 프로젝트 production 배포
out="$(vercel --prod --yes 2>&1)"
echo "$out"

echo "✅  Done: https://$DOMAIN"
echo "(vizuden.com이 Vercel Production Domain으로 등록돼 있으면 alias 불필요)"
