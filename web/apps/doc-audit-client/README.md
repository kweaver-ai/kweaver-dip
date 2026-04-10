# Doc Audit Client (React)

基于 React 18 + TypeScript + Ant Design 5 + Less Modules + Rsbuild 的文档审批客户端，作为 **qiankun 子应用**嵌入宿主；HTTP 与鉴权由宿主在 `mount` 时注入。

**包名**: `doc-audit-client`（与 UMD 输出、qiankun 注册名一致）

## 技术栈

- **框架**: React 18
- **语言**: TypeScript 5
- **UI**: Ant Design 5、`@ant-design/icons`、`@ant-design/cssinjs`（`StyleProvider`）
- **样式**: Less Modules（类名建议 `xx-xx` 风格）
- **构建**: Rsbuild（UMD、SVGR、别名 `@` → `src`）
- **状态**: Zustand（`store/app`、`store/dict`）
- **国际化**: react-intl-universal（`src/i18n/locales/`）
- **HTTP**: Axios（`src/utils/http/`，`query-string` 序列化查询参数）
- **微前端**: qiankun（`src/index.tsx` 导出生命周期）
- **工具库**: classnames、dayjs、lodash

## 目录结构

```
doc-audit-client-react/
├── public/                   # HTML 模板（含 #doc-audit-client-root）
├── rsbuild.config.ts         # 构建、代理、UMD、Less 主题前缀
└── src/
    ├── api/                  # API 封装
    │   ├── doc-audit-rest.ts
    │   ├── workflow-rest.ts
    │   ├── efast.ts / eacp.ts
    │   ├── user-management.ts
    │   └── index.ts
    ├── assets/               # SVG 等静态资源
    ├── components/           # Badge、FileIcon、MultiChoice、UserAvatarName
    ├── i18n/                 # react-intl-universal + locales（zh-cn / en-us / zh-tw）
    ├── pages/audit/          # AuditList、AuditDetail、FlowLogDetail、index（todo/done/apply）
    ├── store/                # app / dict
    ├── styles/
    ├── types/
    ├── utils/                # http/、biz-type、date、file、url-search-params
    ├── env.d.ts
    ├── public-path.ts
    ├── App.tsx
    └── index.tsx             # qiankun 生命周期与 render
```

## 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

默认端口 **8080**，响应头允许跨域，便于主应用加载子应用。

```bash
npm run dev
```

**说明**: 入口 `src/index.tsx` 仅在 qiankun 调用 `mount` 时执行 `render`。单独用浏览器打开开发页且未接入主应用时，若未自行 mock 并调用 `mount`，根节点可能无内容——一般通过 **主应用 + qiankun** 联调。

`rsbuild.config.ts` 中开发代理示例（可按本地后端修改 `target`）：

- `/api/doc-audit-rest`
- `/api/workflow-rest`
- `/api/efast`

### 构建与预览

```bash
npm run build
npm run preview
```

### 代码检查

```bash
npm run lint
npm run lint:fix
npm run type-check
```

## 微前端与运行时配置

`mount` 从宿主传入的 `AppContext` / `microWidgetProps` 读取并设置：

- 语言、`prefix`、业务域 ID
- Token、`refreshOauth2Token`、`onTokenExpired`
- 网关：由 `systemInfo.location` / `realLocation` 推导 `protocol`、`host`、`port`，再 `setHttpConfig` 写入 `src/utils/http`

UMD 库名与 `package.json` 的 `name` 字段一致：`doc-audit-client`。

## Less Modules 命名规范

样式类名建议采用 `xx-xx` 形式，例如：

```less
.todo-list-container {
  // ...
}

.header-left {
  // ...
}

.empty-state {
  // ...
}
```

## 环境变量

仓库未强制提交 `.env`；业务地址与鉴权以 **宿主在 mount 时注入** 为主。若需客户端环境变量，可使用 Rsbuild 的 `PUBLIC_*` 等约定，参见 [Rsbuild 环境变量](https://rsbuild.dev/guide/advanced/env-vars)。

## 从原项目迁移

| 原项目            | 新项目                             |
| ----------------- | ---------------------------------- |
| Vue 2.7           | React 18                           |
| Vue Router 3      | Tabs + URL 查询参数（`target` 等） |
| Vuex              | Zustand                            |
| Element UI 2.9    | Ant Design 5                       |
| Vue CLI + Webpack | Rsbuild                            |
| JavaScript        | TypeScript                         |
| vue-i18n          | react-intl-universal               |
| Scoped CSS        | Less Modules                       |
