########################### Stage 0 ########################
ARG BUILD_IMAGE=golang:1.24.11
ARG BASE_IMAGE=ubuntu:24.04

FROM ${BUILD_IMAGE} AS builder

WORKDIR /build

# 复制 go mod 文件（从服务目录）
COPY services/apps/task_center/go.mod services/apps/task_center/go.sum ./
# 复制本地补丁（解决 replace 指令依赖）
COPY local_patches/ /local_patches/

# 下载依赖
ARG GOPROXY_URL="http://goproxy.cn,direct"
ARG GOPRIVATE="github.com/kweaver-ai/*"

ENV GOPROXY=${GOPROXY_URL} \
    GOPRIVATE=${GOPRIVATE}

RUN go mod download

# 安装构建工具
RUN go install github.com/google/wire/cmd/wire@v0.5.0

# 复制源代码（注意：构建上下文是项目根目录，需要复制服务目录）
COPY services/apps/task_center/ ./

# 生成 wire 代码（如果需要）
RUN wire ./cmd/server || true

# 构建应用
ARG SERVER_VERSION=0.1.0
RUN CGO_ENABLED=0 go build -ldflags "-s -w -X main.Version=${SERVER_VERSION}" -o ./bin/task_center-server ./cmd/server;

########################### Stage 1 ########################
# Copy working directory to the actual release docker images
FROM ${BASE_IMAGE} AS prod

ARG UID=1001
ARG GID=1001

RUN groupadd -r -g $GID adp \
    && useradd -r -u $UID -g $GID adp

COPY --from=builder --chown=$UID:$GID /build/bin /opt/task_center

# 创建配置目录并复制配置文件（从 builder 阶段复制）
RUN mkdir -p /opt/task_center/config
COPY --from=builder --chown=$UID:$GID /build/cmd/server/config/config.yaml /opt/task_center/config/

# 创建日志目录并设置权限
RUN mkdir -p /opt/task_center/logs && chown -R $UID:$GID /opt/task_center/logs

# 指定工作目录
WORKDIR /opt/task_center/

# Change user
USER adp

# Expose port
EXPOSE 8143

# 指定启动命令
ENTRYPOINT [ "./task_center-server", "--confPath", "config/"]
