import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M498.603 191.744a204.715 204.715 0 0 1 116.906 372.8c133.163 47.317 229.078 173.29 231.894 322.027l.085 6.784h-64c0-157.334-127.573-284.886-284.885-284.886-155.136 0-281.302 123.968-284.822 278.251l-.085 6.613h-64c0-151.68 96.81-280.746 232-328.81a204.715 204.715 0 0 1 116.907-372.8zm0 64a140.715 140.715 0 1 0 0 281.45 140.715 140.715 0 0 0 0-281.45\"/>"

export default function SmallUserOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
