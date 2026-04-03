#!/usr/bin/env bash
# 与 skills/smart-ask-data/references/json2plot.md 配套；需 python3 组装 JSON。
set -euo pipefail

usage() {
  echo "Usage: $0 -t <token> -k <tool_result_cache_key> [-c Pie|Line|Column] [-f data_field] [-g group_by_csv]" >&2
  echo "       [-i title] [-S session_id] [-b base_url] [-d x_business_domain] [-T timeout_sec] [-o out.json] [-K]" >&2
  echo "  -K  curl --insecure（跳过 TLS 校验）" >&2
  exit 1
}

TOKEN="${JSON2PLOT_TOKEN:-${TEXT2SQL_TOKEN:-}}"
TOOL_RESULT_CACHE_KEY="${TOOL_RESULT_CACHE_KEY:-}"
CHART_TYPE="${CHART_TYPE:-Pie}"
DATA_FIELD="${DATA_FIELD:-amount}"
GROUP_BY="${GROUP_BY:-region_name}"
TITLE="${TITLE:-各区域销售额占比}"
SESSION_ID="${SESSION_ID:-550e8400-e29b-41d4-a716-446655440002}"
SESSION_TYPE="${SESSION_TYPE:-redis}"
BASE_URL="${BASE_URL:-https://dip-poc.aishu.cn}"
URL_PATH="/api/af-sailor-agent/v1/assistant/tools/json2plot"
X_BD="${X_BUSINESS_DOMAIN:-bd_public}"
TIMEOUT_SEC="${TIMEOUT_SEC:-120}"
OUT_FILE=""
INSECURE=0

while getopts "ht:k:c:f:g:i:S:b:d:T:o:K" opt; do
  case "$opt" in
    h) usage ;;
    t) TOKEN="$OPTARG" ;;
    k) TOOL_RESULT_CACHE_KEY="$OPTARG" ;;
    c) CHART_TYPE="$OPTARG" ;;
    f) DATA_FIELD="$OPTARG" ;;
    g) GROUP_BY="$OPTARG" ;;
    i) TITLE="$OPTARG" ;;
    S) SESSION_ID="$OPTARG" ;;
    b) BASE_URL="$OPTARG" ;;
    d) X_BD="$OPTARG" ;;
    T) TIMEOUT_SEC="$OPTARG" ;;
    o) OUT_FILE="$OPTARG" ;;
    K) INSECURE=1 ;;
    *) usage ;;
  esac
done

if [[ -z "$TOKEN" || -z "$TOOL_RESULT_CACHE_KEY" ]]; then
  usage
fi

if [[ "$CHART_TYPE" != "Pie" && "$CHART_TYPE" != "Line" && "$CHART_TYPE" != "Column" ]]; then
  echo "chart_type 仅支持 Pie/Line/Column" >&2
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "需要 python3 以组装 json2plot 请求体。" >&2
  exit 2
fi

JSON_BODY="$(
  CHART_TYPE="$CHART_TYPE" DATA_FIELD="$DATA_FIELD" GROUP_BY="$GROUP_BY" \
  TITLE="$TITLE" SESSION_ID="$SESSION_ID" SESSION_TYPE="$SESSION_TYPE" \
  TOOL_RESULT_CACHE_KEY="$TOOL_RESULT_CACHE_KEY" TIMEOUT_SEC="$TIMEOUT_SEC" TOKEN="$TOKEN" \
  python3 -c '
import json, os
group_by = [x.strip() for x in os.environ["GROUP_BY"].split(",") if x.strip()]
body = {
  "chart_type": os.environ["CHART_TYPE"],
  "data_field": os.environ["DATA_FIELD"],
  "group_by": group_by,
  "session_id": os.environ["SESSION_ID"],
  "session_type": os.environ["SESSION_TYPE"],
  "title": os.environ["TITLE"],
  "tool_result_cache_key": os.environ["TOOL_RESULT_CACHE_KEY"],
  "timeout": int(os.environ["TIMEOUT_SEC"]),
  "auth": {"token": os.environ["TOKEN"]},
}
print(json.dumps(body, ensure_ascii=False))
')"

URI="${BASE_URL%/}${URL_PATH}"
CURL_EXTRA=()
if [[ "$INSECURE" -eq 1 ]]; then
  CURL_EXTRA+=(-k)
fi

RESPONSE="$(
  curl -sS "${CURL_EXTRA[@]}" -X POST "$URI" \
    -H "Content-Type: application/json; charset=utf-8" \
    -H "x-business-domain: ${X_BD}" \
    -H "Authorization: ${TOKEN}" \
    --max-time $((TIMEOUT_SEC + 120)) \
    --data-binary "$JSON_BODY"
)"

if [[ -n "$OUT_FILE" ]]; then
  printf '%s\n' "$RESPONSE" >"$OUT_FILE"
fi

printf '%s\n' "$RESPONSE"
