import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M263.29 344.04h224q8 0 8 8v48q0 8-8 8h-224q-8 0-8-8v-48q0-8 8-8M263.29 480.04h224q8 0 8 8v48q0 8-8 8h-224q-8 0-8-8v-48q0-8 8-8\"/><path d=\"M951.29 832h-72V416a32 32 0 0 0-32-32h-176a8 8 0 0 0-8 8v40a8 8 0 0 0 8 8h152v392h-216V192a32 32 0 0 0-32-32h-400a32 32 0 0 0-32 32v640h-72a8 8 0 0 0-8 8v40a8 8 0 0 0 8 8h880a8 8 0 0 0 8-8v-40a8 8 0 0 0-8-8m-752 0V216h352v616z\"/>"

export default function CompanyOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
