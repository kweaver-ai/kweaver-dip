---
- name: Channel Adapter
- description: Channel Adapter 负责在钉钉、⻜书等通道（Channel）和 Agent 之间进行数据结构的适配
- module: src/channel_adapter.py
---

# Channel Adapter

## 简介

用户可以通过钉钉、飞书、企业微信等平台的单聊、群聊向数字员工发送消息或接收数字员工的消息。

数字员工在单聊、群聊中以“机器人“的形态存在：

- 机器人是由开发者在各个平台创建的一种自建应用
- 机器人主要通过两种机制与数字员工进行打通：
    * 事件：机器人接收单聊或群聊中发生的各种事件，例如：接收用户单聊、群聊消息。
    * 消息：机器人主动在单聊或群聊中发送消息。
- 