#!/bin/bash

# Docker 镜像构建脚本
# 用法: ./build.sh [service] [tag]
#   service: api, rpc, job, consumer, all (默认: all)
#   tag: 镜像标签 (默认: latest)

set -e

REGISTRY=${REGISTRY:-"docker.io"}
PROJECT=${PROJECT:-"data-semantic"}
TAG=${1:-"latest"}
SERVICE=${2:-"all"}

# 可用服务列表
AVAILABLE_SERVICES=("api" "rpc" "job" "consumer")

build_service() {
    local svc=$1
    local dockerfile="deploy/docker/Dockerfile.${svc}"
    
    if [ ! -f "$dockerfile" ]; then
        echo "⚠️  跳过 $svc: Dockerfile 不存在"
        return
    fi
    
    local image="${REGISTRY}/${PROJECT}-${svc}:${TAG}"
    echo "🔨 构建 $image ..."
    docker build -f "$dockerfile" -t "$image" .
    echo "✅ 完成 $image"
    echo ""
}

echo "========================================"
echo "  Docker 镜像构建"
echo "========================================"
echo "Registry: $REGISTRY"
echo "Project:  $PROJECT"
echo "Tag:      $TAG"
echo "Service:  $SERVICE"
echo ""

if [ "$SERVICE" = "all" ]; then
    for svc in "${AVAILABLE_SERVICES[@]}"; do
        build_service "$svc"
    done
else
    build_service "$SERVICE"
fi

echo "========================================"
echo "  构建完成!"
echo "========================================"
echo ""
echo "推送镜像:"
if [ "$SERVICE" = "all" ]; then
    for svc in "${AVAILABLE_SERVICES[@]}"; do
        echo "  docker push ${REGISTRY}/${PROJECT}-${svc}:${TAG}"
    done
else
    echo "  docker push ${REGISTRY}/${PROJECT}-${SERVICE}:${TAG}"
fi
