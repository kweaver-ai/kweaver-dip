# 数据库初始化

本目录包含数据库初始化脚本。

## 前置要求

1. MariaDB/MySQL 数据库已安装并运行
2. Python 虚拟环境已激活
3. 已安装必要的 Python 依赖

## 数据库配置

在项目根目录的 `.env` 文件中配置数据库连接信息：

```bash
DIP_HUB_DB_HOST=localhost
DIP_HUB_DB_PORT=3306
DIP_HUB_DB_NAME=dip
DIP_HUB_DB_USER=root
DIP_HUB_DB_PASSWORD=123456
```

**重要**：确保设置了 `DIP_HUB_DB_PASSWORD` 环境变量或在 `.env` 文件中配置。

## 使用方法

### 1. 初始化数据库表

运行以下命令创建所需的数据库表：

```bash
export DIP_HUB_DB_PASSWORD=123456
python scripts/init_db.py
```

这将创建以下表：
- `t_user` - 用户表
- `t_role` - 角色表
- `t_user_role` - 用户-角色关系表
- `t_application` - 应用表

### 2. 启动服务

```bash
export DIP_HUB_DB_PASSWORD=123456
python -m uvicorn src.main:app --host 0.0.0.0 --port 9000 --reload
```

### 3. 测试接口

获取应用列表：
```bash
curl http://localhost:9000/api/dip-hub/v1/applications
```

获取单个应用：
```bash
curl http://localhost:9000/api/dip-hub/v1/applications/A9F3D12C7B8E90F4A6C1E2B7D8F0A3C5
```

## 注意事项

1. 图标数据在数据库中以 BLOB 格式存储，API 返回时转换为 Base64 编码
2. `init_db.py` 脚本使用 `CREATE TABLE IF NOT EXISTS` 语句，多次运行不会影响已有数据
