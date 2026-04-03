#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调用 execute_code_sync（同步执行代码）接口。

与 references/execute-code-sync.md、config.json → tools.execute_code_sync 一致：
Query 传 poll_interval / sync_timeout，Body 传 code/language/event 等。
"""

import argparse
import json
import os
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from typing import Any

DEFAULT_BASE_URL = "https://dip-poc.aishu.cn"
DEFAULT_URL_PATH = "/api/v1/executions/sessions/sess-agent-default/execute-sync"
DEFAULT_X_BUSINESS_DOMAIN = "bd_public"
DEFAULT_SESSION_ID = "sess-ask-data-001"

DEFAULT_CODE = """from typing import Dict, Any, List

def handler(event: Dict[str, Any]) -> Any:
    rows: List[dict] = event.get("rows", [])
    total = sum(float(r.get("amount", 0) or 0) for r in rows)
    out = []
    for r in rows:
        amt = float(r.get("amount", 0) or 0)
        out.append({**r, "ratio": round(amt / total, 4) if total else 0})
    return {"rows": out, "total_amount": total}
"""

DEFAULT_EVENT = {
    "rows": [
        {"region_name": "华东", "amount": 1200000},
        {"region_name": "华北", "amount": 800000},
    ]
}


def _token_from_env() -> str:
    return (
        os.environ.get("EXECUTE_CODE_SYNC_TOKEN", "").strip()
        or os.environ.get("TEXT2SQL_TOKEN", "").strip()
        or os.environ.get("KN_SELECT_TOKEN", "").strip()
    )


def _load_config(path: str) -> dict[str, Any]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _load_json_file(path: str) -> Any:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _load_text(path: str) -> str:
    with open(path, encoding="utf-8") as f:
        return f.read()


def main() -> int:
    p = argparse.ArgumentParser(description="POST execute_code_sync.")
    p.add_argument("--token", "-t", default=_token_from_env())
    p.add_argument("--session-id", "-S", default=DEFAULT_SESSION_ID)
    p.add_argument("--new-session", action="store_true")
    p.add_argument("--language", "-l", default="python", choices=("python", "javascript", "shell"))
    p.add_argument("--code", default="", help="直接传入 code 文本")
    p.add_argument("--code-file", default="", help="从文件读取 code")
    p.add_argument("--event", default="", help="直接传入 event JSON 字符串")
    p.add_argument("--event-file", default="", help="从文件读取 event JSON")
    p.add_argument("--timeout", "-T", type=int, default=120, help="body.timeout")
    p.add_argument("--poll-interval", type=float, default=0.5)
    p.add_argument("--sync-timeout", type=int, default=300)
    p.add_argument("--session-type", default="redis")
    p.add_argument("--base-url", "-b", default=DEFAULT_BASE_URL)
    p.add_argument("--url-path", default=DEFAULT_URL_PATH)
    p.add_argument("--x-business-domain", "-d", default=DEFAULT_X_BUSINESS_DOMAIN)
    p.add_argument(
        "--config",
        default="",
        help="可选：读取 base_url、tools.execute_code_sync.url_path、defaults.x_business_domain",
    )
    p.add_argument("--insecure", action="store_true")
    p.add_argument("--out", "-o", default="")
    args = p.parse_args()

    token = args.token.strip()
    if not token:
        print(
            "error: 缺少 token（--token 或环境变量 EXECUTE_CODE_SYNC_TOKEN / TEXT2SQL_TOKEN / KN_SELECT_TOKEN）",
            file=sys.stderr,
        )
        return 2

    code = args.code
    if args.code_file:
        code = _load_text(args.code_file)
    if not code.strip():
        code = DEFAULT_CODE

    event_data: Any = DEFAULT_EVENT
    if args.event:
        event_data = json.loads(args.event)
    if args.event_file:
        event_data = _load_json_file(args.event_file)

    base_url = args.base_url.rstrip("/")
    url_path = args.url_path if args.url_path.startswith("/") else "/" + args.url_path
    if args.config:
        cfg = _load_config(args.config)
        base_url = str(cfg.get("base_url", base_url)).rstrip("/")
        ecs = (cfg.get("tools") or {}).get("execute_code_sync") or {}
        if ecs.get("url_path"):
            url_path = str(ecs["url_path"])
            if not url_path.startswith("/"):
                url_path = "/" + url_path
        dom = (cfg.get("defaults") or {}).get("x_business_domain")
        if dom:
            args.x_business_domain = str(dom)

    session_id = str(uuid.uuid4()) if args.new_session else args.session_id
    payload: dict[str, Any] = {
        "auth": {"token": token},
        "session_id": session_id,
        "code": code,
        "language": args.language,
        "timeout": args.timeout,
        "event": event_data,
        "stream": False,
        "config": {"background": "", "session_type": args.session_type},
    }

    query = urllib.parse.urlencode(
        {"poll_interval": str(args.poll_interval), "sync_timeout": str(args.sync_timeout)}
    )
    url = base_url + url_path + ("&" if "?" in url_path else "?") + query

    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
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
        with urllib.request.urlopen(req, timeout=max(args.sync_timeout + 60, 120), context=ctx) as resp:
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
