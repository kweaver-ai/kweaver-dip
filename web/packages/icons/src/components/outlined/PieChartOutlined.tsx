import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M512 117.333c229.76 0 416 186.24 416 416s-186.24 416-416 416-416-186.24-416-416 186.24-416 416-416m-32 65.43c-179.413 16.17-320 166.954-320 350.57 0 194.411 157.59 352 352 352 85.675 0 164.203-30.613 225.237-81.493L498.752 565.333H480zm302.507 575.786a350.42 350.42 0 0 0 80.064-193.216H589.227l193.28 193.238zM544 182.784v318.55h318.57C847.36 332.5 712.876 197.973 544 182.783\"/>"

export default function PieChartOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
