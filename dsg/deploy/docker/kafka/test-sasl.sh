#!/bin/bash
# 测试 Kafka SASL 连接

# 创建客户端 JAAS 配置文件
cat > /tmp/client_jaas.conf <<EOF
KafkaClient {
    org.apache.kafka.common.security.plain.PlainLoginModule required
    username="basic_search"
    password="basic_search123";
};
EOF

# 使用 SASL 配置测试连接
export KAFKA_OPTS="-Djava.security.auth.login.config=/tmp/client_jaas.conf"

# 测试连接
kafka-broker-api-versions \
    --bootstrap-server localhost:9092 \
    --command-config <(cat <<EOF
security.protocol=SASL_PLAINTEXT
sasl.mechanism=PLAIN
EOF
) 2>&1
