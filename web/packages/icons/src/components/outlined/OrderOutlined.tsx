import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M714.667 117.333v64h170.666v704H138.667v-704h170.666v-64zm-405.334 128H202.667v576h618.666v-576H714.667v64H309.333zM704 618.667v64H320v-64zm0-192v64H320v-64zm-53.333-245.334H373.333v64h277.334z\"/>"

export default function OrderOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
