import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M384 832v85.333h-85.333V832zm405.333 0v85.333H704V832zM240.32 185.003l24.15 140.928h633.173l-62.358 420.736H271.66L186.325 248.98h-91.84v-64H240.32zM823.424 389.93h-547.99l50.198 292.736h454.464z\"/>"

export default function SellerCartOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
