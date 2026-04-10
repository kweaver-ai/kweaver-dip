import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M554.667 106.667v96h288v299.221h107.242v64H842.645l.022 276.779h-288V961.13h-64V842.667h-288V565.888H95.403v-64h107.264V202.667h288v-96zm-64 160h-224v235.221h106.389v64h-106.41l.02 212.779h224V683.52h64v95.147h224V565.888H672.278v-64h106.39V266.667h-224v117.61h-64z\"/>"

export default function AccurateOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
