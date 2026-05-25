#!/bin/bash
set -e

echo "======================================"
echo "  Talent-Acquisition Update Script"
echo "  $(date)"
echo "======================================"

cd ~/talent-acquisition

echo "==> Pulling latest code from GitHub..."
git pull origin main

echo "==> Rebuilding containers..."
docker compose build --no-cache

echo "==> Restarting services..."
docker compose up -d

echo "==> Waiting for backend to be ready..."
sleep 10

echo "==> Checking running containers..."
docker compose ps

echo "======================================"
echo "  Update complete!"
echo "  Frontend: http://196.189.117.188:3018"
echo "  Backend:  http://196.189.117.188:8034"
echo "======================================"
