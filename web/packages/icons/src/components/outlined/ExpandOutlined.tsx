import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M451.413 998.691H75.545a52.646 52.646 0 0 1-52.585-52.585V570.177a52.646 52.646 0 1 1 105.23 0V893.4h323.284a52.585 52.585 0 1 1 0 105.291zm501.158-501.158a52.585 52.585 0 0 1-52.585-52.585V121.725H576.703a52.646 52.646 0 1 1 0-105.23H952.57a52.585 52.585 0 0 1 52.646 52.585v375.868a52.585 52.585 0 0 1-52.646 52.646z\"/>"

export default function ExpandOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
