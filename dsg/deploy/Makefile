################################################################################
# 多服务部署 Makefile
################################################################################

# 服务列表
SERVICES = basic-search configuration-center data-catalog data-exploration-service auth-service data-subject data-view session task_center data-application-service data-application-gateway
# 可以添加更多服务: SERVICES = basic-search service-a service-b

# Docker 镜像仓库
REGISTRY ?= localhost
# 版本号（使用 Git Tag 或时间戳）
VERSION ?= $(shell git describe --tags --always 2>/dev/null || date +%Y%m%d-%H%M%S)

# 项目根目录
ROOT_DIR := $(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))/..

.PHONY: help
help:
	@echo "多服务部署 Makefile"
	@echo ""
	@echo "可用命令:"
	@echo "  make build-all          - 构建所有服务的 Docker 镜像"
	@echo "  make push-all           - 推送所有服务的镜像到仓库"
	@echo "  make deploy-all         - 构建并推送所有服务"
	@echo "  make clean              - 清理本地构建的镜像"
	@echo "  make docker-compose-up  - 使用 docker-compose 启动所有服务"
	@echo "  make docker-compose-down - 停止 docker-compose 服务"
	@echo ""
	@echo "环境变量:"
	@echo "  REGISTRY  - Docker 镜像仓库地址 (默认: localhost)"
	@echo "  VERSION   - 镜像版本标签 (默认: Git Tag 或时间戳)"

.PHONY: build-all
build-all:
	@echo "开始构建所有服务..."
	@for service in $(SERVICES); do \
		echo "========================================="; \
		echo "构建服务: $$service"; \
		echo "========================================="; \
		cd $(ROOT_DIR) && \
		docker build \
			-f services/apps/$$service/docker/Dockerfile \
			-t $(REGISTRY)/$$service:$(VERSION) \
			-t $(REGISTRY)/$$service:latest \
			. ; \
	done
	@echo "所有服务构建完成！"

.PHONY: push-all
push-all:
	@echo "开始推送所有服务镜像..."
	@for service in $(SERVICES); do \
		echo "推送服务: $$service"; \
		docker push $(REGISTRY)/$$service:$(VERSION) && \
		docker push $(REGISTRY)/$$service:latest || exit 1; \
	done
	@echo "所有服务镜像推送完成！"

.PHONY: deploy-all
deploy-all: build-all push-all
	@echo "所有服务部署完成！"

.PHONY: clean
clean:
	@echo "清理本地镜像..."
	@for service in $(SERVICES); do \
		docker rmi $(REGISTRY)/$$service:$(VERSION) 2>/dev/null || true; \
		docker rmi $(REGISTRY)/$$service:latest 2>/dev/null || true; \
	done
	@echo "清理完成！"

.PHONY: docker-compose-up
docker-compose-up:
	@echo "启动 docker-compose 服务..."
	cd $(ROOT_DIR)/deploy && docker compose up -d
	@echo "服务启动完成！"

.PHONY: docker-compose-down
docker-compose-down:
	@echo "停止 docker-compose 服务..."
	cd $(ROOT_DIR)/deploy && docker compose down
	@echo "服务已停止！"

.PHONY: docker-compose-logs
docker-compose-logs:
	cd $(ROOT_DIR)/deploy && docker compose logs -f

# 单个服务操作
.PHONY: build-service
build-service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "错误: 请指定服务名称，例如: make build-service SERVICE=basic-search"; \
		exit 1; \
	fi
	@echo "构建服务: $(SERVICE)"
	@echo "构建服务: $(SERVICE)"
	cd $(ROOT_DIR) && \
	docker build \
		-f services/apps/$(SERVICE)/docker/Dockerfile \
		-t $(REGISTRY)/$(SERVICE):$(VERSION) \
		-t $(REGISTRY)/$(SERVICE):latest \
		.
