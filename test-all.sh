#!/bin/bash
cd /root/doapk

# Kill any existing server
pkill -f "tsx server.ts" 2>/dev/null
sleep 1

# Start server in background
nohup node_modules/.bin/tsx server.ts > /tmp/server_test.log 2>&1 &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Wait for server to start
sleep 6

# Check if server is running
if ! kill -0 $SERVER_PID 2>/dev/null; then
  echo "ERROR: Server failed to start"
  cat /tmp/server_test.log
  exit 1
fi

echo "=== Server Log ==="
cat /tmp/server_test.log
echo ""

echo "=== Testing API Routes ==="

# Test 1: Search API
echo "Test 1: GET /api/search?q=test"
curl -s -w "\nHTTP Status: %{http_code}\n" "http://localhost:3000/api/search?q=test" || echo "FAILED"
echo ""

# Test 2: Scrape API
echo "Test 2: GET /api/scrape?url=https://example.com"
curl -s -w "\nHTTP Status: %{http_code}\n" "http://localhost:3000/api/scrape?url=https://example.com" || echo "FAILED"
echo ""

# Test 3: Local Chat API
echo "Test 3: POST /api/local-chat"
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST "http://localhost:3000/api/local-chat" -H "Content-Type: application/json" -d '{"message":"hello"}' || echo "FAILED"
echo ""

# Test 4: Manus Chat API
echo "Test 4: POST /api/manus-chat"
curl -s -w "\nHTTP Status: %{http_code}\n" -X POST "http://localhost:3000/api/manus-chat" -H "Content-Type: application/json" -d '{"message":"hello","mode":"quick"}' || echo "FAILED"
echo ""

# Test 5: Home page
echo "Test 5: GET /"
curl -s -w "\nHTTP Status: %{http_code}\n" "http://localhost:3000/" | head -5 || echo "FAILED"
echo ""

# Kill server
kill $SERVER_PID 2>/dev/null
echo "Tests completed."
