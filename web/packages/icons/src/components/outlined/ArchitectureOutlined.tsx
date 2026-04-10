import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"m849.067 644.779 64.32 35.754-397.483 226.795-404.373-226.795 64.789-35.754L515.883 833.45zm0-170.667 64.32 35.755L515.904 736.66 111.531 509.867l64.789-35.755 339.563 188.672zM515.904 110.507 922.517 339.2 515.904 567.915 109.291 339.2l406.613-228.715zm0 73.429L239.829 339.2l276.075 155.264L791.957 339.2 515.904 183.915z\"/>"

export default function ArchitectureOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
