# Nginx 反向代理

本项目使用 nginx 将 DIP Hub 后端接口、Proton 提供的安装接口（Mock）、ADP 平台提供的业务知识网络（Mock）接口、Data Agent（Mock）接口统一代理到 80 端口以方便开发调试。

## 使用方法

1. `docker pull nginx:latest` 拉取最新的 nginx 镜像

2. 修改 `conf.d` 中对应的端口映射关系

3. `docker-compose up -d nginx` 启动 nginx 镜像

4.  修改 nginx 配置后，可以使用 `docker-compose exec nginx nginx -s reload` 重新加载配置文件
