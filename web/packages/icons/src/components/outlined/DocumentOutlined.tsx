import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M654.827 117.333 864 326.507V928H160V117.333zm-68.16 63.979H224V864h576V394.667H586.667V181.333zM704 672v64H320v-64zm0-170.667v64H320v-64zM500.736 330.667v64H320v-64zm276.928 0L650.667 203.669v126.998z\"/>"

export default function DocumentOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
