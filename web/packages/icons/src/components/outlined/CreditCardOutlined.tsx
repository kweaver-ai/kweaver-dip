import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M928 181.333v661.334H96V181.333zm-64 237.099H160v360.235h704zM789.333 640v64h-192v-64zM864 245.333H160v109.099h704z\"/>"

export default function CreditCardOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
