import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M458.667 501.333v341.334H160V501.333zm384 85.334v256H544v-256zm-448-21.334H224v213.334h170.667zm384 85.334H608v128h170.667zm64-490.667v341.333H544V160zm-64 64H608v213.333h170.667zm-320-64v256H160V160zm-64 64H224v128h170.667z\"/>"

export default function GlobalScaleOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
