import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#fff\" d=\"M0 512c0 282.767 229.233 512 512 512s512-229.233 512-512S794.767 0 512 0 0 229.233 0 512\"/><path fill=\"#1890ff\" d=\"M85.335 512c0 235.643 191.027 426.665 426.665 426.665 235.643 0 426.665-191.027 426.665-426.665 0-235.643-191.027-426.665-426.665-426.665C276.357 85.335 85.335 276.362 85.335 512\"/><path fill=\"#fff\" d=\"M426.665 192a64 64 0 0 1 63.406 55.296l.594 8.704v277.335H768a64 64 0 0 1 63.401 55.296l.599 8.704a64 64 0 0 1-55.296 63.401l-8.704.599H426.665a64 64 0 0 1-63.401-55.296l-.599-8.704V256c0-35.348 28.657-64 64-64\"/>"

export default function ScanHistoryColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
