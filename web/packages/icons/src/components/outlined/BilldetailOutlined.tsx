import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M832.51 111.85h-632a32 32 0 0 0-32 32v728a32 32 0 0 0 32 32h632a32 32 0 0 0 32-32v-728a32 32 0 0 0-32-32m-608 736v-680h584v680z\"/><path d=\"M744.51 271.85h-456a8 8 0 0 0-8 8v40a8 8 0 0 0 8 8h456a8 8 0 0 0 8-8v-40a8 8 0 0 0-8-8m0 152h-456a8 8 0 0 0-8 8v40a8 8 0 0 0 8 8h456a8 8 0 0 0 8-8v-40a8 8 0 0 0-8-8m-176 160h-280a8 8 0 0 0-8 8v40a8 8 0 0 0 8 8h280a8 8 0 0 0 8-8v-40a8 8 0 0 0-8-8\"/>"

export default function BilldetailOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
