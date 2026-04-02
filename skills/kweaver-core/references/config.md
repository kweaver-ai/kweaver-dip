# 配置命令参考

平台级配置管理。配置存储在 `~/.kweaver/platforms/<platform>/config.json`。

## 命令

```bash
kweaver config show                    # 显示当前平台配置
kweaver config set-bd <value>          # 设置默认 business domain
kweaver config list-bd                 # 从平台列出可选 business domain（JSON；需已登录）
```

`list-bd` 输出 JSON：`{ "currentId": "<resolved>", "domains": [ { ...平台字段..., "current": true|false } ] }`。

## 说明

- DIP 产品通常使用 UUID 格式的 business domain（非 `bd_public`）
- 设置后所有命令（bkn、agent、ds、vega、call）自动使用该值
- 可用 `-bd` 标志临时覆盖
- 环境变量 `KWEAVER_BUSINESS_DOMAIN` 优先级最高
- 首次 `kweaver auth login` 成功后，若未配置且未设置环境变量，CLI 会调用平台接口自动选择：列表含 `bd_public` 则选它，否则选第一项；也可随时用 `config list-bd` 查看列表并用 `config set-bd` 覆盖

## Business Domain 优先级

1. `KWEAVER_BUSINESS_DOMAIN` 环境变量
2. `kweaver config set-bd` 设置的平台配置
3. 默认值 `bd_public`

## 示例

```bash
kweaver config set-bd 54308785-4438-43df-9490-a7fd11df5765
kweaver config show
# Platform:        https://dip-poc.aishu.cn
# Business Domain: 54308785-4438-43df-9490-a7fd11df5765 (config)
```
