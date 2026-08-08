#!/usr/bin/env bash
# 미리크루즈 원클릭 배포 (Windows git bash에서 프로젝트 폴더에서 실행: bash deploy.sh)
# 빌드 → standalone에 static/public/env 복사 → 압축 → 서버 전송 → 재시작 → 확인
set -e

PEM="$HOME/desktop/lifeon.pem"
HOST="root@101.79.31.247"

echo "▶ 1/5 빌드 (npm run build)..."
npm run build

echo "▶ 2/5 standalone에 static·public·env 복사..."
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
cp .env.local .next/standalone/

echo "▶ 3/5 압축..."
tar -czf miri-standalone.tar.gz -C .next standalone

echo "▶ 4/5 서버 전송 (scp)..."
scp -i "$PEM" miri-standalone.tar.gz "$HOST":~/

echo "▶ 5/5 서버 배포 (압축해제 + 재시작)..."
ssh -i "$PEM" "$HOST" 'cd ~ && tar -xzf miri-standalone.tar.gz && systemctl restart miri && sleep 2 && echo "--- 새 빌드 확인(sitemap) ---" && curl -sI localhost:3000/sitemap.xml | head -1'

echo ""
echo "✅ 배포 완료. 브라우저는 시크릿창/강력새로고침(Ctrl+Shift+R)으로 확인하세요."
