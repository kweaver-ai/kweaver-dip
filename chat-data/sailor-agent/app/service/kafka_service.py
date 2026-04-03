# -*- coding: utf-8 -*-
"""
Kafka Service

用于发送消息到 Kafka 主题的服务类
"""

import json
from typing import Any, Dict, Optional, Union
from app.logs.logger import logger

try:
    from kafka import KafkaProducer
    from kafka.errors import KafkaError
    KAFKA_AVAILABLE = True
except ImportError:
    KAFKA_AVAILABLE = False
    logger.warning("[KafkaService] kafka-python 未安装，Kafka 功能不可用。请运行: pip install kafka-python")

try:
    from config import settings
except ImportError:
    settings = None


class KafkaService:
    """
    Kafka 服务类，用于发送消息到 Kafka 主题
    """

    def __init__(
        self,
        bootstrap_servers: Optional[str] = None,
        **kwargs
    ):
        """
        初始化 Kafka 服务

        Args:
            bootstrap_servers: Kafka broker 地址，格式为 "host1:port1,host2:port2"
                             如果为 None，则从配置文件中读取
            **kwargs: 其他 KafkaProducer 参数
        """
        # 检查 Kafka 是否可用
        if not KAFKA_AVAILABLE:
            raise ImportError("kafka-python 未安装，无法使用 KafkaService。请运行: pip install kafka-python")
        
        # 从配置或参数中获取 bootstrap_servers
        if settings:
            self.bootstrap_servers = bootstrap_servers or getattr(
                settings, 'KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092'
            )
            kafka_passwd  =  getattr(
                settings, 'KAFKA_PASSWORD', ''
            )
			kafka_user  =  getattr(
                settings, 'KAFKA_USER', 'kafkauser'
            )
        else:
            self.bootstrap_servers = bootstrap_servers or 'localhost:9092'
            kafka_passwd = ""
			kafka_user = "kafkauser"

        
        # KafkaProducer 配置
        producer_config = {
            "sasl_mechanism": "PLAIN",
            "security_protocol": 'SASL_PLAINTEXT',
            "sasl_plain_username": kafka_user,
            "sasl_plain_password": kafka_passwd,
            "bootstrap_servers": self.bootstrap_servers.split(','),
            "key_serializer": lambda k: json.dumps(k).encode(),
            "value_serializer": lambda v: json.dumps(v).encode(),
        }
        
        try:
            self.producer = KafkaProducer(**producer_config)
            logger.info(f"[KafkaService] 初始化成功，bootstrap_servers={self.bootstrap_servers}")
        except Exception as e:
            logger.error(f"[KafkaService] 初始化失败: {e}")
            raise

    def send_message(
        self,
        topic: str,
        message: Union[Dict[str, Any], str],
        key: Optional[str] = None,
        partition: Optional[int] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 10
    ) -> bool:
        """
        发送消息到 Kafka 主题

        Args:
            topic: Kafka 主题名称
            message: 要发送的消息，可以是字典或字符串
            key: 消息的 key（可选），用于分区路由
            partition: 指定的分区（可选）
            headers: 消息头（可选）
            timeout: 发送超时时间（秒）

        Returns:
            bool: 发送是否成功

        Example:
            >>> kafka_service = KafkaService()
            >>> kafka_service.send_message(
            ...     topic="test-topic",
            ...     message={"user_id": "123", "action": "login"},
            ...     key="user_123"
            ... )
            True
        """
        try:
            # 如果 message 是字符串，尝试解析为 JSON
            if isinstance(message, str):
                try:
                    message = json.loads(message)
                except json.JSONDecodeError:
                    # 如果不是 JSON，则作为普通字符串处理
                    message = {"content": message}

            # 转换 headers
            kafka_headers = None
            if headers:
                kafka_headers = [(k.encode('utf-8'), v.encode('utf-8')) for k, v in headers.items()]

            # 发送消息
            future = self.producer.send(
                topic=topic,
                value=message,
                key=key,
                partition=partition,
                headers=kafka_headers
            )

            # 等待发送完成
            record_metadata = future.get(timeout=timeout)
            
            logger.info(
                f"[KafkaService] 消息发送成功: "
                f"topic={record_metadata.topic}, "
                f"partition={record_metadata.partition}, "
                f"offset={record_metadata.offset}"
            )
            return True

        except KafkaError as e:
            logger.error(f"[KafkaService] Kafka 错误: {e}")
            return False
        except Exception as e:
            logger.error(f"[KafkaService] 发送消息失败: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False

    async def send_message_async(
        self,
        topic: str,
        message: Union[Dict[str, Any], str],
        key: Optional[str] = None,
        partition: Optional[int] = None,
        headers: Optional[Dict[str, str]] = None,
        timeout: int = 10
    ) -> bool:
        """
        异步发送消息到 Kafka 主题

        Args:
            topic: Kafka 主题名称
            message: 要发送的消息，可以是字典或字符串
            key: 消息的 key（可选），用于分区路由
            partition: 指定的分区（可选）
            headers: 消息头（可选）
            timeout: 发送超时时间（秒）

        Returns:
            bool: 发送是否成功
        """
        # 由于 kafka-python 的 KafkaProducer 本身是同步的，
        # 这里使用 send_message，但在异步上下文中调用
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.send_message,
            topic,
            message,
            key,
            partition,
            headers,
            timeout
        )

    def send_batch_messages(
        self,
        topic: str,
        messages: list[Union[Dict[str, Any], str]],
        key: Optional[str] = None,
        timeout: int = 10
    ) -> Dict[str, int]:
        """
        批量发送消息到 Kafka 主题

        Args:
            topic: Kafka 主题名称
            messages: 要发送的消息列表
            key: 消息的 key（可选），用于分区路由
            timeout: 发送超时时间（秒）

        Returns:
            Dict[str, int]: 包含成功和失败数量的字典
                {
                    "success": 成功数量,
                    "failed": 失败数量,
                    "total": 总数量
                }

        Example:
            >>> kafka_service = KafkaService()
            >>> messages = [
            ...     {"user_id": "123", "action": "login"},
            ...     {"user_id": "456", "action": "logout"}
            ... ]
            >>> result = kafka_service.send_batch_messages("test-topic", messages)
            >>> print(result)
            {"success": 2, "failed": 0, "total": 2}
        """
        success_count = 0
        failed_count = 0

        for message in messages:
            if self.send_message(topic, message, key=key, timeout=timeout):
                success_count += 1
            else:
                failed_count += 1

        result = {
            "success": success_count,
            "failed": failed_count,
            "total": len(messages)
        }

        logger.info(
            f"[KafkaService] 批量发送完成: topic={topic}, "
            f"success={success_count}, failed={failed_count}, total={len(messages)}"
        )

        return result

    def flush(self, timeout: float = 10.0):
        """
        刷新 producer，确保所有待发送的消息都被发送

        Args:
            timeout: 刷新超时时间（秒）
        """
        try:
            self.producer.flush(timeout=timeout)
            logger.info("[KafkaService] 刷新完成")
        except Exception as e:
            logger.error(f"[KafkaService] 刷新失败: {e}")

    def close(self):
        """
        关闭 producer 连接
        """
        try:
            self.producer.close()
            logger.info("[KafkaService] 连接已关闭")
        except Exception as e:
            logger.error(f"[KafkaService] 关闭连接失败: {e}")

    def __enter__(self):
        """上下文管理器入口"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器出口，自动关闭连接"""
        self.close()


def test_sync_send():
    """同步发送消息示例"""
    # 创建 KafkaService 实例
    kafka_service = KafkaService(
    )

    # 发送单个消息
    success = kafka_service.send_message(
        topic="test-topic",
        message={"user_id": "123", "action": "login", "timestamp": "2024-01-01T00:00:00"},
        key="user_123"  # 可选，用于分区路由
    )

    if success:
        print("消息发送成功")
    else:
        print("消息发送失败")

    # 批量发送消息
    messages = [
        {"user_id": "123", "action": "login"},
        {"user_id": "456", "action": "logout"},
        {"user_id": "789", "action": "view"}
    ]

    result = kafka_service.send_batch_messages(
        topic="test-topic",
        messages=messages
    )
    print(f"批量发送结果: {result}")

    # 确保所有消息都已发送
    kafka_service.flush()

    # 关闭连接
    kafka_service.close()

if __name__ == "__main__":
   test_sync_send()
