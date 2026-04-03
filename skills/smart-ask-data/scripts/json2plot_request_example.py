#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调用 json2plot assistant 工具接口。

与 references/json2plot.md、config.json → tools.json2plot 一致。
优先传 tool_result_cache_key（来自 text2sql/gen_exec），避免手写 data 与缓存键混用。
"""

import argparse
import json
import os
import ssl
import sys
import urllib.error
import urllib.request
import uuid
from typing import Any

DEFAULT_BASE_URL = "https://dip-poc.aishu.cn"
DEFAULT_URL_PATH = "/api/af-sailor-agent/v1/assistant/tools/json2plot"
DEFAULT_X_BUSINESS_DOMAIN = "bd_public"
DEFAULT_SESSION_ID = "550e8400-e29b-41d4-a716-446655440002"
DEFAULT_TOOL_RESULT_CACHE_KEY = "t2sql_cache_01HZZZZZZZZZZZZZZZZZZZZZZ"


def _token_from_env() -> str:
    return (
        os.environ.get("JSON2PLOT_TOKEN", "").strip()
        or os.environ.get("TEXT2SQL_TOKEN", "").strip()
        or os.environ.get("KN_SELECT_TOKEN", "").strip()
    )


def _load_config(path: str) -> dict[str, Any]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    p = argparse.ArgumentParser(description="POST json2plot.")
    p.add_argument("--token", "-t", default=_token_from_env(), help="Authorization 与 body.auth.token")
    p.add_argument("--chart-type", "-c", default="Pie", choices=("Pie", "Line", "Column"))
    p.add_argument("--data-field", "-f", default="amount", help="度量字段")
    p.add_argument(
        "--group-by",
        "-g",
        default="region_name",
        help="逗号分隔字段列表，如 order_month,region_name",
    )
    p.add_argument("--title", "-i", default="各区域销售额占比", help="图表标题")
    p.add_argument(
        "--tool-result-cache-key",
        "-k",
        default=DEFAULT_TOOL_RESULT_CACHE_KEY,
        help="text2sql/gen_exec 返回的缓存键",
    )
    p.add_argument(
        "--session-id",
        "-S",
        default=DEFAULT_SESSION_ID,
        help="会话 ID；可复用 text2sql 会话",
    )
    p.add_argument("--new-session", action="store_true", help="生成新的 session_id（uuid4）")
    p.add_argument("--session-type", default="redis")
    p.add_argument("--timeout", "-T", type=int, default=120)
    p.add_argument("--base-url", "-b", default=DEFAULT_BASE_URL)
    p.add_argument("--url-path", default=DEFAULT_URL_PATH)
    p.add_argument("--x-business-domain", "-d", default=DEFAULT_X_BUSINESS_DOMAIN)
    p.add_argument(
        "--config",
        default="",
        help="可选：读取 base_url、tools.json2plot.url_path、defaults.x_business_domain",
    )
    p.add_argument("--insecure", action="store_true", help="跳过 TLS 证书校验")
    p.add_argument("--out", "-o", default="", help="响应 JSON 写入路径")
    args = p.parse_args()

    token = args.token.strip()
    if not token:
        print(
            "error: 缺少 token（--token 或环境变量 JSON2PLOT_TOKEN / TEXT2SQL_TOKEN / KN_SELECT_TOKEN）",
            file=sys.stderr,
        )
        return 2

    base_url = args.base_url.rstrip("/")
    url_path = args.url_path if args.url_path.startswith("/") else "/" + args.url_path
    if args.config:
        cfg = _load_config(args.config)
        base_url = str(cfg.get("base_url", base_url)).rstrip("/")
        j2p = (cfg.get("tools") or {}).get("json2plot") or {}
        if j2p.get("url_path"):
            url_path = str(j2p["url_path"])
            if not url_path.startswith("/"):
                url_path = "/" + url_path
        dom = (cfg.get("defaults") or {}).get("x_business_domain")
        if dom:
            args.x_business_domain = str(dom)

    session_id = str(uuid.uuid4()) if args.new_session else args.session_id
    group_by = [x.strip() for x in args.group_by.split(",") if x.strip()]

    payload: dict[str, Any] = {
        "chart_type": args.chart_type,
        "data_field": args.data_field,
        "group_by": group_by,
        "session_id": session_id,
        "session_type": args.session_type,
        "title": args.title,
        "tool_result_cache_key": args.tool_result_cache_key,
        "timeout": args.timeout,
        "auth": {"token": token},
    }

    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    url = base_url + url_path
    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "x-business-domain": args.x_business_domain,
        "Authorization": token,
    }

    ctx: ssl.SSLContext | None = None
    if args.insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, data=body, method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=180, context=ctx) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code} {e.reason}\n{e.read().decode('utf-8', errors='replace')}", file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print(f"request failed: {e.reason}", file=sys.stderr)
        return 1

    try:
        data = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        text = raw.decode("utf-8", errors="replace")
        print(text)
        return 0

    out_text = json.dumps(data, ensure_ascii=False, indent=2)
    print(out_text)
    if args.out:
        with open(args.out, "w", encoding="utf-8", newline="\n") as f:
            f.write(out_text)
            if not out_text.endswith("\n"):
                f.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
