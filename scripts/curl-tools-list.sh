#!/usr/bin/env bash
# Raw JSON-RPC tools/list sanity check (stateless — no session needed for listing tools)
curl -s -X POST http://localhost:3333/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "x-api-key: ${DESIGN_MCP_API_KEY:-poc-secret}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | head -c 4096
