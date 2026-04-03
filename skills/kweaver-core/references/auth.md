# 认证命令参考

平台认证管理。凭据存储在 `~/.kweaver/`。

与 CLI 一致：运行 `kweaver auth` 或 `kweaver auth login --help` 可查看与当前版本同步的用法（含 `--alias`、`-u`/`-p`、`--playwright`）。

## 前提

```bash
npm install playwright && npx playwright install chromium
```

## 命令

```bash
kweaver auth login <url> [--alias <name>] [-u user] [-p pass] [--playwright] [--insecure|-k]
kweaver auth <url> [--alias <name>] [-u user] [-p pass] [--playwright] [--insecure|-k]   # 同上（简写）
kweaver auth logout [<url|alias>]              # 登出（清除本地 token）
kweaver auth status [url|alias]                # 查看 token 状态
kweaver auth list                              # 列出已保存的平台
kweaver auth use <url|alias>                   # 切换平台
kweaver auth delete <url|alias> [-y]           # 删除平台凭证
```

## 说明

- `login` 支持两种方式：
  - **OAuth2 授权码登录**（默认，平台支持时）：获取 `access_token` + `refresh_token`。**续期时的默认操作**是：用保存的 `refresh_token` 调用 OAuth2 `refresh_token` 授权换发新的 `access_token`（CLI / SDK 在 token 过期或临近过期时自动执行，无需手动开关）
  - **Playwright cookie 登录**（回退方式）：通过 headless 浏览器提取 cookie token，通常**无** `refresh_token`，**不会**走上述换发，过期后需重新 `auth login`
- Token 有效期 1 小时
- 支持多平台，用 `--alias` 设置短名称方便切换
- `--insecure` / `-k`：跳过 TLS 证书校验（仅用于自签名/内网 HTTPS）；会写入 `token.json`，后续 CLI 对该平台同样生效。生产环境请使用受信任证书

## 示例

```bash
kweaver auth login https://kweaver.example.com --alias prod
kweaver auth login https://kweaver-dev.example.com --alias dev
kweaver auth list
kweaver auth use prod
kweaver auth status
```
