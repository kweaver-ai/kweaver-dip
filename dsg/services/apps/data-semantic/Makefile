.PHONY: init api swagger swagger-yaml gen lint test build clean docker-build docker-run k8s-deploy

# 项目名称
PROJECT_NAME := data-semantic

# Docker 配置
DOCKER_REGISTRY := docker.io
DOCKER_IMAGE := $(DOCKER_REGISTRY)/$(PROJECT_NAME)
VERSION := $(shell cat VERSION 2>/dev/null || echo "0.1.0")

# Swagger 文档输出目录
SWAGGER_DIR := api/doc/swagger

# 初始化项目
init:
	@./scripts/init.sh

# 生成 API 代码
api:
	goctl api go -api api/doc/api.api -dir api/ --style=go_zero --type-group

# 生成 Swagger 文档 (JSON 格式)
swagger:
	goctl api swagger --api api/doc/api.api --dir $(SWAGGER_DIR) --filename swagger

# 生成 Swagger 文档 (YAML 格式)
swagger-yaml:
	goctl api swagger --api api/doc/api.api --dir $(SWAGGER_DIR) --filename swagger --yaml

# 一键生成 API 代码 + Swagger 文档
gen: api swagger
	@echo "API code and Swagger documentation generated successfully!"

# 格式化代码
fmt:
	gofmt -w .
	goimports -w .

# 代码检查
lint:
	golangci-lint run ./...

# 运行测试
test:
	go test -v -cover ./...

# 编译
build:
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o bin/$(PROJECT_NAME) ./api/api.go

# 运行
run:
	go run api/api.go

# 清理
clean:
	rm -rf bin/
	go clean

# 安装依赖
deps:
	go mod tidy
	go mod download

# ============================================
# Docker 命令
# ============================================

# 构建 Docker 镜像 (使用 build.sh 脚本)
docker-build:
	@cd deploy/docker && ./build.sh $(VERSION)

# 运行 Docker 容器
docker-run:
	docker run -d --name $(PROJECT_NAME) -p 8888:8888 $(DOCKER_IMAGE):$(VERSION)

# 停止 Docker 容器
docker-stop:
	docker stop $(PROJECT_NAME) && docker rm $(PROJECT_NAME)

# 推送 Docker 镜像
docker-push:
	docker push $(DOCKER_IMAGE):$(VERSION)
	docker push $(DOCKER_IMAGE):latest

# ============================================
# Kubernetes 命令
# ============================================

# 部署到 K8s
# 默认环境
ENV ?= dev

# 部署到 K8s (默认 dev)
k8s-deploy:
	kubectl apply -k deploy/k8s/overlays/$(ENV)

# 部署到 K8s (Dev)
k8s-deploy-dev:
	kubectl apply -k deploy/k8s/overlays/dev

# 部署到 K8s (Prod)
k8s-deploy-prod:
	kubectl apply -k deploy/k8s/overlays/prod

# 查看 K8s 生成的 Manifest (Dry-run)
k8s-manifest:
	kubectl kustomize deploy/k8s/overlays/$(ENV)

# 删除 K8s 部署
k8s-delete:
	kubectl delete -k deploy/k8s/overlays/$(ENV)

# 查看 K8s 状态
k8s-status:
	kubectl get pods,svc,deploy,ing -l app=$(PROJECT_NAME)

# 帮助
help:
	@echo "Available commands:"
	@echo ""
	@echo "  Development:"
	@echo "    make init          - Initialize project"
	@echo "    make api           - Generate API code with goctl"
	@echo "    make swagger       - Generate Swagger JSON documentation"
	@echo "    make swagger-yaml  - Generate Swagger YAML documentation"
	@echo "    make gen           - Generate API code + Swagger docs"
	@echo "    make fmt           - Format code"
	@echo "    make lint          - Run linter"
	@echo "    make test          - Run tests"
	@echo "    make build         - Build binary"
	@echo "    make run           - Run server"
	@echo "    make clean         - Clean build artifacts"
	@echo "    make deps          - Install dependencies"
	@echo ""
	@echo "  Docker:"
	@echo "    make docker-build  - Build Docker image"
	@echo "    make docker-run    - Run Docker container"
	@echo "    make docker-stop   - Stop Docker container"
	@echo "    make docker-push   - Push Docker image to registry"
	@echo ""
	@echo "  Kubernetes (Kustomize):"
	@echo "    make k8s-deploy      - Deploy to K8s (default: dev)"
	@echo "    make k8s-deploy-dev  - Deploy to K8s Dev environment"
	@echo "    make k8s-deploy-prod - Deploy to K8s Prod environment"
	@echo "    make k8s-manifest    - View generated manifest (dry-run)"
	@echo "    make k8s-delete      - Delete K8s deployment"
	@echo "    make k8s-status      - Check K8s status"
