#!/bin/bash
#
# Deploy Installer Mock 服务启动脚本
#

set -e

# 检查虚拟环境
if [ ! -d ".venv" ]; then
    echo "虚拟环境不存在，正在创建..."
    python3 -m venv .venv
fi

# 激活虚拟环境
source .venv/bin/activate

# 安装依赖
if [ ! -f ".venv/.dependencies_installed" ]; then
    echo "正在安装依赖..."
    pip install -r requirements.txt
    touch .venv/.dependencies_installed
fi

# 启动服务
echo "正在启动 Deploy Installer Mock 服务..."
python app.py
