import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#52c41a\" d=\"M512 0c282.752 0 512 229.248 512 512s-229.248 512-512 512S0 794.752 0 512 229.248 0 512 0m0 42.667C252.8 42.667 42.667 252.8 42.667 512S252.8 981.333 512 981.333 981.333 771.2 981.333 512 771.2 42.667 512 42.667\"/><path fill=\"#52c41a\" d=\"M170.667 170.667h682.666v682.666H170.667z\" opacity=\".01\"/><path fill=\"#52c41a\" d=\"M778.667 297.344h-46.592a21.25 21.25 0 0 0-16.726 8.107L440.448 653.653 308.651 486.656a21.33 21.33 0 0 0-16.726-8.107h-46.592a5.333 5.333 0 0 0-4.181 8.576l182.613 231.339c8.534 10.795 24.918 10.795 33.494 0l325.589-412.587a5.29 5.29 0 0 0-4.181-8.533\"/>"

export default function SuccessColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
