#!/bin/bash

# ============================================================================
# DSG Docker Compose 启动脚本
# 功能：
# 1. 检查并创建 .env 文件（如果不存在）
# 2. 加载环境变量
# 3. 启动 Docker Compose 服务
# ============================================================================

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "DSG Docker Compose 启动脚本"
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

# 检查 .env 文件是否存在
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件"
    if [ -f ".env.example" ]; then
        echo "📋 从 .env.example 创建 .env 文件..."
        cp .env.example .env
        echo "✅ 已创建 .env 文件，请根据需要修改配置"
        echo ""
        echo "💡 提示: 可以编辑 .env 文件来自定义环境变量"
        echo ""
    else
        echo "❌ 错误: 未找到 .env.example 文件"
        exit 1
    fi
else
    echo "✅ 找到 .env 文件"
fi

# 加载 .env 文件（如果需要）
if [ -f ".env" ]; then
    echo "📝 加载环境变量..."
    # Docker Compose 会自动加载 .env 文件，这里只需要确保文件存在
    set -a
    source .env 2>/dev/null || true
    set +a
    echo "✅ 环境变量已加载"
fi

echo ""
echo "🔍 检查服务依赖..."

# 解析命令行参数
ACTION="${1:-up}"
SERVICES="${2:-}"

case "$ACTION" in
    up|start)
        echo "🚀 启动所有服务..."
        if [ -n "$SERVICES" ]; then
            docker-compose up -d $SERVICES
        else
            docker-compose up -d
        fi
        echo ""
        echo "✅ 服务启动完成！"
        echo ""
        echo "📊 查看服务状态："
        echo "   docker-compose ps"
        echo ""
        echo "📋 查看服务日志："
        echo "   docker-compose logs -f [service-name]"
        echo ""
        echo "🛑 停止所有服务："
        echo "   docker-compose down"
        ;;
    down|stop)
        echo "🛑 停止所有服务..."
        docker-compose down
        echo "✅ 服务已停止"
        ;;
    restart)
        echo "🔄 重启服务..."
        if [ -n "$SERVICES" ]; then
            docker-compose restart $SERVICES
        else
            docker-compose restart
        fi
        echo "✅ 服务已重启"
        ;;
    ps|status)
        echo "📊 服务状态："
        docker-compose ps
        ;;
    logs)
        if [ -n "$SERVICES" ]; then
            docker-compose logs -f $SERVICES
        else
            docker-compose logs -f
        fi
        ;;
    build)
        echo "🔨 构建所有服务镜像..."
        if [ -n "$SERVICES" ]; then
            docker-compose build $SERVICES
        else
            docker-compose build
        fi
        echo "✅ 构建完成"
        ;;
    pull)
        echo "📥 拉取基础镜像..."
        docker-compose pull
        echo "✅ 拉取完成"
        ;;
    clean)
        echo "🧹 清理所有容器和卷..."
        read -p "⚠️  确定要清理所有容器和卷吗？(y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            docker system prune -f
            echo "✅ 清理完成"
        else
            echo "❌ 已取消"
        fi
        ;;
    health)
        echo "🏥 检查服务健康状态..."
        docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        echo "🔍 详细健康检查："
        # OpenSearch
        if docker-compose ps opensearch | grep -q "Up"; then
            echo -n "  OpenSearch: "
            if curl -s -f http://localhost:9200/_cluster/health > /dev/null 2>&1; then
                echo "✅ 健康"
            else
                echo "❌ 不健康"
            fi
        fi
        # Kafka
        if docker-compose ps kafka | grep -q "Up"; then
            echo -n "  Kafka: "
            if docker-compose exec -T kafka kafka-broker-api-versions --bootstrap-server localhost:9092 > /dev/null 2>&1; then
                echo "✅ 健康"
            else
                echo "❌ 不健康"
            fi
        fi
        # MariaDB
        if docker-compose ps mariadb | grep -q "Up"; then
            echo -n "  MariaDB: "
            if docker-compose exec -T mariadb mysqladmin ping -h localhost -u root -p${MYSQL_ROOT_PASSWORD:-root123} > /dev/null 2>&1; then
                echo "✅ 健康"
            else
                echo "❌ 不健康"
            fi
        fi
        # Redis
        if docker-compose ps redis | grep -q "Up"; then
            echo -n "  Redis: "
            if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
                echo "✅ 健康"
            else
                echo "❌ 不健康"
            fi
        fi
        ;;
    *)
        echo "用法: $0 {up|down|restart|ps|logs|build|pull|clean|health} [service-name]"
        echo ""
        echo "命令说明:"
        echo "  up, start      - 启动所有服务（默认）"
        echo "  down, stop     - 停止所有服务"
        echo "  restart        - 重启服务"
        echo "  ps, status     - 查看服务状态"
        echo "  logs           - 查看服务日志（-f 实时）"
        echo "  build          - 构建服务镜像"
        echo "  pull           - 拉取基础镜像"
        echo "  clean          - 清理所有容器和卷"
        echo "  health         - 检查服务健康状态"
        echo ""
        echo "示例:"
        echo "  $0 up                    # 启动所有服务"
        echo "  $0 up basic-search       # 仅启动 basic-search 服务"
        echo "  $0 logs basic-search     # 查看 basic-search 日志"
        echo "  $0 restart opensearch    # 重启 opensearch"
        exit 1
        ;;
esac
