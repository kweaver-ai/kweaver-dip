import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M805.088 759.84 589.248 544H894.4a382.14 382.14 0 0 1-89.312 215.84M127.968 512C128 310.72 282.976 145.92 480 129.6V512c0 8.864 3.648 16.864 9.44 22.656l270.4 270.4A382.2 382.2 0 0 1 512 896c-212.064 0-384-171.904-384-384m766.4-32H544V129.6A383.68 383.68 0 0 1 894.4 480M512 64C264.96 64 64 264.96 64 512s200.96 448 448 448 448-200.96 448-448S759.04 64 512 64\"/>"

export default function RecordOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
