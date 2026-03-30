#!/bin/bash

# Go 服务 Docker Compose 启动脚本
# 自动识别 services/apps 目录下的所有 Go 服务

set -e

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEPLOY_DIR="$PROJECT_ROOT/deploy"

cd "$DEPLOY_DIR"

echo "=========================================="
echo "Go 服务 Docker Compose 启动脚本"
echo "=========================================="
echo ""

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未找到 Docker，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ 错误: 未找到 Docker Compose，请先安装 Docker Compose"
    exit 1
fi

# 自动发现 Go 服务
echo "🔍 正在扫描 Go 服务..."
GO_SERVICES=()
SERVICES_DIR="$PROJECT_ROOT/services/apps"

if [ -d "$SERVICES_DIR" ]; then
    for service_dir in "$SERVICES_DIR"/*; do
        if [ -d "$service_dir" ] && [ -f "$service_dir/go.mod" ]; then
            service_name=$(basename "$service_dir")
            GO_SERVICES+=("$service_name")
            echo "  ✅ 发现 Go 服务: $service_name"
        fi
    done
fi

if [ ${#GO_SERVICES[@]} -eq 0 ]; then
    echo "⚠️  未发现任何 Go 服务（在 $SERVICES_DIR 目录下）"
    echo "💡 提示: Go 服务需要包含 go.mod 文件"
else
    echo ""
    echo "📦 发现的 Go 服务 (${#GO_SERVICES[@]} 个):"
    for service in "${GO_SERVICES[@]}"; do
        echo "   - $service"
    done
fi

echo ""

# 检查 .env 文件
if [ ! -f "$DEPLOY_DIR/.env" ]; then
    echo "⚠️  未找到 .env 文件，使用默认配置"
    echo "💡 提示: 可以复制 .env.example 为 .env 并修改配置"
    if [ -f "$DEPLOY_DIR/.env.example" ]; then
        read -p "是否现在创建 .env 文件? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp "$DEPLOY_DIR/.env.example" "$DEPLOY_DIR/.env"
            echo "✅ 已创建 .env 文件，请根据需要修改配置"
        fi
    fi
fi

# 选择启动模式
echo ""
echo "请选择启动模式:"
echo "1) 标准模式（所有服务 + 依赖组件）"
echo "2) 开发模式（包含开发工具，如 Kafka UI）"
echo "3) 仅核心服务（不包含可选工具）"
echo "4) 仅 Go 服务（不包含依赖组件）"
read -p "请输入选项 (1-4，默认: 1): " mode
mode=${mode:-1}

# 确定使用的 docker-compose 命令
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

case $mode in
    1)
        echo ""
        echo "🚀 启动标准模式（所有服务 + 依赖组件）..."
        $DOCKER_COMPOSE -f docker-compose.yml up -d
        ;;
    2)
        echo ""
        echo "🚀 启动开发模式（包含 Kafka UI）..."
        $DOCKER_COMPOSE -f docker-compose.yml --profile tools up -d
        ;;
    3)
        echo ""
        echo "🚀 启动核心服务..."
        $DOCKER_COMPOSE -f docker-compose.yml up -d basic-search opensearch kafka zookeeper hydra redis
        ;;
    4)
        echo ""
        echo "🚀 仅启动 Go 服务..."
        if [ ${#GO_SERVICES[@]} -eq 0 ]; then
            echo "❌ 未发现 Go 服务，无法启动"
            exit 1
        fi
        # 只启动 Go 服务，不启动依赖组件
        for service in "${GO_SERVICES[@]}"; do
            echo "  启动服务: $service"
            $DOCKER_COMPOSE -f docker-compose.yml up -d "$service" || echo "  ⚠️  服务 $service 可能未在 docker-compose.yml 中定义"
        done
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "⏳ 等待服务启动..."
sleep 5

echo ""
echo "📊 服务状态:"
$DOCKER_COMPOSE -f docker-compose.yml ps

echo ""
echo "✅ 服务启动完成！"
echo ""
echo "📝 服务访问地址:"
echo "  - Basic-Search:     http://localhost:8163"
echo "  - OpenSearch:        http://localhost:9200"
echo "  - Kafka:             localhost:9092"
echo "  - Hydra (Public):    http://localhost:4444"
echo "  - Hydra (Admin):     http://localhost:4445"
echo "  - Redis:             localhost:6379"
if [ "$mode" = "2" ]; then
    echo "  - Kafka UI:          http://localhost:8080"
fi
echo ""
echo "📋 常用命令:"
echo "  - 查看日志:    cd deploy && $DOCKER_COMPOSE logs -f [服务名]"
echo "  - 停止服务:    cd deploy && $DOCKER_COMPOSE down"
echo "  - 重启服务:    cd deploy && $DOCKER_COMPOSE restart [服务名]"
echo "  - 查看状态:    cd deploy && $DOCKER_COMPOSE ps"
echo ""
echo "💡 提示: 所有 Go 服务位于 services/apps/ 目录下"
echo ""
