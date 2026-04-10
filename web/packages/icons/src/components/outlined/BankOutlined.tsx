import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M650.667 117.333V448H928v458.667H138.667V117.333zm-64 64h-384v661.334H288V629.333h213.333v213.334h85.334zM864 512H650.667v330.667H864zM437.333 693.333H352v149.334h85.333zM500.011 448v64H286.677v-64zm0-149.333v64H286.677v-64z\"/>"

export default function BankOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
