import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M336 544c-79.392 0-144 64.608-144 144s64.608 144 144 144 144-64.608 144-144-64.608-144-144-144m0 224c-44.096 0-80-35.872-80-80s35.904-80 80-80 80 35.872 80 80-35.904 80-80 80m464-512H588.576a32 32 0 1 0 0 64H800a32 32 0 1 0 0-64m0 320H588.576a32 32 0 1 0 0 64H800a32 32 0 1 0 0-64m0-192H588.576a32 32 0 1 0 0 64H800a32 32 0 1 0 0-64m0 328H588.576a32 32 0 1 0 0 64H800a32 32 0 1 0 0-64M440 235.808 319.008 384.416l-71.04-80.352a32 32 0 0 0-47.936 42.4l71.008 80.352a63.65 63.65 0 0 0 48.032 21.632 63.36 63.36 0 0 0 49.536-23.584L489.6 276.192a32 32 0 0 0-49.6-40.384\"/><path d=\"M896 64H128c-35.296 0-64 28.704-64 64v768c0 35.296 28.704 64 64 64h768c35.296 0 64-28.704 64-64V128c0-35.296-28.704-64-64-64M128 896V128h768l.064 768z\"/>"

export default function ToDolistOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
