import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#fff\" d=\"M512 992a480 480 0 1 0 0-960 480 480 0 0 0 0 960\"/><path fill=\"#547ee8\" d=\"M960 512a448 448 0 1 0-896 0 448 448 0 0 0 896 0m64 0A512 512 0 1 1 0 512a512 512 0 0 1 1024 0\"/><path fill=\"#547ee8\" fill-opacity=\".45\" d=\"M1024 992a480 480 0 1 0 0-960 480 480 0 0 0 0 960\"/><path fill=\"#547ee8\" d=\"M1472 512a448 448 0 1 0-896 0 448 448 0 0 0 896 0m64 0a512 512 0 1 1-1024 0 512 512 0 0 1 1024 0\"/>"

export default function RightJoinColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1536 1024"
      content={svgContent}
    />
  )
}
