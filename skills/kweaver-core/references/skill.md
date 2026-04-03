# Skill 命令参考

ADP/KWeaver Skill 资源域：注册、市场查找、渐进式读取、下载与本地安装。

与 CLI 一致：运行 `kweaver skill --help` 或 `kweaver skill <subcommand> --help` 查看当前版本同步的参数。

## 常用命令

```bash
kweaver skill list [--name <kw>] [--status unpublish|published|offline] [--page-size 30]
kweaver skill market [--name <kw>] [--source <src>] [--page-size 30]
kweaver skill get <skill_id>
kweaver skill register --content-file <SKILL.md> [--source <src>] [--extend-info '{"tag":"demo"}']
kweaver skill register --zip-file <skill.zip> [--source <src>] [--extend-info '{"tag":"demo"}']
kweaver skill status <skill_id> <unpublish|published|offline>
kweaver skill delete <skill_id> [-y]
```

## 渐进式读取

```bash
# Read the content index only (download URL + file manifest)
kweaver skill content <skill_id>

# Fetch and print SKILL.md body
kweaver skill content <skill_id> --raw

# Save SKILL.md locally
kweaver skill content <skill_id> --output ./SKILL.md

# Read one file entry
kweaver skill read-file <skill_id> references/guide.md

# Fetch file bytes and save locally
kweaver skill read-file <skill_id> references/guide.md --output ./guide.md
```

## 下载与安装

```bash
# Download the ZIP archive
kweaver skill download <skill_id> --output ./demo-skill.zip

# Install to a local folder (extract ZIP)
kweaver skill install <skill_id> ./skills/demo-skill

# Replace an existing non-empty directory
kweaver skill install <skill_id> ./skills/demo-skill --force
```

## 说明

- `list` 与 `market` 默认每页 30 条，`--page-size` / `--limit` 可覆盖
- `content` / `read-file` 默认返回索引元数据；加 `--raw` 或 `--output` 才会真正抓取远端内容
- `register --content-file` 适合只上传 `SKILL.md`；`register --zip-file` 适合包含模板、参考资料、脚本等附件
- `install` 本质是 `download + unzip` 的本地便捷封装
