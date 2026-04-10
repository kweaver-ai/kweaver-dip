import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M515.145 329.07 876.983 592.09v298.57a60.343 60.343 0 0 1-60.782 60.196h-193.39v-294.4H399.506v294.4H208.603c-33.938 0-62.098-27.063-62.098-60.196V592.09l368.64-262.948zM512 73.143l512 380.05-64.366 82.213L512 203.045 64.366 535.405 0 453.194z\"/>"

export default function BackOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
