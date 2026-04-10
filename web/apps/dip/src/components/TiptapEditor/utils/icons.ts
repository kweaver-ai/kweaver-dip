import clsx from 'clsx'
import type { CSSProperties } from 'react'
import React from 'react'
import { renderToString } from 'react-dom/server'
import IconFont from '@/components/IconFont'

export function icon(name: string) {
  return `<span class="dip-prose-mirror-icon dip-prose-mirror-icon-${name}"></span>`
}

export interface RenderIconFontOptions {
  type: string
  className?: string
  style?: CSSProperties
}

/**
 * 将 IconFont 组件渲染为 HTML 字符串
 * @param options 包含 type、className、style 的选项对象
 * @returns HTML 字符串
 */
export function renderIconFont(options: RenderIconFontOptions): string {
  const props: { type: string; className?: string; style?: CSSProperties } = { type: options.type }
  const defaultClassName = '!text-base'
  // 始终应用默认类名，如果有传入的 className 则合并
  props.className = options.className ? clsx(defaultClassName, options.className) : defaultClassName
  if (options.style) {
    props.style = options.style
  }

  return renderToString(React.createElement(IconFont, props))
}
