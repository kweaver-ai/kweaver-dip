import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M906.667 266.667v640h-832v-640zM585.259 623.872l-94.592 94.592-94.614-94.613-218.837 218.816h626.88L585.259 623.85zm257.408-257.43-212.139 212.14 212.139 212.16v-424.32zm-704 0V790.72l212.138-212.117-212.138-212.139zm649.28-35.775H193.365l297.302 297.301z\"/>"

export default function MailOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
