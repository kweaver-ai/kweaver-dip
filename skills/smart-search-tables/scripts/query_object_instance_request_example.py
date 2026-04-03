#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调用 query_object_instance（对象实例检索）tool-box 调试接口。

与 skills/smart-search-tables/references/query-object-instance.md 对齐：
请求体必须是三层结构：body + query + header。
"""

import argparse
import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from typing import Any


DEFAULT_BASE_URL = "https://dip-poc.aishu.cn"
DEFAULT_URL_PATH = "/api/agent-operator-integration/v1/tool-box/db4da399-af91-4214-afd9-1762d07c942d/tool/0f2b2b86-8af3-4fcc-9d8f-810a4f3fa6ce/debug"
DEFAULT_X_BD = "bd_public"
DEFAULT_KN_ID = "idrm_metadata_kn_object_lbb"
DEFAULT_OT_ID = "metadata"
DEFAULT_ACCOUNT_ID = "f6713976-1cf6-11f1-b2cd-d6e9efdbcbb2"
DEFAULT_ACCOUNT_TYPE = "user"


def main() -> int:
    p = argparse.ArgumentParser(description="POST query_object_instance tool-box debug")
    p.add_argument("--token", "-t", default=os.environ.get("QOI_TOKEN", "").strip())
    p.add_argument("--search", "-s", default="企业")
    p.add_argument("--limit", "-L", type=int, default=100)
    p.add_argument("--knn-limit-value", type=int, default=1000)
    p.add_argument("--kn-id", "-k", default=DEFAULT_KN_ID)
    p.add_argument("--ot-id", default=DEFAULT_OT_ID)
    p.add_argument("--account-id", default=DEFAULT_ACCOUNT_ID)
    p.add_argument("--account-type", default=DEFAULT_ACCOUNT_TYPE)
    p.add_argument("--base-url", "-b", default=DEFAULT_BASE_URL)
    p.add_argument("--url-path", default=DEFAULT_URL_PATH)
    p.add_argument("--x-business-domain", "-d", default=DEFAULT_X_BD)
    p.add_argument("--insecure", action="store_true")
    p.add_argument("--timeout", type=float, default=120.0)
    p.add_argument("--out", "-o", default="")
    args = p.parse_args()

    token = args.token.strip()
    if not token:
        print("error: missing token (--token or QOI_TOKEN)", file=sys.stderr)
        return 2

    base_url = args.base_url.rstrip("/")
    url_path = args.url_path if args.url_path.startswith("/") else "/" + args.url_path
    x_bd = args.x_business_domain
    kn_id = args.kn_id
    ot_id = args.ot_id
    account_id = args.account_id
    account_type = args.account_type


    payload = {
        "body": {
            "auth": {"token": token},
            "limit": args.limit,
            "need_total": True,
            "properties": ["embeddings_text"],
            "sort": [{"direction": "", "field": ""}],
            "condition": {
                "operation": "or",
                "sub_conditions": [
                    {"field": "embeddings_text", "operation": "match", "value": args.search},
                    {
                        "limit_value": args.knn_limit_value,
                        "field": "embeddings_text",
                        "operation": "knn",
                        "value": args.search,
                        "limit_key": "k",
                    },
                ],
            },
        },
        "query": {
            "kn_id": kn_id,
            "ot_id": ot_id,
            "include_logic_params": False,
            "include_type_info": False,
        },
        "header": {
            "x-account-id": account_id,
            "x-account-type": account_type,
        },
    }

    headers = {
        "Content-Type": "application/json; charset=utf-8",
        "x-business-domain": x_bd,
        "Authorization": token,
    }
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    url = base_url + url_path

    ctx: ssl.SSLContext | None = None
    if args.insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

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
        text = json.dumps(data, ensure_ascii=False, indent=2)
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
