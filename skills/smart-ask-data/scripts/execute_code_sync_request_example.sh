#!/usr/bin/env bash
# 与 skills/smart-ask-data/references/execute-code-sync.md 配套；需 python3 组装 JSON。
set -euo pipefail

usage() {
  echo "Usage: $0 -t <token> [-S session_id] [-l python|javascript|shell] [-C code_file] [-E event_json_file]" >&2
  echo "       [-T timeout_sec] [--poll-interval n] [--sync-timeout n] [-b base_url] [-d x_business_domain] [-o out.json] [-K]" >&2
  echo "  默认 code/event 为文档样例；可用 -C/-E 覆盖。" >&2
  exit 1
}

TOKEN="${EXECUTE_CODE_SYNC_TOKEN:-${TEXT2SQL_TOKEN:-}}"
SESSION_ID="${SESSION_ID:-sess-ask-data-001}"
LANGUAGE="${LANGUAGE:-python}"
CODE_FILE=""
EVENT_FILE=""
TIMEOUT_SEC="${TIMEOUT_SEC:-120}"
POLL_INTERVAL="0.5"
SYNC_TIMEOUT="300"
BASE_URL="${BASE_URL:-https://dip-poc.aishu.cn}"
URL_PATH="/api/v1/executions/sessions/sess-agent-default/execute-sync"
X_BD="${X_BUSINESS_DOMAIN:-bd_public}"
OUT_FILE=""
INSECURE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage ;;
    -t) TOKEN="${2:-}"; shift 2 ;;
    -S) SESSION_ID="${2:-}"; shift 2 ;;
    -l) LANGUAGE="${2:-}"; shift 2 ;;
    -C) CODE_FILE="${2:-}"; shift 2 ;;
    -E) EVENT_FILE="${2:-}"; shift 2 ;;
    -T) TIMEOUT_SEC="${2:-}"; shift 2 ;;
    --poll-interval) POLL_INTERVAL="${2:-}"; shift 2 ;;
    --sync-timeout) SYNC_TIMEOUT="${2:-}"; shift 2 ;;
    -b) BASE_URL="${2:-}"; shift 2 ;;
    -d) X_BD="${2:-}"; shift 2 ;;
    -o) OUT_FILE="${2:-}"; shift 2 ;;
    -K) INSECURE=1; shift ;;
    *) echo "Unknown arg: $1" >&2; usage ;;
  esac
done

if [[ -z "$TOKEN" ]]; then
  usage
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "需要 python3 以组装 execute_code_sync 请求体。" >&2
  exit 2
fi

JSON_BODY="$(
  TOKEN="$TOKEN" SESSION_ID="$SESSION_ID" LANGUAGE="$LANGUAGE" TIMEOUT_SEC="$TIMEOUT_SEC" \
  CODE_FILE="$CODE_FILE" EVENT_FILE="$EVENT_FILE" \
  python3 - <<'PY'
import json
import os

default_code = """from typing import Dict, Any, List

def handler(event: Dict[str, Any]) -> Any:
    rows: List[dict] = event.get("rows", [])
    total = sum(float(r.get("amount", 0) or 0) for r in rows)
    out = []
    for r in rows:
        amt = float(r.get("amount", 0) or 0)
        out.append({**r, "ratio": round(amt / total, 4) if total else 0})
    return {"rows": out, "total_amount": total}
"""
default_event = {
    "rows": [
        {"region_name": "华东", "amount": 1200000},
        {"region_name": "华北", "amount": 800000},
    ]
}
code = default_code
event = default_event
if os.environ.get("CODE_FILE"):
    with open(os.environ["CODE_FILE"], encoding="utf-8") as f:
        code = f.read()
if os.environ.get("EVENT_FILE"):
    with open(os.environ["EVENT_FILE"], encoding="utf-8") as f:
        event = json.load(f)

body = {
    "auth": {"token": os.environ["TOKEN"]},
    "session_id": os.environ["SESSION_ID"],
    "code": code,
    "language": os.environ["LANGUAGE"],
    "timeout": int(os.environ["TIMEOUT_SEC"]),
    "event": event,
    "stream": False,
    "config": {"background": "", "session_type": "redis"},
}
print(json.dumps(body, ensure_ascii=False))
PY
)"

URI="${BASE_URL%/}${URL_PATH}?poll_interval=${POLL_INTERVAL}&sync_timeout=${SYNC_TIMEOUT}"
CURL_EXTRA=()
if [[ "$INSECURE" -eq 1 ]]; then
  CURL_EXTRA+=(-k)
fi

RESPONSE="$(
  curl -sS "${CURL_EXTRA[@]}" -X POST "$URI" \
    -H "Content-Type: application/json; charset=utf-8" \
    -H "x-business-domain: ${X_BD}" \
    -H "Authorization: ${TOKEN}" \
    --max-time $((SYNC_TIMEOUT + 120)) \
    --data-binary "$JSON_BODY"
)"

if [[ -n "$OUT_FILE" ]]; then
  printf '%s\n' "$RESPONSE" >"$OUT_FILE"
fi

printf '%s\n' "$RESPONSE"
