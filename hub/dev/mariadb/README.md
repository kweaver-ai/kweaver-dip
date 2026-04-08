# 本项目是用于本地开发调试的 MariaDB

## 使用方法

1. `docker pull mariadb:latest` 拉取最新的 MariaDB 镜像

2. 修改 `docker-compose.yml` 中的 `volumns` 配置，挂载本地卷到容器

3. `docker-compose up -d mariadb` 启动容器