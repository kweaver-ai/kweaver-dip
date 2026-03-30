#!/bin/bash
# Kafka SASL 健康检查脚本

# 创建临时客户端 JAAS 配置
cat > /tmp/kafka_client_jaas.conf <<EOF
KafkaClient {
    org.apache.kafka.common.security.plain.PlainLoginModule required
    username="admin"
    password="admin123";
};
EOF

# 使用 SASL 配置测试连接
export KAFKA_OPTS="-Djava.security.auth.login.config=/tmp/kafka_client_jaas.conf"

# 测试连接（使用 admin 用户）
kafka-broker-api-versions --bootstrap-server localhost:9092
