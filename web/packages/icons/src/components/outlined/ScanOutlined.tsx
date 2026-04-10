import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M512 981.335A469.33 469.33 0 0 1 42.665 512 470.6 470.6 0 0 1 149.33 214.825a80.86 80.86 0 0 1 57.815-29.65 83.64 83.64 0 0 1 62.505 24.105l272.43 272.64a42.67 42.67 0 0 1-60.16 60.16L212.05 272.425A384 384 0 0 0 128 512a383.985 383.985 0 0 0 405.33 384A386.99 386.99 0 0 0 896 533.335a383.96 383.96 0 0 0-104.643-285.43A384.03 384.03 0 0 0 512 128a394.2 394.2 0 0 0-99.63 13.015 42.665 42.665 0 0 1-21.33-82.35 469.33 469.33 0 0 1 590.29 478.51 473.375 473.375 0 0 1-444.16 444.16z\"/>"

export default function ScanOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
