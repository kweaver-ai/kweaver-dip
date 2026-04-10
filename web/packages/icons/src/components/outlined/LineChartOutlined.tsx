import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M896 896H96a32 32 0 0 1-32-32V224a32 32 0 0 1 64 0v608h768a32 32 0 1 1 0 64\"/><path d=\"M247.008 640a32 32 0 0 1-20.992-56.192l200.992-174.24a32 32 0 0 1 42.272.288l172.128 153.44 229.088-246.304a32 32 0 0 1 46.88 43.616L666.944 629.824a31.936 31.936 0 0 1-44.704 2.08l-174.56-155.52-179.744 155.84A31.87 31.87 0 0 1 247.008 640\"/>"

export default function LineChartOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
