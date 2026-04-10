import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M964.23 499.24a16 16 0 0 0-8-13.85l-222-128.26a16 16 0 0 0-16 0l-110 63.55a16 16 0 0 0-8 13.85v41.58a8 8 0 0 0 12 6.93l106-61.24a16 16 0 0 1 16 0l166 95.9a16 16 0 0 1 8 13.85v197.9a16 16 0 0 1-8 13.85l-166 95.9a16 16 0 0 1-16 0l-166-95.9a16 16 0 0 1-8-13.85V255.72a16 16 0 0 0-8-13.85l-222-128.26a16 16 0 0 0-16 0l-222 128.26a16 16 0 0 0-8 13.85v262.53a16 16 0 0 0 8 13.85l222 128.26a16 16 0 0 0 16 0l110-63.55a16 16 0 0 0 8-13.85v-41.58a8 8 0 0 0-12-6.93l-106 61.24a16 16 0 0 1-16 0l-166-95.9a16 16 0 0 1-8-13.85V288a16 16 0 0 1 8-13.85l166-95.9a16 16 0 0 1 16 0l166 95.9a16 16 0 0 1 8 13.85v473.77a16 16 0 0 0 8 13.85l222 128.26a16 16 0 0 0 16 0l222-128.26a16 16 0 0 0 8-13.85z\"/>"

export default function SupplyChainOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
