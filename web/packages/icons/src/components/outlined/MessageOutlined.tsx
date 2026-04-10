import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M896 128H128a32 32 0 0 0-32 32v576a32 32 0 0 0 32 32h288v-64H160V192h704v512H608c-8.832 0-16.832 3.584-22.656 9.376l-159.968 160 45.248 45.248L621.248 768H896a32 32 0 0 0 32-32V160a32 32 0 0 0-32-32\"/><path d=\"M560 448a48 48 0 1 0-95.968-.032A48 48 0 0 0 560 448m-320 0a48 48 0 1 0 95.968.032A48 48 0 0 0 240 448m544 0a48 48 0 1 0-95.968-.032A48 48 0 0 0 784 448\"/>"

export default function MessageOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
