#!/usr/bin/env bash
set -euo pipefail

BASE_URL="http://127.0.0.1:8001"

echo "Checking /healthz..."
curl -fsS "$BASE_URL/healthz" | jq || true

echo "Checking / ..."
curl -fsS "$BASE_URL/" | head -n 5 || true

echo "POST /api/chat..."
curl -fsS -X POST "$BASE_URL/api/chat" -H 'Content-Type: application/json' -d '{"message":"smoke"}' | jq || true

echo "Smoke test completed"
