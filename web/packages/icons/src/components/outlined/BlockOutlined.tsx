import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M512 69.717 895.019 290.86V733.14L512 954.283 128.981 733.14V290.86zM192.96 375.403V696.17L480 861.888V541.141l-287.04-165.76zm638.059 0L544 541.163v320.704l287.019-165.718V375.424zM512 143.637l-296.277 171.03L512 485.717l296.256-171.05L512 143.616z\"/>"

export default function BlockOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
