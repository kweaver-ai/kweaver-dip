/// <reference types="@rsbuild/core/types" />

/**
 * Imports the SVG file as a React component.
 * @requires [@rsbuild/plugin-svgr](https://npmjs.com/package/@rsbuild/plugin-svgr)
 */
declare module '*.svg?react' {
  import type React from 'react'
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
  export default ReactComponent
}

/**
 * 环境变量类型声明
 * 扩展 ImportMetaEnv 接口以支持自定义环境变量
 * 注意：此接口通过 TypeScript 接口合并机制扩展全局类型，linter 可能无法识别其使用
 */
// biome-ignore lint/correctness/noUnusedVariables: 接口扩展用于类型合并，实际会被 TypeScript 使用
interface ImportMetaEnv {
  // 是否跳过登录认证（设置为 'true' 时跳过）
  readonly PUBLIC_SKIP_AUTH?: string
  // 本地调试时使用的 access token（仅开发模式读取）
  readonly PUBLIC_TOKEN?: string
  // 本地调试时使用的 refresh token（仅开发模式读取）
  readonly PUBLIC_REFRESH_TOKEN?: string
}
