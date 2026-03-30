########################### Stage 0 ########################
ARG BUILD_IMAGE=golang:1.24.11
ARG BASE_IMAGE=ubuntu:24.04

FROM ${BUILD_IMAGE} AS builder

WORKDIR /build

# 复制 go mod 文件（从服务目录）
COPY services/apps/data-application-service/go.mod services/apps/data-application-service/go.sum ./

# 下载依赖
ARG GOPROXY_URL="http://goproxy.cn,direct"
ARG GOPRIVATE="github.com/kweaver-ai/*"

ENV GOPROXY=${GOPROXY_URL} \
    GOPRIVATE=${GOPRIVATE}

RUN go mod download

# 安装构建工具
RUN go install github.com/google/wire/cmd/wire@v0.5.0

# 复制源代码（注意：构建上下文是项目根目录，需要复制服务目录）
COPY services/apps/data-application-service/ ./

# 生成 wire 代码（如果需要）
RUN wire ./cmd/server || true

# 构建应用
ARG SERVER_VERSION=0.1.0
RUN CGO_ENABLED=0 go build -ldflags "-s -w -X main.Version=${SERVER_VERSION}" -o ./bin/data-application-service-server ./cmd/server;

########################### Stage 1 ########################
# Copy working directory to the actual release docker images
FROM ${BASE_IMAGE} AS prod

ARG UID=1001
ARG GID=1001

RUN groupadd -r -g $GID adp \
    && useradd -r -u $UID -g $GID adp

COPY --from=builder --chown=$UID:$GID /build/bin /opt/data-application-service

# 创建配置目录并复制配置文件（从 builder 阶段复制）
RUN mkdir -p /opt/data-application-service/config
COPY --from=builder --chown=$UID:$GID /build/cmd/server/config/config.yaml /opt/data-application-service/config/

# 创建日志目录并设置权限
RUN mkdir -p /opt/data-application-service/logs && chown -R $UID:$GID /opt/data-application-service/logs

# 指定工作目录
WORKDIR /opt/data-application-service/

# Change user
USER adp

# Expose port
EXPOSE 8156

# 指定启动命令（使用 --confPath 和 --addr 参数）
ENTRYPOINT [ "./data-application-service-server", "--confPath", "config/", "--addr", "0.0.0.0:8156" ]
