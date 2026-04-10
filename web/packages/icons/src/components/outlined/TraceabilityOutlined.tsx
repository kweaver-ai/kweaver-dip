import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M512 96c229.76 0 416 186.24 416 416 0 30.763-3.35 61.099-9.899 90.624l-2.624 11.03-62.08-15.574C860.437 570.176 864 541.333 864 512c0-194.41-157.59-352-352-352S160 317.59 160 512s157.59 352 352 352a350.5 350.5 0 0 0 225.408-81.621l2.304-1.984-250.09-245.547 44.757-45.717 258.538 253.824 38.315 37.696-22.4 22.826A414.76 414.76 0 0 1 512 928C282.24 928 96 741.76 96 512S282.24 96 512 96m0 213.333a202.667 202.667 0 0 1 198.613 243.179l-1.77 7.893-62.166-15.232A138.667 138.667 0 1 0 538.71 648.107l6.507-1.43 15.253 62.144A202.667 202.667 0 1 1 512 309.333\"/>"

export default function TraceabilityOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
