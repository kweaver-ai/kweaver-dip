import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M371.776 85.333v117.398h98.133V85.333h64v117.398h98.134V85.333h64v117.398H815.38v110.933h115.99v64H815.36v98.133h115.99v64H815.36v98.134h115.99v64H815.36v112H696.021v117.44h-64V813.93h-98.133v117.44h-64V813.93h-98.133v117.44h-64V813.93H204.18v-112H85.333v-64h118.848v-98.134H85.333v-64h118.848v-98.133H85.333v-64h118.848V202.731h103.595V85.333zm379.605 181.398h-483.2v483.2h483.2zm-98.133 98.133v286.933H366.315V364.864zm-64 64H430.315v158.933h158.933z\"/>"

export default function PerformanceComputingOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
