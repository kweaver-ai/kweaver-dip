import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"m470.23 449.11 64 .106-.897 500.181-64-.128zm32.213-388.267L692.629 255.85v156.48l195.563 195.562V748.8H692.245v90.987h-64V721.045h.384V281.877L502.443 152.491 376.277 281.856l.918 466.133h-.299v91.798h-64v-91.798H117.333V607.893l195.2-195.221-.298-156.8zm190.186 442.005V684.8h131.563v-50.39zm-379.925.17L181.334 634.39v49.6h131.733z\"/>"

export default function EfficientOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
