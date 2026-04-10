import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M512 0a512 512 0 1 1 0 1024A512 512 0 0 1 512 0m0 73.143a438.857 438.857 0 1 0 0 877.714 438.857 438.857 0 0 0 0-877.714\"/>"

export default function IncrementOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
