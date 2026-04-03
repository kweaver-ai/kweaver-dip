#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调用 department_duty_query（部门职责）assistant 工具接口。

与 skills/smart-search-tables/references/department-duty-query.md 对齐：
请求体为直传 JSON：auth、query、kn_id。

token 获取顺序：命令行参数（位置 / `--token`）→ 环境变量 `DDQ_TOKEN` → `kweaver token` / `npx kweaver token` 主动获取。
"""

import argparse
import json
import os
import shutil
import ssl
import subprocess
import sys
import urllib.error
import urllib.request
import uuid
from typing import Any


DEFAULT_BASE_URL = "https://dip-poc.aishu.cn"
DEFAULT_URL_PATH = "/api/af-sailor-agent/v1/assistant/tools/department_duty_query"
DEFAULT_X_BUSINESS_DOMAIN = "bd_public"
DEFAULT_KN_ID = "duty"
DEFAULT_QUERY = "信息技术部在企业数据资产目录与指标口径管理中的职责是什么？与采购订单类宽表治理有何关系？"


def _get_token_fallback() -> str:
    """
    当未从参数/环境变量拿到 token 时，主动调用 `kweaver token` 或 `npx kweaver token` 获取。
    在 Windows 上使用 CREATE_NO_WINDOW 避免弹出控制台窗口。
    """
    creationflags = 0
    if sys.platform == "win32":
        creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)

    kw: dict[str, Any] = {
        "capture_output": True,
        "text": True,
        "timeout": 120.0,
        "encoding": "utf-8",
        "errors": "replace",
    }
    if creationflags:
        kw["creationflags"] = creationflags

    exe = shutil.which("kweaver")
    if exe:
        r = subprocess.run([exe, "token"], **kw)
        if r.returncode == 0 and r.stdout.strip():
            return r.stdout.strip().splitlines()[0]

    npx = shutil.which("npx")
    if npx:
        r = subprocess.run([npx, "--yes", "kweaver", "token"], **kw)
        if r.returncode == 0 and r.stdout.strip():
            return r.stdout.strip().splitlines()[0]

    return ""


def main() -> int:
    p = argparse.ArgumentParser(description="POST department_duty_query")
    # 支持外部输入参数（与 query_object_instance.py 一致）：
    #   python department_duty_query_request_example.py <token> <query>
    # 或：
    #   python department_duty_query_request_example.py --token <token> --query "<query>"
    p.add_argument("token", nargs="?", default="")
    p.add_argument("query", nargs="?", default="")
    p.add_argument("--token", "-t", dest="token_opt", default="")
    p.add_argument("--query", "-q", dest="query_opt", default="")
    p.add_argument("--kn-id", "-k", default=DEFAULT_KN_ID)
    p.add_argument("--base-url", "-b", default=DEFAULT_BASE_URL)
    p.add_argument("--url-path", default=DEFAULT_URL_PATH)
    p.add_argument("--x-business-domain", "-d", default=DEFAULT_X_BUSINESS_DOMAIN)
    p.add_argument("--trace-id", default="")
    p.add_argument("--config", "-c", default="", help="读取 smart-search-tables/config.json")
    p.add_argument("--insecure", action="store_true")
    p.add_argument("--timeout", type=float, default=120.0)
    p.add_argument("--out", "-o", default="")
    args = p.parse_args()

    token_env = os.environ.get("DDQ_TOKEN", "")
    token = (
        (args.token_opt or "").strip()
        or (args.token or "").strip()
        or token_env.strip()
    )
    if not token:
        token = _get_token_fallback()
    if not token:
        print(
            "error: missing token (--token / DDQ_TOKEN / kweaver token)",
            file=sys.stderr,
        )
        return 2

    base_url = args.base_url.rstrip("/")
    url_path = args.url_path if args.url_path.startswith("/") else "/" + args.url_path
    kn_id = args.kn_id
    x_bd = args.x_business_domain

    query = (args.query_opt or "").strip() or (args.query or "").strip() or DEFAULT_QUERY
    trace_id = args.trace_id.strip() or str(uuid.uuid4())
    payload = {"auth": {"token": token}, "query": query, "kn_id": "menu_kg_dept_infosystem_duty"}
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")

    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "x-business-domain": x_bd,
        "Authorization": token,
        "x-trace-id": trace_id,
    }
    url = base_url + url_path

    ctx: ssl.SSLContext | None = None
    if args.insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    print(body)

    req = urllib.request.Request(url, data=body, method="POST", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=args.timeout, context=ctx) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code} {e.reason}\n{e.read().decode('utf-8', errors='replace')}", file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print(f"request failed: {e.reason}", file=sys.stderr)
        return 1

    try:
        data = json.loads(raw.decode("utf-8"))
        text = json.dumps(data, ensure_ascii=False, indent=4)
    except Exception:
        text = raw.decode("utf-8", errors="replace")

    print(text)
    if args.out:
        with open(args.out, "w", encoding="utf-8", newline="\n") as f:
            f.write(text)
            if not text.endswith("\n"):
                f.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
