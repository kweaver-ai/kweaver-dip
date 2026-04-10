import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M768 832a64 64 0 1 1 .032-128.032A64 64 0 0 1 768 832m-448-64a64 64 0 1 1-128.032-.032A64 64 0 0 1 320 768m128-512a64 64 0 1 1 128.032.032A64 64 0 0 1 448 256m352 388.544V480H544V379.456c55.072-14.304 96-64 96-123.456 0-70.592-57.44-128-128-128-70.592 0-128 57.408-128 128 0 59.456 40.928 109.152 96 123.456V480H224v164.544c-55.072 14.304-96 64-96 123.456 0 70.592 57.408 128 128 128 70.56 0 128-57.408 128-128 0-59.456-40.928-109.152-96-123.456V544h448v100.544c-55.072 14.304-96 64-96 123.456 0 70.592 57.408 128 128 128 70.56 0 128-57.408 128-128 0-59.456-40.928-109.152-96-123.456\"/>"

export default function FlowOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
