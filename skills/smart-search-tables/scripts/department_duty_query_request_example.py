#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调用 department_duty_query（部门职责）assistant 工具接口。

与 skills/smart-search-tables/references/department-duty-query.md 对齐：
请求体为直传 JSON：auth、query、kn_id。
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
DEFAULT_URL_PATH = "/api/af-sailor-agent/v1/assistant/tools/department_duty_query"
DEFAULT_X_BUSINESS_DOMAIN = "bd_public"
DEFAULT_KN_ID = "duty"
DEFAULT_QUERY = "信息技术部在企业数据资产目录与指标口径管理中的职责是什么？与采购订单类宽表治理有何关系？"


def main() -> int:
    p = argparse.ArgumentParser(description="POST department_duty_query")
    p.add_argument("--token", "-t", default=os.environ.get("DDQ_TOKEN", "").strip())
    p.add_argument("--query", "-q", default=DEFAULT_QUERY)
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

    token = args.token.strip()
    if not token:
        print("error: missing token (--token or DDQ_TOKEN)", file=sys.stderr)
        return 2

    base_url = args.base_url.rstrip("/")
    url_path = args.url_path if args.url_path.startswith("/") else "/" + args.url_path
    kn_id = args.kn_id
    x_bd = args.x_business_domain

    trace_id = args.trace_id.strip() or str(uuid.uuid4())
    payload = {"auth": {"token": token}, "query": args.query, "kn_id": "menu_kg_dept_infosystem_duty"}
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
