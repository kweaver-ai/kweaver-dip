import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M522.667 288v149.333h362.666v469.334H138.667V288zm-64 64h-256v490.667h618.666V501.333H458.667zm288 352v64h-64v-64zm-149.334 0v64h-64v-64zm149.334-128v64h-64v-64zm-149.334 0v64h-64v-64zM384 437.59v64H277.333v-64zm20.288-317.057c42.496-8.042 68.01-3.669 115.584 19.883l16.917 8.49 9.11 4.267c19.626 8.918 31.466 11.478 46.613 10.176l4.203-.426 7.21-1.11 3.883-.682a106.48 106.48 0 0 0 63.872-38.827l3.328-4.416 52.053 37.248-3.925 5.29A170.52 170.52 0 0 1 619.669 224c-42.496 8.021-68.053 3.648-115.605-19.904l-16.917-8.47c-27.158-13.247-40.15-16.383-59.456-14.037l-3.947.534-7.552 1.301a106.6 106.6 0 0 0-63.915 38.827l-3.328 4.394-52.032-37.29 3.947-5.27a170.62 170.62 0 0 1 103.403-63.552z\"/>"

export default function FactoryOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
