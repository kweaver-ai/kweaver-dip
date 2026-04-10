import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M725.76 929.707a40.02 40.02 0 0 1-56.49 2.986L237.226 543.744A39.94 39.94 0 0 1 224 512.512a39.94 39.94 0 0 1 13.227-31.232L669.269 92.16a40.021 40.021 0 0 1 53.504 59.477l-400.64 360.79 400.64 360.789c16.384 14.848 17.75 40.107 2.987 56.49z\"/>"

export default function LeftOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
