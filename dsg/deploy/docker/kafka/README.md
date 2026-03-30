# Kafka SASL/PLAIN 认证配置文档

## 概述

本文档描述了如何在 Docker Compose 环境中配置 Kafka 的 SASL/PLAIN 认证，以及如何让应用服务使用认证连接到 Kafka。

## 配置结构

```
deploy/docker/kafka/
├── kafka_server_jaas.conf    # Kafka Server 的 JAAS 配置文件
├── healthcheck.sh             # Kafka 健康检查脚本（支持 SASL）
├── test-sasl.sh              # SASL 连接测试脚本
└── README.md                 # 本文档
```

## 1. JAAS 配置文件

### 文件位置
`deploy/docker/kafka/kafka_server_jaas.conf`

### 配置内容
```conf
KafkaServer {
    org.apache.kafka.common.security.plain.PlainLoginModule required
    username="admin"
    password="admin123"
    user_admin="admin123"
    user_basic_search="basic_search123";
};
```

### 配置说明
- **KafkaServer**: Kafka Broker 的认证配置
- **username/password**: Broker 内部通信使用的凭证
- **user_admin**: 管理员用户，密码为 `admin123`
- **user_basic_search**: 应用服务用户，密码为 `basic_search123`

### 添加新用户
如需添加新用户，在 `user_<username>="<password>"` 格式下添加新行：
```conf
KafkaServer {
    ...
    user_new_client="new_password123";
};
```

## 2. Docker Compose 配置

### 环境变量配置

在 `deploy/docker-compose.yml` 中，Kafka 服务配置了以下关键环境变量：

```yaml
kafka:
  environment:
    # 启用 SASL/PLAIN 认证
    KAFKA_SASL_ENABLED_MECHANISMS: PLAIN
    KAFKA_SASL_MECHANISM_INTER_BROKER_PROTOCOL: PLAIN
    
    # 配置监听器为 SASL_PLAINTEXT
    KAFKA_ADVERTISED_LISTENERS: SASL_PLAINTEXT://kafka:9092,SASL_PLAINTEXT_HOST://localhost:31000
    KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: SASL_PLAINTEXT:SASL_PLAINTEXT,SASL_PLAINTEXT_HOST:SASL_PLAINTEXT
    KAFKA_INTER_BROKER_LISTENER_NAME: SASL_PLAINTEXT
    
    # 指定 JAAS 配置文件路径（不影响 Zookeeper 连接）
    KAFKA_OPTS: -Djava.security.auth.login.config=/etc/kafka/kafka_server_jaas.conf -Dzookeeper.sasl.client=false
```

### 卷挂载

```yaml
volumes:
  - kafka-data:/var/lib/kafka/data
  - ./docker/kafka/kafka_server_jaas.conf:/etc/kafka/kafka_server_jaas.conf:ro
  - ./docker/kafka/healthcheck.sh:/usr/local/bin/kafka-healthcheck.sh:ro
```

### 健康检查

```yaml
healthcheck:
  test: [ "CMD-SHELL", "/usr/local/bin/kafka-healthcheck.sh || exit 1" ]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 120s
```

**注意**: 健康检查脚本使用 SASL 认证连接到 Kafka，因此需要等待 Kafka 完全启动（`start_period: 120s`）。

## 3. 应用配置

### 配置文件位置
`services/apps/basic-search/dev-config/config.docker.yaml`

### Kafka 配置示例
```yaml
kafka:
  version: "2.3.1"
  uri: "kafka:9092"
  clientId: "af.basic-search"
  username: "basic_search"        # 必须与 JAAS 配置中的用户名匹配
  password: "basic_search123"      # 必须与 JAAS 配置中的密码匹配
  groupId: "af.basic-search-1"
```

### 代码配置

在 `services/apps/basic-search/adapter/driver/mq.go` 中：

```go
Consumer: kafkax.NewConsumerService(&kafkax.ConsumerConfig{
    Version:   cfg.KafkaConf.Version,
    Addr:      cfg.KafkaConf.URI,
    ClientID:  cfg.KafkaConf.ClientId,
    UserName:  cfg.KafkaConf.Username,  // 从配置文件读取
    Password:  cfg.KafkaConf.Password,  // 从配置文件读取
    GroupID:   cfg.KafkaConf.GroupId,
    Mechanism: "PLAIN",                // 固定使用 PLAIN 机制
    Trace:     ar_trace.Tracer,
}),
```

## 4. 健康检查脚本

### 文件位置
`deploy/docker/kafka/healthcheck.sh`

### 功能
- 创建临时客户端 JAAS 配置文件
- 使用 `admin` 用户测试 SASL 连接
- 验证 Kafka broker 是否可用

### 使用方法
```bash
docker compose exec kafka /usr/local/bin/kafka-healthcheck.sh
```

## 5. SASL 连接测试

### 测试脚本
`deploy/docker/kafka/test-sasl.sh`

### 测试应用用户连接
```bash
# 在容器内测试 basic_search 用户
docker compose exec kafka bash -c '
cat > /tmp/test_basic_search_jaas.conf <<EOF
KafkaClient {
    org.apache.kafka.common.security.plain.PlainLoginModule required
    username="basic_search"
    password="basic_search123";
};
EOF
export KAFKA_OPTS="-Djava.security.auth.login.config=/tmp/test_basic_search_jaas.conf"
kafka-broker-api-versions --bootstrap-server localhost:9092
'
```

### 测试管理员用户连接
```bash
docker compose exec kafka /usr/local/bin/kafka-healthcheck.sh
```

## 6. 验证清单

### ✅ 配置验证步骤

1. **检查 JAAS 配置文件**
   ```bash
   docker compose exec kafka cat /etc/kafka/kafka_server_jaas.conf
   ```

2. **检查环境变量**
   ```bash
   docker compose exec kafka env | grep KAFKA_SASL
   ```

3. **检查 Kafka 日志**
   ```bash
   docker compose logs kafka | grep "SASL is enabled"
   ```

4. **测试健康检查**
   ```bash
   docker compose exec kafka /usr/local/bin/kafka-healthcheck.sh
   ```

5. **测试应用用户连接**
   ```bash
   # 使用上面的测试脚本
   ```

6. **检查应用服务连接**
   ```bash
   docker compose logs basic-search | grep -i kafka
   ```

## 7. 常见问题

### Q1: Kafka 启动失败，提示 "Unknown tokenizer type [hanlp_index]"
**A**: 这是 OpenSearch 的问题，与 Kafka 无关。请检查 OpenSearch 配置。

### Q2: Kafka 健康检查一直失败
**A**: 
- 检查 Kafka 是否完全启动（等待 2-3 分钟）
- 检查 JAAS 配置文件是否正确挂载
- 检查 Zookeeper 连接是否正常

### Q3: 应用无法连接到 Kafka，提示 "authentication failed"
**A**:
- 确认应用配置中的 `username` 和 `password` 与 JAAS 配置中的用户匹配
- 确认 `Mechanism: "PLAIN"` 已正确配置
- 检查 Kafka broker 是否已启用 SASL

### Q4: 如何添加新的客户端用户？
**A**: 
1. 编辑 `deploy/docker/kafka/kafka_server_jaas.conf`
2. 添加新行：`user_<username>="<password>";`
3. 重启 Kafka 容器：`docker compose restart kafka`

## 8. 安全建议

1. **生产环境**：
   - 使用更强的密码
   - 考虑使用 SASL/SCRAM 替代 PLAIN（更安全）
   - 使用 TLS/SSL 加密传输

2. **密码管理**：
   - 不要将密码硬编码在配置文件中
   - 使用环境变量或密钥管理服务
   - 定期轮换密码

3. **网络隔离**：
   - 限制 Kafka 端口的网络访问
   - 使用 Docker 网络隔离服务

## 9. 相关文件

- `deploy/docker-compose.yml` - Docker Compose 主配置文件
- `services/apps/basic-search/dev-config/config.docker.yaml` - 应用配置文件
- `services/apps/basic-search/adapter/driver/mq.go` - Kafka 客户端代码
- `services/apps/basic-search/common/settings/config.go` - 配置结构定义

## 10. 参考资源

- [Kafka SASL 配置文档](https://kafka.apache.org/documentation/#security_sasl)
- [Confluent Platform SASL 配置](https://docs.confluent.io/platform/current/kafka/authentication_sasl/index.html)
- [Docker Kafka 指南](https://docs.docker.com/guides/kafka/)
