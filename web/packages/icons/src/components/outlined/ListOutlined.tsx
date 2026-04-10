import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M96 174.72a64 64 0 0 1 0-128h896a64 64 0 1 1 0 128zm0 393.92a64 64 0 0 1 0-128h896a64 64 0 1 1 0 128zm0 393.856a64 64 0 1 1 0-128h896a64 64 0 1 1 0 128z\"/>"

export default function ListOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1092 1024"
      content={svgContent}
    />
  )
}
