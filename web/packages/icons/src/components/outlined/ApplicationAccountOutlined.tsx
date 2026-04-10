import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M306.268 425.661A205.732 205.732 0 1 1 512 630.631a205.29 205.29 0 0 1-145.316-59.879 205.3 205.3 0 0 1-60.416-145.09M512 285.507A140.211 140.211 0 1 0 652.974 425.66 140.52 140.52 0 0 0 512 285.507M5.12 511.954a506.88 506.88 0 1 1 1013.76.092A506.88 506.88 0 0 1 5.12 511.95zm772.168 353.74a140.29 140.29 0 0 0-135.906-105.681H382.556a140.25 140.25 0 0 0-135.91 105.682 442.18 442.18 0 0 0 530.642 0M512 69.766a442.184 442.184 0 0 0-317.814 749.676 204.98 204.98 0 0 1 188.365-124.12h258.831a204.94 204.94 0 0 1 188.37 124.12A442.184 442.184 0 0 0 512 69.77z\"/>"

export default function ApplicationAccountOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
