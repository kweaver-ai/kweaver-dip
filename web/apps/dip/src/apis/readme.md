# API 目录结构规范

## 目录组织

1. **通用类型定义**：放在 `apis/types.ts` 文件里（如 `PageParams`、`ListResponse` 等）
2. **功能划分**：按照功能模块划分文件夹（如 `applications`、`login`、`user` 等）

## 文件夹结构

每个功能文件夹下**必须**包含以下两个基础文件：

### 必需文件

- **`index.ts`**：声明该功能相关的接口请求方法

  - 可以直接在文件中编写所有接口方法
  - 也可以按子功能拆分到单独文件，然后在 `index.ts` 中统一导出
  - 示例：

    ```typescript
    // 方式一：直接编写
    export function getApplications() { ... }

    // 方式二：拆分后统一导出
    export * from './applications'
    ```

- **`index.d.ts`**：声明接口请求和返回相关的数据结构（TypeScript 类型定义）
  - 导出该功能相关的所有类型接口
  - 示例：
    ```typescript
    export interface Application { ... }
    export interface User { ... }
    ```

## 功能模块划分

- **`applications`**：应用相关接口（如应用列表、应用详情、应用上传等）
- **`login`**：登录相关接口（如登录、登出、刷新 token 等）
- **`user`**：用户相关接口（如用户信息、用户设置等）

## 示例结构

```
apis/
├── types.ts              # 通用类型定义
├── applications/
│   ├── index.ts          # 应用相关接口请求方法
│   └── index.d.ts        # 应用相关类型定义
├── login/
│   ├── index.ts          # 登录相关接口请求方法
│   └── index.d.ts        # 登录相关类型定义
└── user/
    ├── index.ts          # 用户相关接口请求方法
    └── index.d.ts        # 用户相关类型定义
```
