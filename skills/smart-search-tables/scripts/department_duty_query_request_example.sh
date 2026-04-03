#!/usr/bin/env bash
# 与 skills/smart-search-tables/references/department-duty-query.md 配套；
# 自包含 curl 调用，不依赖仓库根其它脚本。
set -euo pipefail

usage() {
  echo "Usage: $0 -t <token> -q <query> [-n kn_id] [-b base_url] [-d x_business_domain] [-x trace_id] [-o out.json] [-k]" >&2
  echo "  -k  curl --insecure（跳过 TLS 校验）" >&2
  exit 1
}

TOKEN=""
QUERY=""
KN_ID="${KN_ID:-duty}"
BASE_URL="${BASE_URL:-https://dip-poc.aishu.cn}"
URL_PATH="/api/af-sailor-agent/v1/assistant/tools/department_duty_query"
X_BD="${X_BUSINESS_DOMAIN:-bd_public}"
TRACE_ID=""
OUT_FILE=""
INSECURE=0

while getopts "t:q:n:b:d:x:o:kh" opt; do
  case "$opt" in
    t) TOKEN="$OPTARG" ;;
    q) QUERY="$OPTARG" ;;
    n) KN_ID="$OPTARG" ;;
    b) BASE_URL="$OPTARG" ;;
    d) X_BD="$OPTARG" ;;
    x) TRACE_ID="$OPTARG" ;;
    o) OUT_FILE="$OPTARG" ;;
    k) INSECURE=1 ;;
    h|?) usage ;;
  esac
done

if [[ -z "$TOKEN" || -z "$QUERY" ]]; then
  usage
fi

if [[ -z "$TRACE_ID" ]]; then
  if command -v python3 >/dev/null 2>&1; then
    TRACE_ID="$(python3 -c 'import uuid; print(uuid.uuid4())')"
  elif command -v uuidgen >/dev/null 2>&1; then
    TRACE_ID="$(uuidgen)"
  else
    TRACE_ID="550e8400-e29b-41d4-a716-446655440000"
  fi
fi

URI="${BASE_URL%/}${URL_PATH}"

build_json() {
  if command -v python3 >/dev/null 2>&1; then
    TOKEN="$1" QUERY_TEXT="$2" KN="$3" python3 -c \
      'import json,os; print(json.dumps({"auth":{"token":os.environ["TOKEN"]},"query":os.environ["QUERY_TEXT"],"kn_id":os.environ["KN"]},ensure_ascii=False))'
    return
  fi
  if command -v jq >/dev/null 2>&1; then
    jq -n --arg t "$1" --arg q "$2" --arg k "$3" '{auth:{token:$t},query:$q,kn_id:$k}'
    return
  fi
  echo "需要 python3 或 jq 以正确转义 JSON（query 中可能含引号）。" >&2
  exit 2
}

JSON_BODY="$(build_json "$TOKEN" "$QUERY" "$KN_ID")"

CURL_EXTRA=()
if [[ "$INSECURE" -eq 1 ]]; then
  CURL_EXTRA+=(-k)
fi

echo "=== REQUEST URL ===" >&2
echo "$URI" >&2
echo "=== REQUEST BODY ===" >&2
echo "$JSON_BODY" >&2
echo "=== RESPONSE ===" >&2

RESPONSE="$(
  curl -sS "${CURL_EXTRA[@]}" -X POST "$URI" \
    -H "Content-Type: application/json; charset=utf-8" \
    -H "x-business-domain: ${X_BD}" \
    -H "Authorization: ${TOKEN}" \
    -H "x-trace-id: ${TRACE_ID}" \
    --data-binary "$JSON_BODY"
)"

if [[ -n "$OUT_FILE" ]]; then
  printf '%s\n' "$RESPONSE" >"$OUT_FILE"
  echo "=== WROTE === $OUT_FILE" >&2
fi

printf '%s\n' "$RESPONSE"
