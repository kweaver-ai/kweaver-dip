import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M298.24 929.707c14.848 16.469 40.107 17.749 56.49 2.986l432.043-388.949A39.94 39.94 0 0 0 800 512.512a39.94 39.94 0 0 0-13.227-31.232L354.731 92.16a40.021 40.021 0 0 0-53.504 59.477l400.64 360.704-400.64 360.79a40.02 40.02 0 0 0-2.987 56.49z\"/>"

export default function RightOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
