import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M650.667 117.333v256h-96V480h288v170.667H928v234.666H693.333V650.667h85.334V544h-512v106.667H352v234.666H117.333V650.667h85.334V480h288V373.333h-96v-256zM288 714.667H181.333v106.666H288zm576 0H757.333v106.666H864zM586.667 181.333h-128v128h128z\"/>"

export default function BranchOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
