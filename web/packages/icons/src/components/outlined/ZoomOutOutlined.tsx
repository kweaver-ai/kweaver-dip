import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M972.288 541.477H51.346a51.2 51.2 0 0 1 0-102.4h920.942a51.2 51.2 0 1 1 0 102.4\"/>"

export default function ZoomOutOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
