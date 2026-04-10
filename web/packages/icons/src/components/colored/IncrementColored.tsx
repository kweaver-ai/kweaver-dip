import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#ddefe4\" d=\"M0 512a512 512 0 1 0 1024 0A512 512 0 1 0 0 512\"/><path fill=\"#51ad75\" d=\"M219.429 512a292.571 292.571 0 1 0 585.142 0 292.571 292.571 0 1 0-585.142 0\"/>"

export default function IncrementColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
