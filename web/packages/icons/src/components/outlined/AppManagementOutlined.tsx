import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M192 160a32 32 0 0 0-32 32v192a32 32 0 0 0 32 32h192a32 32 0 0 0 32-32V192a32 32 0 0 0-32-32zm0-64h192a96 96 0 0 1 96 96v192a96 96 0 0 1-96 96H192a96 96 0 0 1-96-96V192a96 96 0 0 1 96-96m0 512a32 32 0 0 0-32 32v192a32 32 0 0 0 32 32h192a32 32 0 0 0 32-32V640a32 32 0 0 0-32-32zm0-64h192a96 96 0 0 1 96 96v192a96 96 0 0 1-96 96H192a96 96 0 0 1-96-96V640a96 96 0 0 1 96-96m448 64a32 32 0 0 0-32 32v192a32 32 0 0 0 32 32h192a32 32 0 0 0 32-32V640a32 32 0 0 0-32-32zm0-64h192a96 96 0 0 1 96 96v192a96 96 0 0 1-96 96H640a96 96 0 0 1-96-96V640a96 96 0 0 1 96-96m-37.728-277.728a32 32 0 0 0 0 45.28l112 112a32 32 0 0 0 45.28 0l112-112a32 32 0 0 0 0-45.28l-112-112a32 32 0 0 0-45.28 0zm-45.248-45.248 112-112a96 96 0 0 1 135.776 0l112 112a96 96 0 0 1 0 135.776l-112 112a96 96 0 0 1-135.776 0l-112-112a96 96 0 0 1 0-135.776\"/>"

export default function AppManagementOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
