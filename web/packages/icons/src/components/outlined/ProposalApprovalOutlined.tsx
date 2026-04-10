import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M575.232 896H160a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h544c17.664 0 32 14.336 32 32a32 32 0 0 0 64 0 96 96 0 0 0-96-96H160a96 96 0 0 0-96 96v704a96 96 0 0 0 96 96h415.232a32 32 0 0 0 0-64\"/><path d=\"M512 288a32 32 0 0 0-32-32H224a32 32 0 0 0 0 64h256a32 32 0 0 0 32-32m-32 192a32 32 0 0 0-32-32H224a32 32 0 0 0 0 64h224a32 32 0 0 0 32-32M224 672a32 32 0 0 0 0 64h128a32 32 0 0 0 0-64zm640-48h-66.176C822.08 556.288 864 431.648 864 416a160 160 0 0 0-320 0c0 20.064 39.84 139.744 65.696 208H544a96 96 0 0 0-96 96v32a96 96 0 0 0 96 96h320a96 96 0 0 0 96-96v-32a96 96 0 0 0-96-96m-221.536-98.464C623.104 469.76 608 420.608 608 416a96 96 0 1 1 192 0c0 6.304-52.192 158.464-70.336 208h-51.2c-8-20.16-22.4-59.264-36-98.464M896 752a32 32 0 0 1-32 32H544a32 32 0 0 1-32-32v-32a32 32 0 0 1 32-32h320a32 32 0 0 1 32 32z\"/>"

export default function ProposalApprovalOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
