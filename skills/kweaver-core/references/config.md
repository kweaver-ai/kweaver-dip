# 配置命令参考

平台级配置管理。配置存储在 `~/.kweaver/platforms/<platform>/config.json`。

## 命令

```bash
kweaver config show                    # 显示当前平台配置
kweaver config set-bd <value>          # 设置默认 business domain
```

## 说明

- DIP 产品通常使用 UUID 格式的 business domain（非 `bd_public`）
- 设置后所有命令（bkn、agent、ds、vega、call）自动使用该值
- 可用 `-bd` 标志临时覆盖
- 环境变量 `KWEAVER_BUSINESS_DOMAIN` 优先级最高

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
