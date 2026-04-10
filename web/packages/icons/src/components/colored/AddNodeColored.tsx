import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#126ee3\" d=\"M512 0C229.376 0 0 229.376 0 512s229.376 512 512 512 512-229.376 512-512S794.624 0 512 0m242.688 549.248H558.272v196.416c0 23.616-19.84 43.52-43.52 43.52a44.03 44.03 0 0 1-43.52-43.52V549.12H274.944a44.03 44.03 0 0 1-43.52-43.456c0-23.616 19.904-43.52 43.52-43.52H471.36V265.856c0-23.68 19.84-43.52 43.52-43.52 23.552 0 43.52 19.84 43.52 43.52v196.416h196.352c23.616 0 43.52 19.84 43.52 43.52 0 24.832-19.904 43.456-43.52 43.456z\"/>"

export default function AddNodeColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
