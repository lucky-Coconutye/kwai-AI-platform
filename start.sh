#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

PORT="${PORT:-8080}"
HOST="${HOST:-127.0.0.1}"

if command -v node >/dev/null 2>&1; then
  PORT="$PORT" HOST="$HOST" node server.js
elif command -v python3 >/dev/null 2>&1; then
  DISPLAY_HOST="$HOST"
  if [ "$HOST" = "0.0.0.0" ]; then
    DISPLAY_HOST="127.0.0.1"
  fi
  echo "画像驱动 AI 回评 Demo 已启动：http://${DISPLAY_HOST}:${PORT}"
  if [ "$HOST" = "0.0.0.0" ]; then
    echo "局域网访问：使用本机局域网 IP + 端口 ${PORT}"
  fi
  echo "按 Ctrl+C 停止服务"
  python3 -m http.server "$PORT" --bind "$HOST"
else
  echo "未找到 Node.js 或 Python。请直接用浏览器打开 index.html。"
  exit 1
fi
