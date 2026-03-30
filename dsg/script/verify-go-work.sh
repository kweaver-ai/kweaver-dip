#!/bin/bash

# Go Workspace 验证脚本
# 用于验证 go.work 是否正常工作

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "=========================================="
echo "Go Workspace (go.work) 验证脚本"
echo "=========================================="
echo ""

# 检查 go.work 文件是否存在
if [ ! -f "go.work" ]; then
    echo "❌ 错误: 未找到 go.work 文件"
    echo "💡 提示: 可以运行 'go work init' 创建，或使用 go.work.example 作为模板"
    exit 1
fi

echo "✅ 找到 go.work 文件"
echo ""

# 检查 Go 版本
GO_VERSION=$(go version | awk '{print $3}')
echo "📦 Go 版本: $GO_VERSION"
if [[ "$GO_VERSION" < "go1.18" ]]; then
    echo "⚠️  警告: Go Workspace 需要 Go 1.18+ 版本"
fi
echo ""

# 验证 go.work 语法
echo "🔍 验证 go.work 语法..."
if go work edit -print > /dev/null 2>&1; then
    echo "✅ go.work 语法正确"
else
    echo "❌ go.work 语法错误"
    go work edit -print
    exit 1
fi
echo ""

# 显示 go.work 内容
echo "📄 go.work 内容:"
go work edit -print
echo ""

# 检查 GOWORK 环境变量
echo "🔍 检查 GOWORK 环境变量..."
GOWORK=$(go env GOWORK)
if [ -n "$GOWORK" ]; then
    echo "✅ GOWORK: $GOWORK"
else
    echo "⚠️  GOWORK 未设置（可能不在 workspace 目录下）"
fi
echo ""

# 列出 workspace 中的模块
echo "📦 Workspace 中的模块:"
WORKSPACE_CONTENT=$(go work edit -print)
# 提取 use 行中的模块路径（支持 use ./path 和 use ( ... ) 两种格式）
MODULES=$(echo "$WORKSPACE_CONTENT" | grep -E "^use" | grep -E "\./" | sed 's/^use[[:space:]]*//' | sed 's/^[[:space:]]*//')
if [ -z "$MODULES" ]; then
    # 尝试提取 use ( ... ) 块中的模块
    MODULES=$(echo "$WORKSPACE_CONTENT" | awk '/^use \(/,/^\)/ {if ($0 ~ /\.\//) {gsub(/^[[:space:]]+/, ""); gsub(/^use[[:space:]]*/, ""); print}}')
fi
if [ -z "$MODULES" ]; then
    echo "  无模块"
else
    echo "$MODULES" | while read -r module; do
        echo "  - $module"
    done
fi
echo ""

# 验证每个模块
echo "🔍 验证各个模块..."
MODULES=$(echo "$WORKSPACE_CONTENT" | grep -E "^use" | grep -E "\./" | sed 's/^use[[:space:]]*//' | sed 's/^[[:space:]]*//')
if [ -z "$MODULES" ]; then
    MODULES=$(echo "$WORKSPACE_CONTENT" | awk '/^use \(/,/^\)/ {if ($0 ~ /\.\//) {gsub(/^[[:space:]]+/, ""); gsub(/^use[[:space:]]*/, ""); print}}')
fi

if [ -z "$MODULES" ]; then
    echo "⚠️  未找到任何模块"
else
    for module in $MODULES; do
        module_path="$PROJECT_ROOT/$module"
        if [ -d "$module_path" ] && [ -f "$module_path/go.mod" ]; then
            echo "  ✅ $module - 模块存在且包含 go.mod"
            
            # 检查模块是否能正常构建
            cd "$module_path"
            if go mod verify > /dev/null 2>&1; then
                echo "     ✅ 模块依赖验证通过"
            else
                echo "     ⚠️  模块依赖验证失败（可能需要运行 go mod download）"
            fi
            cd "$PROJECT_ROOT"
        else
            echo "  ❌ $module - 模块不存在或缺少 go.mod"
        fi
    done
fi
echo ""

# 测试构建
echo "🔍 测试构建（仅验证，不生成二进制）..."
if [ -n "$MODULES" ]; then
    for module in $MODULES; do
        module_path="$PROJECT_ROOT/$module"
        if [ -d "$module_path" ]; then
            # 查找 cmd 目录
            cmd_dirs=$(find "$module_path" -type d -name "cmd" 2>/dev/null | head -1)
            if [ -n "$cmd_dirs" ]; then
                echo "  测试构建: $module"
                cd "$module_path"
                if go build ./... > /dev/null 2>&1; then
                    echo "     ✅ 构建成功"
                else
                    echo "     ⚠️  构建失败（可能是依赖问题，不影响 go.work 验证）"
                fi
                cd "$PROJECT_ROOT"
            fi
        fi
    done
fi
echo ""

# 检查是否有共享依赖
echo "🔍 检查 workspace 依赖同步..."
if go work sync > /dev/null 2>&1; then
    echo "✅ Workspace 依赖同步成功"
else
    echo "⚠️  Workspace 依赖同步有警告（可能需要运行 go mod tidy）"
fi
echo ""

echo "=========================================="
echo "✅ Go Workspace 验证完成！"
echo "=========================================="
echo ""
echo "💡 提示:"
echo "  - 如果发现模块，可以运行 'go work use ./path/to/module' 添加"
echo "  - 如果模块有问题，可以运行 'go work sync' 同步依赖"
echo "  - 查看 workspace 内容: go work edit -print"
echo ""
