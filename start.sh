#!/bin/bash
echo "Starting backend..."
npm run dev &
BACKEND_PID=$!

sleep 3

echo "Starting frontend..."
cd src/frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services running:"
echo "   Backend:  http://localhost:3000"
echo "   Frontend: http://localhost:8080"
echo ""

wait
