import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M0 512a512 512 0 1 0 1024 0A512 512 0 1 0 0 512\"/><path d=\"M73.143 512a438.857 438.857 0 1 0 877.714 0 438.857 438.857 0 1 0-877.714 0\"/>"

export default function SolidIncrementOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
