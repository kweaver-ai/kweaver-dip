import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M207.258 512.036c0 50.841-41.283 92.124-92.16 92.124-50.898 0-92.16-41.283-92.16-92.124 0-50.934 41.267-92.196 92.16-92.196 50.877 0 92.16 41.262 92.16 92.196m793.804 0c0 50.841-41.277 92.124-92.16 92.124-50.877 0-92.16-41.283-92.16-92.124 0-50.934 41.283-92.196 92.16-92.196 50.883 0 92.16 41.262 92.16 92.196m-396.902 0c0 50.847-41.283 92.124-92.16 92.124-50.883 0-92.16-41.283-92.16-92.124 0-50.934 41.283-92.196 92.16-92.196s92.16 41.262 92.16 92.196\"/>"

export default function MoreOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
