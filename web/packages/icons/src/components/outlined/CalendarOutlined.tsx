import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M896 64H736V32a32 32 0 1 0-64 0v32H352V32a32 32 0 1 0-64 0v32H128A128 128 0 0 0 0 192v672a128 128 0 0 0 128 128h768a128 128 0 0 0 128-128V192A128 128 0 0 0 896 64M64 192a64 64 0 0 1 64-64h160v32a32 32 0 1 0 64 0v-32h320v32a32 32 0 1 0 64 0v-32h160a64 64 0 0 1 64 64v96H64zm896 672a64 64 0 0 1-64 64H128a64 64 0 0 1-64-64V352h896z\"/><path d=\"M224 544h192a32 32 0 0 0 0-64H224a32 32 0 0 0 0 64m0 192h192a32 32 0 0 0 0-64H224a32 32 0 0 0 0 64m384-192h192a32 32 0 0 0 0-64H608a32 32 0 0 0 0 64m0 192h192a32 32 0 0 0 0-64H608a32 32 0 0 0 0 64\"/>"

export default function CalendarOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
