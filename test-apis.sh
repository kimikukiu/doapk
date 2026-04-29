#!/bin/bash
cd /root/doapk

# Kill any existing server
pkill -f "tsx server.ts" 2>/dev/null
sleep 1

# Start server in background
node_modules/.bin/tsx server.ts > /tmp/srv_script.log 2>&1 &
SPID=$!
echo "Server PID: $SPID"

# Wait for server to start (up to 15 seconds)
for i in {1..15}; do
  sleep 1
  if grep -q "running on" /tmp/srv_script.log 2>/dev/null; then
    echo "Server ready after $i seconds"
    break
  fi
  if [ $i -eq 15 ]; then
    echo "TIMEOUT: Server failed to start"
    cat /tmp/srv_script.log
    kill $SPID 2>/dev/null
    exit 1
  fi
done

echo ""
echo "=== Server Log ==="
cat /tmp/srv_script.log
echo ""

echo "=== Testing APIs ==="

# Test 1: Home page
echo "Test 1: GET /"
R1=$(curl -s -w "HTTP %{http_code}" http://localhost:3000/ 2>&1)
echo "$R1" | head -3
echo ""

# Test 2: Search API
echo "Test 2: GET /api/search?q=test"
R2=$(curl -s -w "HTTP %{http_code}" "http://localhost:3000/api/search?q=test" 2>&1)
echo "$R2" | head -2
echo ""

# Test 3: Scrape API
echo "Test 3: GET /api/scrape?url=https://example.com"
R3=$(curl -s -w "HTTP %{http_code}" "http://localhost:3000/api/scrape?url=https://example.com" 2>&1)
echo "$R3" | head -2
echo ""

# Test 4: Local Chat API
echo "Test 4: POST /api/local-chat"
R4=$(curl -s -w "HTTP %{http_code}" -X POST http://localhost:3000/api/local-chat -H "Content-Type: application/json" -d '{"message":"hello"}' 2>&1)
echo "$R4" | head -2
echo ""

# Test 5: Manus Chat API
echo "Test 5: POST /api/manus-chat"
R5=$(curl -s -w "HTTP %{http_code}" -X POST http://localhost:3000/api/manus-chat -H "Content-Type: application/json" -d '{"message":"hello","mode":"quick"}' 2>&1)
echo "$R5" | head -2
echo ""

# Kill server
kill $SPID 2>/dev/null
echo "=== Tests completed ==="
