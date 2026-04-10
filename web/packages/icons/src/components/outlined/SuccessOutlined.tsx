import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M512 32a480 480 0 1 0 0 960 480 480 0 0 0 0-960m290.126 352.731-389.76 379.406a30.103 30.103 0 0 1-42.515 0L220.914 621.783a30.103 30.103 0 0 1 42.515-42.514l127.68 121.165L759.68 342.217a30.103 30.103 0 0 1 42.514 42.514z\"/>"

export default function SuccessOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
