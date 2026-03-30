########################### Stage 0 ########################
ARG BUILD_IMAGE=golang:1.24.11
ARG BASE_IMAGE=ubuntu:24.04

FROM ${BUILD_IMAGE} AS builder

WORKDIR /build

# 复制 go mod 文件（从服务目录）
COPY services/apps/configuration-center/go.mod services/apps/configuration-center/go.sum ./

# 下载依赖
ARG GOPROXY_URL="http://goproxy.cn,direct"
ARG GOPRIVATE="github.com/kweaver-ai/*"

ENV GOPROXY=${GOPROXY_URL} \
    GOPRIVATE=${GOPRIVATE}

RUN go mod download

# 安装构建工具
RUN go install github.com/google/wire/cmd/wire@v0.5.0

# 复制源代码（注意：构建上下文是项目根目录，需要复制服务目录）
COPY services/apps/configuration-center/ ./

# 生成 wire 代码（如果需要）
RUN wire ./cmd/server || true

# 构建应用
ARG SERVER_VERSION=0.1.0
RUN CGO_ENABLED=0 go build -ldflags "-s -w -X main.Version=${SERVER_VERSION}" -o ./bin/configuration-center-server ./cmd/server;

########################### Stage 1 ########################
# Copy working directory to the actual release docker images
FROM ${BASE_IMAGE} AS prod

ARG UID=1001
ARG GID=1001

RUN groupadd -r -g $GID adp \
    && useradd -r -u $UID -g $GID adp

# 创建目标目录结构
RUN mkdir -p /opt/configuration-center/config \
    && mkdir -p /opt/configuration-center/logs \
    && mkdir -p /opt/configuration-center/cmd/server/static

# 复制二进制文件
COPY --from=builder --chown=$UID:$GID /build/bin/configuration-center-server /opt/configuration-center/

# 复制配置文件
COPY --from=builder --chown=$UID:$GID /build/cmd/server/config/config.yaml /opt/configuration-center/config/

# 复制静态资源文件（menu.json等），保持 cmd/server/static 目录结构
COPY --from=builder --chown=$UID:$GID /build/cmd/server/static/menu.json /opt/configuration-center/cmd/server/static/menu.json
COPY --from=builder --chown=$UID:$GID /build/cmd/server/static/menu.back.json /opt/configuration-center/cmd/server/static/menu.back.json

# 设置目录权限
RUN chown -R $UID:$GID /opt/configuration-center/logs

# 指定工作目录
WORKDIR /opt/configuration-center/

# Change user
USER adp

# Expose port
EXPOSE 8133

# 指定启动命令
ENTRYPOINT [ "./configuration-center-server", "--confPath", "/opt/configuration-center/config/", "--addr", "0.0.0.0:8133" ]
