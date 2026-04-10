import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M972.727 460.8H563.419V51.493a51.2 51.2 0 0 0-102.4 0V460.8H51.86a51.2 51.2 0 0 0 0 102.4h409.307v409.307a51.2 51.2 0 1 0 102.327 0V563.2H972.8a51.2 51.2 0 1 0 0-102.4z\"/>"

export default function ZoomInOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
