开发数字员工运营平台 DIP Studio 的后端服务

## 技术要求
- 使用 TypeScript 作为开发语言
- 使用 Express 作为 HTTP 服务框架
- 每个函数及参数都必须有文档注释
- 单元测试行覆盖率必须达到 90% 以上
- 每次对 routes 进行更新时，同步更新 `docs/openapi` 下的对应文档，并更新 README.md 中的 API 部分

## 文档结构
AGENTS.md（本文档）           项目的基本要求         
ARCHITECTURE.md             项目的工程结构
docs/                       项目相关的文档             
├── design/                 设计文档
│   ├── product/            产品设计
│   ├── implementation/     实现设计
├── openapi/                本服务对外提供的 API
├── references/             参考文档
│   ├── openapi/            项目中使用到的外部 API
├── src/                    源代码

- 编写代码前，先读取 `ARCHITECTURE.md` 确认项目结构。
- 编写 HTTP 接口层代码前：
1. 检查 `docs/openapi` 下的 OpenAPI Schema 定义
2. 更新 `src/types` 中的接口定义，再编写实现

## 限制
- `docs/design` 目录下的文档是系统设计的来源，不允许修改该目录下的任何内容