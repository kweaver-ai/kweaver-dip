
## 1. 组件介绍

- **组件用途**：数字员工配置页面
- **整体结构**：包含 4 项，基本设定，技能配置，知识配置，通道接入
- **使用场景**：在做数字员工创建和编辑时使用

## 2. 组件结构

- **文件列表**： 
1. index.tsx，整体架构布局
2. utils.tsx， 工具方法
3. types.ts，类型声明、枚举定义
4. 基本设定，技能配置，知识配置，通道接入，4 项内容每个单开一个文件夹管理，每个子文件夹和外层差不多

## 3. 交互设计

### 3.1 Figma 设计稿链接

- 基本设定: `https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=1-644&t=OnGVj9Tt0YHIbMMR-4`
- 技能配置: 分为`已配置 技能`和`创建技能`两个 tab
1. 已配置技能为空时: `https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=12-146&t=OnGVj9Tt0YHIbMMR-4`
2. 已配置技能有内容时: `https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=12-659&t=OnGVj9Tt0YHIbMMR-4`
3. 创建技能:
3.1 第一步: `https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=23-1020&t=OnGVj9Tt0YHIbMMR-4`,
3.2 第二步: `https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=23-1502&t=OnGVj9Tt0YHIbMMR-4`,
3.2 第三步: `https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=24-1768&t=OnGVj9Tt0YHIbMMR-4`
- 知识配置: `https://www.figma.com/design/aBXIkIKngYPO63pHBw4G6B/%E6%95%B0%E5%AD%97%E5%91%98%E5%B7%A5?node-id=24-1986&t=OnGVj9Tt0YHIbMMR-4`

### 3.2 布局结构

- **整体布局**：整体分为上下布局
  - 顶部：子导航，包含返回，名称，取消和发布按钮
  - 底部：左右布局
    - 左侧：侧边栏，基本设定，技能配置，知识配置，通道接入，4 项菜单
    - 右侧：每项菜单的具体内容

## 4. 代码实现

### 4.1 Props 接口

- **接口定义**：提供完整的 TypeScript 接口定义
- **参数说明**：每个参数的类型、是否必填、用途说明
- **示例**：
  ```typescript
  interface ComponentProps {
    /** 参数说明 */
    prop1: string
    /** 参数说明 */
    prop2?: number
  }
  ```


### 4.4 样式规范

- **样式方案**：主要使用Tailwind样式方案，复杂情况可以使用CSS Modules


