import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M862.315 117.333H161.707A108.35 108.35 0 0 0 53.333 225.685v593.942A108.35 108.35 0 0 0 161.685 928h700.608a108.35 108.35 0 0 0 108.352-108.352V225.707a108.35 108.35 0 0 0-108.33-108.374m0 64c24.49 0 44.352 19.84 44.352 44.352v593.942c0 24.49-19.84 44.352-44.352 44.352H161.707a44.35 44.35 0 0 1-44.374-44.331V225.707c0-24.534 19.84-44.374 44.352-44.374h700.608z\"/><path d=\"M938.667 362.667v64H85.333v-64zM619.093 640l154.027 2.133a32 32 0 1 1-.896 64L618.219 704a32 32 0 0 1 .896-64z\"/>"

export default function QuickPaymentOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
