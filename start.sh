#!/usr/bin/env bash
# Start backend and frontend together. Ctrl+C stops both.

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Colours
B='\033[1m'; R='\033[0;31m'; G='\033[0;32m'; Y='\033[0;33m'; N='\033[0m'

cleanup() {
  echo -e "\n${Y}Stopping...${N}"
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  wait "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  echo -e "${G}Done.${N}"
  exit 0
}
trap cleanup INT TERM

echo -e "${B}Starting backend...${N}"
(cd "$ROOT/backend" && npm run dev) &
BACKEND_PID=$!

echo -e "${B}Starting frontend...${N}"
(cd "$ROOT/frontend" && npx expo start) &
FRONTEND_PID=$!

echo -e "${G}Both running.${N} ${R}Ctrl+C${N} to stop.\n"
wait
