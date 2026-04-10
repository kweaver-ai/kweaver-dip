import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M926.421 157.12v341.333H797.013l.022 404.011-156.267-77.376-132.139 66.773-132.138-66.773-155.456 76.8-.022-403.435H94.421V157.12zM733.013 359.765h-448v439.126l91.798-45.334 131.818 66.56 131.883-66.56 92.501 45.782zM636.95 603.968v64h-256v-64zm0-147.05v64h-256v-64zm225.472-235.82h-704v213.334h62.592l.022-138.667h576l-.022 138.667h65.408z\"/>"

export default function InvoiceOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
