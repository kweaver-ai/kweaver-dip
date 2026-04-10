import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M512 1024A512 512 0 1 0 512 0a512 512 0 0 0 0 1024m0-73.165a438.886 438.886 0 1 1 0-877.773 438.886 438.886 0 0 1 0 877.773\"/><path d=\"M512 513.946h260.096a36.557 36.557 0 1 1 0 73.164H479.539a36.45 36.45 0 0 1-18.33-4.812 36.61 36.61 0 0 1-22.374-33.741V256A36.557 36.557 0 0 1 512 256z\"/>"

export default function TimeOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
