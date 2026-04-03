#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
query_object_instance 可执行脚本（支持外部输入参数）。

用法（推荐）：
  python query_object_instance.py --token <TOKEN> --search "企业"
或（位置参数）：
  python query_object_instance.py <TOKEN> "企业"

说明：
- token 获取顺序：命令行参数（位置 / `--token`）→ 环境变量 `QOI_TOKEN` → `kweaver token` / `npx kweaver token` 主动获取。
- 其余参数保留默认值，可按需覆盖。
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
from typing import Any


DEFAULT_BASE_URL = "https://dip-poc.aishu.cn"
DEFAULT_URL_PATH = "/api/agent-operator-integration/v1/tool-box/db4da399-af91-4214-afd9-1762d07c942d/tool/0f2b2b86-8af3-4fcc-9d8f-810a4f3fa6ce/debug"
DEFAULT_X_BD = "bd_public"
DEFAULT_KN_ID = "idrm_metadata_kn_object_lbb"
DEFAULT_OT_ID = "metadata"
DEFAULT_ACCOUNT_ID = "f6713976-1cf6-11f1-b2cd-d6e9efdbcbb2"
DEFAULT_ACCOUNT_TYPE = "user"


def _pick(value: str, fallback: str) -> str:
    v = (value or "").strip()
    return v if v else (fallback or "").strip()


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
    p = argparse.ArgumentParser(description="POST query_object_instance tool-box debug")

    # 位置参数（你说的第 31/32 行参数）：token、search
    p.add_argument("token", nargs="?", default="")
    p.add_argument("search", nargs="?", default="")

    # 兼容 flags：外部也可用 --token/--search 传参
    p.add_argument("--token", "-t", dest="token_opt", default="")
    p.add_argument("--search", "-s", dest="search_opt", default="")

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

    # 先看参数，再看环境变量，最后主动调用 kweaver/npx 获取
    token_env = os.environ.get("QOI_TOKEN", "")
    token = _pick(args.token_opt, _pick(args.token, token_env))
    if not token:
        token = _get_token_fallback()
    search = _pick(args.search_opt, _pick(args.search, "企业"))

    if not token:
        print(
            "error: missing token (positional / --token / QOI_TOKEN / kweaver token)",
            file=sys.stderr,
        )
        return 2

    base_url = args.base_url.rstrip("/")
    url_path = args.url_path if args.url_path.startswith("/") else "/" + args.url_path
    url = base_url + url_path


    payload = {
        "body": {
            "auth": {"token": token},
            "limit": args.limit,
            "need_total": False,
            "properties": ["embeddings_text"],
            "sort": [{"direction": "", "field": ""}],
            "condition": {
                "operation": "or",
                "sub_conditions": [
                    {"field": "embeddings_text", "operation": "match", "value": search},
                    {
                        "limit_value": args.knn_limit_value,
                        "field": "embeddings_text",
                        "operation": "knn",
                        "value": search,
                        "limit_key": "k",
                    },
                ],
            },
        },
        "query": {
            "kn_id": args.kn_id,
            "ot_id": args.ot_id,
            "include_logic_params": False,
            "include_type_info": False,
        },
        "header": {
            "x-account-id": args.account_id,
            "x-account-type": args.account_type,
        },
    }

    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", token)
    req.add_header("x-business-domain", args.x_business_domain)

    ctx = None
    if args.insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

    try:
        with urllib.request.urlopen(req, timeout=args.timeout, context=ctx) as resp:
            resp_bytes = resp.read()
            text = resp_bytes.decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace") if hasattr(e, "read") else ""
        print(f"error: HTTP {e.code} {e.reason}", file=sys.stderr)
        if err_body:
            print(err_body, file=sys.stderr)
        return 3
    except Exception as e:
        print(f"error: {e}", file=sys.stderr)
        return 4

    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(text)
    else:
        print(text)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
