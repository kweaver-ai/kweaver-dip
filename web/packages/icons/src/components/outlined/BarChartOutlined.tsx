import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M629.333 160v768H416V160zM352 352v576H138.667V352zm554.667 213.333V928H693.333V565.333zM565.333 224H480v640h85.333zM288 416h-85.333v448H288zm554.667 213.333h-85.334V864h85.334z\"/>"

export default function BarChartOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
