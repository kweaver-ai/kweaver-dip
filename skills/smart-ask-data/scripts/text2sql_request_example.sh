#!/usr/bin/env bash
# 与 skills/smart-ask-data/references/text2sql.md 配套；自包含 curl；需 python3 组装 JSON。
# -k kn_id 不得为 config tools.kn_select.forbidden_ask_data_kn_ids（元数据 KN 等）。
set -euo pipefail

usage() {
  echo "Usage: $0 -a show_ds|gen_exec -t <token> [-k kn_id] [-u user_id] [-S session_id] [-i input] [-g background]" >&2
  echo "       [-b base_url] [-d x_business_domain] [-L return_data_limit] [-R return_record_limit] [-T timeout_sec] [-o out.json] [-K]" >&2
  echo "  -K  curl --insecure（跳过 TLS 校验）" >&2
  echo "  gen_exec 时请用 -g 传入 show_ds 产出的 background；session_id 是否复用由平台约定决定。" >&2
  exit 1
}

ACTION=""
TOKEN=""
KN_ID="${KN_ID:-d71o5e1e8q1nr9l7mb80}"
USER_ID="${USER_ID:-f6713976-1cf6-11f1-b2cd-d6e9efdbcbb2}"
SESSION_ID="${SESSION_ID:-550e8400-e29b-41d4-a716-446655440000}"
INPUT=""
BACKGROUND=""
DEFAULT_GEN_EXEC_BACKGROUND_TEMPLATE="候选表：{tables}。关键字段：{key_fields}。过滤与口径：{filters_and_caliber}。统计目标：{target_metric}。"
BASE_URL="${BASE_URL:-https://dip-poc.aishu.cn}"
URL_PATH="/api/af-sailor-agent/v1/assistant/tools/text2sql"
X_BD="${X_BUSINESS_DOMAIN:-bd_public}"
RETURN_DATA_LIMIT="${RETURN_DATA_LIMIT:-2000}"
RETURN_RECORD_LIMIT="${RETURN_RECORD_LIMIT:-20}"
TIMEOUT_SEC="${TIMEOUT_SEC:-120}"
OUT_FILE=""
INSECURE=0

while getopts "ha:t:k:u:S:i:g:b:d:L:R:T:o:K" opt; do
  case "$opt" in
    h) usage ;;
    a) ACTION="$OPTARG" ;;
    t) TOKEN="$OPTARG" ;;
    k) KN_ID="$OPTARG" ;;
    u) USER_ID="$OPTARG" ;;
    S) SESSION_ID="$OPTARG" ;;
    i) INPUT="$OPTARG" ;;
    g) BACKGROUND="$OPTARG" ;;
    b) BASE_URL="$OPTARG" ;;
    d) X_BD="$OPTARG" ;;
    L) RETURN_DATA_LIMIT="$OPTARG" ;;
    R) RETURN_RECORD_LIMIT="$OPTARG" ;;
    T) TIMEOUT_SEC="$OPTARG" ;;
    o) OUT_FILE="$OPTARG" ;;
    K) INSECURE=1 ;;
    *) usage ;;
  esac
done

if [[ -z "$ACTION" || -z "$TOKEN" ]]; then
  usage
fi
if [[ "$ACTION" != "show_ds" && "$ACTION" != "gen_exec" ]]; then
  echo "action 须为 show_ds 或 gen_exec" >&2
  exit 1
fi

if [[ -z "$INPUT" ]]; then
  if [[ "$ACTION" == "show_ds" ]]; then
    INPUT="销售域里做区域、月份统计可能用到哪些事实表和维度字段，列出表名与关键列"
  else
    INPUT="按区域汇总上月订单金额，并给出各区域占比"
  fi
fi

if [[ "$ACTION" == "show_ds" ]]; then
  BACKGROUND="${BACKGROUND:-}"
fi
if [[ "$ACTION" == "gen_exec" && -z "${BACKGROUND// }" ]]; then
  BACKGROUND="$DEFAULT_GEN_EXEC_BACKGROUND_TEMPLATE"
  echo "warn: gen_exec 未传 -g background，已回退为默认模板（请按实际 show_ds 结果替换占位符）。" >&2
fi

URI="${BASE_URL%/}${URL_PATH}"

if ! command -v python3 >/dev/null 2>&1; then
  echo "需要 python3 以组装 text2sql 请求体。" >&2
  exit 2
fi

JSON_BODY="$(
  ACTION="$ACTION" TOKEN="$TOKEN" KN_ID="$KN_ID" USER_ID="$USER_ID" SESSION_ID="$SESSION_ID" \
  INPUT="$INPUT" BACKGROUND="$BACKGROUND" \
  RDL="$RETURN_DATA_LIMIT" RRL="$RETURN_RECORD_LIMIT" TO="$TIMEOUT_SEC" \
  python3 -c '
import json, os
action = os.environ["ACTION"]
body = {
  "config": {
    "background": os.environ.get("BACKGROUND", ""),
    "return_data_limit": int(os.environ["RDL"]),
    "return_record_limit": int(os.environ["RRL"]),
    "session_id": os.environ["SESSION_ID"],
    "session_type": "redis",
  },
  "data_source": {"kn": [os.environ["KN_ID"]], "user_id": os.environ["USER_ID"]},
  "inner_llm": {
    "id": "1951511743712858112",
    "name": "deepseek_v3",
    "temperature": 0.1,
    "top_k": 1,
    "top_p": 1,
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "max_tokens": 20000,
  },
  "input": os.environ["INPUT"],
  "action": action,
  "timeout": int(os.environ["TO"]),
  "auth": {"token": os.environ["TOKEN"]},
}
print(json.dumps(body, ensure_ascii=False))
')"

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
    --max-time $((TIMEOUT_SEC + 120)) \
    --data-binary "$JSON_BODY"
)"

if [[ -n "$OUT_FILE" ]]; then
  printf '%s\n' "$RESPONSE" >"$OUT_FILE"
  echo "=== WROTE === $OUT_FILE" >&2
fi

printf '%s\n' "$RESPONSE"
