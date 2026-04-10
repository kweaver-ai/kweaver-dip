import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M48.904 187.698h926.448a46.335 46.335 0 0 0 0-92.67H48.904a46.335 46.335 0 1 0 0 92.67m926.448 276.733H405.717a46.335 46.335 0 0 0 0 92.67h569.635a46.335 46.335 0 0 0 0-92.67m0 371.448H48.904a46.335 46.335 0 0 0 0 92.607h926.448a46.335 46.335 0 1 0 0-92.67zM232.71 279.857 1.163 511.341 232.71 742.953v-463.16z\"/>"

export default function CollapseOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
