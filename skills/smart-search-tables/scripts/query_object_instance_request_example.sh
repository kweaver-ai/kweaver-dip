#!/usr/bin/env bash
# 与本 skill 中 query-object-instance.md 配套；实际逻辑在仓库根 scripts/query_object_instance_request.sh。
# 在仓库根执行：./skills/smart-search-tables/scripts/query_object_instance_request_example.sh -s "企业" -k
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIR="$SCRIPT_DIR"
ROOT=""
while [[ "$DIR" != "/" ]]; do
  if [[ -f "$DIR/scripts/query_object_instance_request.sh" ]]; then
    ROOT="$DIR"
    break
  fi
  DIR="$(dirname "$DIR")"
done
if [[ -z "$ROOT" ]]; then
  echo "未找到仓库根下的 scripts/query_object_instance_request.sh（请从含该文件的仓库根使用）。" >&2
  exit 1
fi
exec "$ROOT/scripts/query_object_instance_request.sh" "$@"
