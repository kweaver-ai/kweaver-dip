# 标准化管理后台服务

[English Version](README.md)

## 项目介绍

数据标准化管理后台服务是一个基于Spring Boot的后端服务，用于管理数据标准化相关的业务，包括数据元素管理、目录管理、字典管理、规则管理、文件管理和任务管理等。

## 技术栈

- **框架**: Spring Boot 2.7.5
- **开发语言**: Java 1.8
- **持久层**: MyBatis Plus
- **数据库**: MariaDB / 达梦数据库
- **服务器**: Undertow
- **API文档**: Swagger 3.0 + Knife4j
- **消息队列**: Kafka + NSQ
- **缓存**: Redis
- **分布式锁**: Redisson
- **工具库**: Lombok, Hutool, EasyExcel

## 功能模块

1. **数据标准化管理**
   - 业务表标准化创建
   - 数据元素管理
   - 数据元素历史记录

2. **目录管理**
   - 目录树结构管理
   - 目录与文件关联

3. **码表管理**
   - 码表数据维护
   - 码表枚举管理
   - 码表Excel导入导出

4. **编码规则管理**
   - 编码规则定义与维护
   - 编码规则类型管理

5. **文件管理**
   - 标准文件管理
   - 文件附件管理

## 项目结构

```
├── aspect/             # 切面类
├── common/             # 公共组件
│   ├── annotation/     # 自定义注解
│   ├── constant/       # 常量定义
│   ├── enums/          # 枚举类
│   ├── excel/          # Excel处理
│   ├── exception/      # 异常处理
│   ├── mybatis/        # MyBatis拦截器
│   ├── producer/       # 消息生产者
│   ├── threadpoolexecutor/ # 线程池
│   ├── util/           # 工具类
│   └── webfilter/      # Web过滤器
├── config/             # 配置类
├── configuration/      # 配置管理
├── controller/         # 控制层
├── dto/                # 数据传输对象
├── entity/             # 实体类
├── filter/             # 过滤器
├── handler/            # 处理器
├── mapper/             # 数据访问层
├── redisson/           # Redisson分布式锁
├── service/            # 业务层
└── vo/                 # 视图对象
```

## 快速开始

### 环境要求

- JDK 1.8+
- Maven 3.6+
- MariaDB / 达梦数据库
- Redis
- Kafka / NSQ

### 构建与运行

1. **克隆项目**

2. **配置数据库和Redis**
   - 修改`application.yml`或`application.properties`中的数据库和Redis配置

3. **构建项目**
   ```bash
   mvn clean package -DskipTests
   ```

4. **运行项目**
   ```bash
   java -jar target/standardization-web-0.0.1-SNAPSHOT.jar
   ```

5. **访问API文档**
   - Swagger: http://localhost:{port}/swagger-ui/
   - Knife4j: http://localhost:{port}/doc.html

## 开发规范

1. **代码风格**
   - 遵循阿里巴巴Java开发规范
   - 使用Lombok简化代码
   - 方法和变量命名清晰，见名知意

2. **分层设计**
   - Controller层负责请求处理和响应
   - Service层负责业务逻辑
   - Mapper层负责数据访问
   - Entity对应数据库表
   - DTO用于数据传输
   - VO用于返回给前端的数据

3. **日志管理**
   - 使用Slf4j进行日志记录
   - 关键操作记录审计日志

4. **异常处理**
   - 统一异常处理
   - 自定义异常类
   - 错误码枚举管理

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

## 联系方式