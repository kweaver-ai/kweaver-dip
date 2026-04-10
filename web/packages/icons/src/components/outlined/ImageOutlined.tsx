import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M906.667 160v704h-768V160zM739.605 526.4 523.2 706.496l-140.565-110.89L202.667 741.14V800h640V611.883zM842.667 224h-640v434.837l179.477-145.13 139.968 110.421 217.45-180.907 103.105 85.504zm-437.334 42.667a96 96 0 1 1 0 192 96 96 0 0 1 0-192m0 64a32 32 0 1 0 0 64 32 32 0 0 0 0-64\"/>"

export default function ImageOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
