import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M768.555 824.49v64H258.667v-64zm138.112-643.157v533.334H117.333V181.333zm-64 64H181.333v405.334h661.334zm-432.384 74.454 45.269 45.226L372.565 448l82.987 82.987-45.27 45.226L282.07 448zm203.434 0L741.931 448 613.717 576.213l-45.269-45.226L651.435 448l-82.987-82.987z\"/>"

export default function TechnicalOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
