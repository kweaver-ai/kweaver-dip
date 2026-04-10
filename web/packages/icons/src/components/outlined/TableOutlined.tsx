import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M-15.886 59.526v904.948h1055.772V59.526zM641.86 590.504H382.29V370.98h259.57zm-328.798 0H53.493V370.98h259.57zM53.493 896.226V659.43h259.57v236.795zm328.798 0V659.43H641.86v236.795zm588.291 0H711.164V659.43h259.418zm0-305.722H711.164V370.98h259.418zM711.164 302.278H53.494V128.151h917.013v174.203H711.089z\"/>"

export default function TableOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
