import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M512 671.795a160 160 0 1 1-11.162-319.744A160 160 0 0 1 512 671.744zM0 480h128v64H0zm192 0h128v64H192zm512 0h128v64H704zm192 0h128v64H896zM480 192h64v128h-64zm0-192h64v128h-64zm0 896h64v128h-64zm0-192h64v128h-64z\"/>"

export default function PointOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
