#!/bin/bash
# Auto App Generation — Start Script
# Launches both backend and frontend servers

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🤖 Auto App Generation — Starting servers..."
echo ""

# Check prerequisites
command -v gemini >/dev/null 2>&1 || { echo "❌ gemini CLI not found. Install: npm i -g @google/gemini-cli"; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "❌ claude CLI not found. Install: npm i -g @anthropic-ai/claude-code"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ python3 not found"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ node not found"; exit 1; }

echo "✅ gemini CLI: $(gemini --version 2>/dev/null | head -1)"
echo "✅ claude CLI:  $(claude --version 2>/dev/null | head -1)"
echo ""

# Install backend deps if needed
cd "$PROJECT_DIR/dashboard/backend"
pip3 install -q -r requirements.txt 2>/dev/null

# Install frontend deps if needed
cd "$PROJECT_DIR/dashboard/frontend"
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install --silent
fi

echo ""
echo "🚀 Starting Backend (FastAPI + Socket.IO) on http://localhost:8000"
cd "$PROJECT_DIR/dashboard/backend"
python3 -m uvicorn main:app_asgi --host 0.0.0.0 --port 8000 --reload --reload-dir . &
BACKEND_PID=$!

echo "🚀 Starting Frontend (Next.js) on http://localhost:3000"
cd "$PROJECT_DIR/dashboard/frontend"
npx next dev --port 3000 &
FRONTEND_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🤖 Auto App Generation is running!"
echo ""
echo "  Dashboard:  http://localhost:3000"
echo "  Backend:    http://localhost:8000"
echo "  API Docs:   http://localhost:8000/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Press Ctrl+C to stop both servers."
echo ""

# Trap Ctrl+C to kill both
cleanup() {
  echo ""
  echo "🛑 Stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "✅ Done."
}
trap cleanup SIGINT SIGTERM

wait
