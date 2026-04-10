import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M378.525 851.84a84.978 84.978 0 1 0 0 169.884 84.978 84.978 0 0 0 0-169.883m0-424.818a84.978 84.978 0 1 0 0 169.956 84.978 84.978 0 0 0 0-169.956m0-424.746a84.978 84.978 0 1 0 0 169.883 84.978 84.978 0 0 0 0-169.883M718.293 851.84a84.978 84.978 0 1 0 0 169.883 84.978 84.978 0 0 0 0-169.883m0-424.82a84.978 84.978 0 1 0 0 169.957 84.978 84.978 0 0 0 0-169.956m0-424.745a84.978 84.978 0 1 0 0 169.883 84.978 84.978 0 0 0 0-169.883\"/>"

export default function SortableOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
