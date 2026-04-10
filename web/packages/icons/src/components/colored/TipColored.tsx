import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#1890ff\" d=\"M1024 512A512 512 0 1 0 0 512a512 512 0 0 0 1024 0\"/><path fill=\"#fff\" d=\"M448 832h128V448H448zm0-512h128V192H448z\"/>"

export default function TipColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
