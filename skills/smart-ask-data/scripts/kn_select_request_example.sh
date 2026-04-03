#!/usr/bin/env bash
# 与 skills/smart-ask-data/references/kn-select.md 配套；自包含 curl，不依赖仓库根其它脚本。
set -euo pipefail

usage() {
  echo "Usage: $0 -t <token> -q <query> [-i kn_id1,kn_id2,...] [-b base_url] [-d x_business_domain] [-o out.json] [-k]" >&2
  echo "  -i  逗号分隔候选 kn_id，默认与 config tools.kn_select.kn_ids 一致（问数勿含 forbidden_ask_data_kn_ids）" >&2
  echo "  -k  curl --insecure（跳过 TLS 校验）" >&2
  exit 1
}

TOKEN=""
QUERY=""
KN_IDS_CSV="${KN_IDS_CSV:-d71o5e1e8q1nr9l7mb80}"
BASE_URL="${BASE_URL:-https://dip-poc.aishu.cn}"
URL_PATH="/api/af-sailor-agent/v1/assistant/tools/kn_select"
X_BD="${X_BUSINESS_DOMAIN:-bd_public}"
OUT_FILE=""
INSECURE=0

while getopts "t:q:i:b:d:o:kh" opt; do
  case "$opt" in
    t) TOKEN="$OPTARG" ;;
    q) QUERY="$OPTARG" ;;
    i) KN_IDS_CSV="$OPTARG" ;;
    b) BASE_URL="$OPTARG" ;;
    d) X_BD="$OPTARG" ;;
    o) OUT_FILE="$OPTARG" ;;
    k) INSECURE=1 ;;
    h|?) usage ;;
  esac
done

if [[ -z "$TOKEN" || -z "$QUERY" ]]; then
  usage
fi

URI="${BASE_URL%/}${URL_PATH}"

build_json() {
  local token="$1" query_text="$2" csv="$3"
  if command -v python3 >/dev/null 2>&1; then
    TOKEN="$token" QUERY_TEXT="$query_text" KN_CSV="$csv" python3 -c \
      'import json,os
ids=[x.strip() for x in os.environ["KN_CSV"].split(",") if x.strip()]
print(json.dumps({"auth":{"token":os.environ["TOKEN"]},"query":os.environ["QUERY_TEXT"],"kn_ids":ids},ensure_ascii=False))'
    return
  fi
  echo "需要 python3 以正确组装 kn_ids 数组并转义 query。" >&2
  exit 2
}

JSON_BODY="$(build_json "$TOKEN" "$QUERY" "$KN_IDS_CSV")"

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
    --data-binary "$JSON_BODY"
)"

if [[ -n "$OUT_FILE" ]]; then
  printf '%s\n' "$RESPONSE" >"$OUT_FILE"
  echo "=== WROTE === $OUT_FILE" >&2
fi

printf '%s\n' "$RESPONSE"
