#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
调用 kn_select（知识网络选择）assistant 工具接口。

与 references/kn-select.md、config.json → tools.kn_select 一致：
POST JSON：auth、query、kn_ids；请求头 x-business-domain、Authorization（与 auth.token 相同）。

示例（Linux/macOS Bash）：
  export TOKEN=$(kweaver token | tr -d '\\r\\n')
  python kn_select_request_example.py --token "$TOKEN" --query "销售域上月各区域销售额统计应选用哪个知识网络？" --insecure

示例（Windows PowerShell）：
  $env:KN_SELECT_TOKEN = (npx kweaver token 2>&1 | Out-String).Trim()
  python kn_select_request_example.py -q "销售域上月各区域销售额统计应选用哪个知识网络？" --insecure

示例（Windows CMD，仅 cmd.exe；PowerShell 勿用 set，见上节）：
  set KN_SELECT_TOKEN=<your-token>
  python kn_select_request_example.py -q "销售域上月各区域销售额统计应选用哪个知识网络？" --insecure

  python kn_select_request_example.py --token "$TOKEN" -q "..." --kn-ids id1,id2
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
DEFAULT_URL_PATH = "/api/af-sailor-agent/v1/assistant/tools/kn_select"
DEFAULT_X_BUSINESS_DOMAIN = "bd_public"
DEFAULT_KN_IDS = ["d71o5e1e8q1nr9l7mb80"]
DEFAULT_QUERY = (
    "销售域中需要查询上个月各区域销售额与订单量，目标是定位可用于统计的订单明细表与相关维度表"
)


def _parse_kn_ids(s: str) -> list[str]:
    return [x.strip() for x in s.split(",") if x.strip()]


def _load_config(path: str) -> dict[str, Any]:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main() -> int:
    p = argparse.ArgumentParser(description="POST kn_select (assistant tools gateway).")
    p.add_argument(
        "--token",
        "-t",
        default=os.environ.get("KN_SELECT_TOKEN", "").strip(),
        help="与 body.auth.token、Authorization 头一致；也可设环境变量 KN_SELECT_TOKEN",
    )
    p.add_argument("--query", "-q", default="", help="自然语言问数意图（body.query）")
    p.add_argument(
        "--kn-ids",
        "-k",
        default="",
        help="逗号分隔 kn_id，默认与 config tools.kn_select.kn_ids 一致",
    )
    p.add_argument("--base-url", "-b", default=DEFAULT_BASE_URL, help="网关根地址")
    p.add_argument(
        "--url-path",
        default=DEFAULT_URL_PATH,
        help="相对路径，默认与 config tools.kn_select.url_path 一致",
    )
    p.add_argument(
        "--x-business-domain",
        "-d",
        default=DEFAULT_X_BUSINESS_DOMAIN,
        help="HTTP 头 x-business-domain",
    )
    p.add_argument(
        "--config",
        "-c",
        default="",
        help="可选：从此 JSON 读取 base_url、tools.kn_select.url_path、kn_ids（相对路径相对 cwd）",
    )
    p.add_argument(
        "--insecure",
        action="store_true",
        help="跳过 TLS 证书校验（内网 / 测试）",
    )
    p.add_argument("--timeout", type=float, default=600.0, help="请求超时秒数")
    p.add_argument("--out", "-o", default="", help="将响应 JSON 写入该路径（UTF-8 无 BOM）")
    args = p.parse_args()

    base_url = args.base_url.rstrip("/")
    url_path = args.url_path if args.url_path.startswith("/") else "/" + args.url_path
    kn_ids: list[str] = list(DEFAULT_KN_IDS)
    if args.config:
        cfg = _load_config(args.config)
        base_url = str(cfg.get("base_url", base_url)).rstrip("/")
        kn_tool = (cfg.get("tools") or {}).get("kn_select") or {}
        if kn_tool.get("url_path"):
            url_path = str(kn_tool["url_path"])
            if not url_path.startswith("/"):
                url_path = "/" + url_path
        if kn_tool.get("kn_ids"):
            kn_ids = [str(x) for x in kn_tool["kn_ids"]]
        dom = (cfg.get("defaults") or {}).get("x_business_domain")
        if dom:
            args.x_business_domain = str(dom)
    if args.kn_ids.strip():
        kn_ids = _parse_kn_ids(args.kn_ids)

    query = args.query.strip() or DEFAULT_QUERY
    token = args.token.strip()
    if not token:
        print("error: 缺少 token（--token 或环境变量 KN_SELECT_TOKEN）", file=sys.stderr)
        if sys.platform == "win32":
            print(
                "hint: 若当前窗口是 PowerShell（提示符含 PS），不要用 CMD 的 set VAR=值，环境变量不会生效。\n"
                "  请用: $env:KN_SELECT_TOKEN = '你的token'\n"
                "  或一行: python kn_select_request_example.py --token '你的token' --insecure -q \"...\"\n"
                "  仅在「命令提示符 cmd.exe」里才用: set KN_SELECT_TOKEN=你的token",
                file=sys.stderr,
            )
        return 2

    payload: dict[str, Any] = {
        "auth": {"token": token},
        "query": query,
        "kn_ids": kn_ids,
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
        with urllib.request.urlopen(req, timeout=args.timeout, context=ctx) as resp:
            raw = resp.read()
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code} {e.reason}\n{err_body}", file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print(f"request failed: {e.reason}", file=sys.stderr)
        return 1

    try:
        data = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        text = raw.decode("utf-8", errors="replace")
        print(text)
        if args.out:
            with open(args.out, "w", encoding="utf-8", newline="\n") as f:
                f.write(text)
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
