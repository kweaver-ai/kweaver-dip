import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#01a2e0\" d=\"M928 392c-16 0-32 14.4-32 32 0 259.2-212.8 472-472 472-16 0-32 14.4-32 32 0 16 14.4 32 32 32 296-1.6 536-241.6 536-536 0-17.6-12.8-32-32-32\"/><path fill=\"#b9d9eb\" d=\"M737.6 595.2c30.4-49.6 60.8-115.2 54.4-208C779.2 195.2 606.4 49.6 443.2 64c-65.6 4.8-131.2 59.2-126.4 152 3.2 40 22.4 64 54.4 83.2 30.4 17.6 70.4 28.8 115.2 41.6 54.4 16 116.8 32 166.4 68.8 57.6 43.2 97.6 92.8 84.8 185.6\"/><path fill=\"#01a2e0\" d=\"M118.4 259.2C88 308.8 57.6 374.4 64 467.2c12.8 192 185.6 337.6 350.4 321.6 64-4.8 129.6-59.2 124.8-152-3.2-40-22.4-64-54.4-83.2-30.4-17.6-70.4-28.8-115.2-41.6-54.4-16-116.8-32-166.4-68.8-57.6-41.6-97.6-91.2-84.8-184\"/>"

export default function OpensearchColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
