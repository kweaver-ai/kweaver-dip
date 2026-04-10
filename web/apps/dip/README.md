# DIP 数字员工

## 安装依赖

```bash
pnpm install
```

## 启动

```bash
pnpm run dev
```

默认访问地址：[http://localhost:3000](http://localhost:3000)

## 调试

### 修改配置

复制 `.env.example` → `.env.local`，修改配置

```bash
DEBUG_ORIGIN=https://your-backend-origin # DIP Studio 服务的访问地址（本地通常是 http://127.0.0.1:3000）
PUBLIC_TOKEN=your_access_token # 可以为空
PUBLIC_REFRESH_TOKEN=your_refresh_token # 可以为空
```

### 跳过认证

在 `.env.local` 中新增配置：

`PUBLIC_SKIP_AUTH=true`

### 切换 admin / 普通用户

在 `.env.local` 中新增配置：

`PUBLIC_IS_ADMIN=true`


## 生产构建

构建：

```bash
yarn run build
```

本地预览生产版本:

```bash
yarn run preview
```
