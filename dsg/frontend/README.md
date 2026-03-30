# AnyFabric

本项目用于管理 AnyFabric 前端项目

## 环境准备

在机器上安装 Node >= 14.0.0 和 npm >= 5.6

全局安装 yarn `npm install -g yarn`

## 本地调试

### 安装依赖

在项目根目录中执行 `yarn` 安装所需依赖

### 启动项目

#### Vite 本地开发环境 (推荐)

在根目录中执行 `yarn dev` 启动 Vite 开发服务器

-   **优点**: 启动速度快、热更新效率高、内存占用低
-   **代理配置**: 自定义代理配置在 `config/proxy.ts` 中管理
-   **默认端口**: 3000 (如果端口被占用会自动选择下一个可用端口)
-   **访问地址**: [http://localhost:3000/](http://localhost:3000/)

#### Webpack 开发环境

在根目录中执行 `yarn start` 启动传统 Webpack 开发服务器

-   **适用场景**: 需要 Webpack 特定功能或调试 Webpack 构建问题时使用
-   **默认端口**: 3000
-   **访问地址**: [http://localhost:3000/](http://localhost:3000/)

### 浏览器访问

根据启动方式选择相应的地址访问：

-   Vite 开发环境: [http://localhost:3000/](http://localhost:3000/)
-   Webpack 开发环境: [http://localhost:3000/](http://localhost:3000/)

## 环境配置

### .env.development 配置说明

开发环境配置文件位于项目根目录下的 `.env.development`，包含以下配置：

```bash
# API 服务器地址
DEBUG_ORIGIN=https://10.4.111.24/

# 本地端口配置
PORT=3000
```

**配置说明**:

-   `DEBUG_ORIGIN`: 用于配置代理的目标服务器地址，所有 `/api/` 和 `/af/api/` 的请求都会被代理到此地址
-   `PORT`: 开发服务器监听的端口号，当端口被占用时 Vite 会自动递增选择可用端口

**代理配置**:

-   `/api/` → `${DEBUG_ORIGIN}/api/`
-   `/af/api/` → `${DEBUG_ORIGIN}/af/api/` (排除认证路由)
-   `/anyfabric/drawio-app` → `http://localhost:8080/webapp` (drawio 应用代理)

## 项目结构

```
any-fabric-front-end/
├── .env.development              # 开发环境变量配置
├── .env.production               # 生产环境变量配置
├── .eslintrc                     # ESLint 配置
├── .gitignore                    # Git 忽略文件
├── .husky/                       # Git hooks 配置
├── .prettierrc.js                # Prettier 配置
├── .stylelintrc.json             # Stylelint 配置
├── .vscode/                      # VS Code 编辑器配置
├── build/                        # 构建输出目录
├── ci/                           # CI/CD 配置
├── config/                       # 项目配置文件
│   ├── env.js                    # 环境变量处理
│   ├── proxy.ts                  # 代理配置
│   ├── webpack.config.js         # Webpack 配置
│   └── jest/                     # Jest 测试配置
├── docs/                         # 项目文档
├── index.html                    # HTML 模板
├── package.json                  # 项目依赖和脚本
├── pipelines/                    # 管道配置
├── public/                       # 静态资源
├── README.md                     # 项目说明文档
├── scripts/                      # 构建脚本
├── src/                          # 源代码目录
│   ├── apps/                     # 微应用
│   ├── assets/                   # 静态资源
│   ├── components/               # 可复用组件
│   ├── context/                  # React Context
│   ├── core/                     # 核心功能
│   ├── font/                     # 字体文件
│   ├── hooks/                    # 自定义 Hooks
│   ├── icons/                    # SVG 图标组件
│   ├── layout/                   # 布局组件
│   ├── pages/                    # 页面组件
│   ├── redux/                    # Redux 状态管理
│   ├── routers/                  # 路由配置
│   ├── types/                    # TypeScript 类型定义
│   ├── ui/                       # UI 基础组件
│   ├── utils/                    # 工具函数
│   ├── App.tsx                   # 根组件
│   └── index.tsx                 # 应用入口
├── tests/                        # 测试文件
├── tsconfig.json                 # TypeScript 配置
├── vite.config.js                # Vite 配置
├── vite-plugin-middleware.js     # Vite 中间件插件
└── yarn.lock                     # 依赖锁定文件
```

**关键说明**:

-   `config/proxy.ts`: 集中管理所有代理配置
-   `vite.config.js`: Vite 构建工具配置（推荐用于开发）
-   `config/webpack.config.js`: 传统 Webpack 配置

## 待办事项

-   [ ] SVG 引入方案统一
-   [ ] Rspack 生产环境构建迁移

#### ⚠️ Vite 开发环境注意事项

使用 Vite 开发环境时需要注意以下兼容性问题：

**Monaco Editor 相关问题**

-   **Web Workers 限制**: Monaco Editor 在 Vite 环境下使用 Web Workers 进行语法高亮和代码提示功能，可能需要额外的 Worker 配置
-   **模块解析**: Monaco 的模块加载机制与 Vite 的 ESM 模块系统可能存在冲突，建议使用 `@monaco-editor/loader` 或配置 vite-plugin-monaco-editor
-   **构建产物**: 生产环境构建时需要确保 Monaco 的相关资源正确处理

**CodeMirror 兼容性**

-   **动态导入**: CodeMirror 6 的某些插件使用动态导入，在 Vite 开发环境下可能需要额外配置
-   **CSS 处理**: CodeMirror 的主题样式可能需要通过 CSS modules 或 Less 变量进行统一管理
-   **插件加载**: 某些 CodeMirror 插件可能需要在构建时进行特殊处理

**其他特殊依赖**

-   **@antv 系列图表库**: G2Plot、G6、S2、X6 等可视化库在 Vite 环境下通常工作正常，但需要注意 Canvas/WebGL 相关功能的兼容性
-   **微前端架构**: qiankun 框架与 Vite 的兼容性需要特别注意，建议使用 `vite-plugin-qiankun` 或相关适配方案

**推荐的解决方案**

1. 使用 `vite-plugin-monaco-editor` 或官方的 `@monaco-editor/loader`
2. 为 CodeMirror 配置适当的别名和解析策略
3. 在 `vite.config.js` 中添加 `optimizeDeps` 配置预构建特殊依赖
4. 生产环境建议考虑使用 Rspack 或 Webpack 以获得更好的兼容性
