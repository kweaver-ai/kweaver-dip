import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"m56.32 409.242 5.187-222.618 68.812 69.094A454.2 454.2 0 0 1 293.873 105.59a452 452 0 0 1 214.87-54.39c250.62 0 453.817 204.001 453.817 455.68S759.363 962.56 508.744 962.56a452.53 452.53 0 0 1-253.512-77.66A455.36 455.36 0 0 1 88.151 678.303a39.2 39.2 0 0 1 .205-29.886 38.96 38.96 0 0 1 21.186-20.987 38.72 38.72 0 0 1 29.763.205 38.98 38.98 0 0 1 20.9 21.279c28.17 69.617 75.182 133.658 137.267 175.616 62.09 41.958 137.795 67.707 212.634 67.697 207.672 0 383.77-176.825 383.77-385.347S715.181 121.533 507.51 121.533c-134.16 0-257.198 75.833-324.132 187.464l72.607 78.116z\"/>"

export default function RestoreOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
