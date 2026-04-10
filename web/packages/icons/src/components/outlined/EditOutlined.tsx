import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M892.585 82.289a34.734 34.734 0 0 1 57.15 10.982 34.75 34.75 0 0 1-8.024 38.144l-403.67 392.361a34.744 34.744 0 1 1-49.142-49.142l403.686-392.33v-.01zM882.401 442.72a34.74 34.74 0 0 1 59.315-24.565 34.74 34.74 0 0 1 10.179 24.565V824.92c0 70.36-57.042 127.401-127.4 127.401H199.08c-70.364 0-127.401-57.042-127.401-127.401V199.511c0-70.364 57.037-127.406 127.401-127.406h370.616a34.74 34.74 0 0 1 0 69.494H199.081a57.907 57.907 0 0 0-57.907 57.907v625.413a57.907 57.907 0 0 0 57.907 57.912h625.413a57.923 57.923 0 0 0 57.907-57.912z\"/>"

export default function EditOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
