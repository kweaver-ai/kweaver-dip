#!/bin/bash

# OpenSearch 构建脚本

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "构建 OpenSearch Docker 镜像"
echo "========================================="
echo ""

# 构建 Docker 镜像
echo "开始构建 Docker 镜像..."
cd "${SCRIPT_DIR}"

docker build \
    -t dsg-opensearch:2.17.1 \
    -f Dockerfile \
    .

echo ""
echo "========================================="
echo "✓ 镜像构建完成: dsg-opensearch:2.17.1"
echo "========================================="
