import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M672.939 537.6c80.469-51.2 131.669-142.592 131.669-244.992A293.46 293.46 0 0 0 512 0a293.46 293.46 0 0 0-292.608 292.608c0 102.4 51.2 193.792 131.67 244.992C146.261 603.392 0 797.27 0 1024h73.13c0-241.408 197.462-438.87 438.87-438.87S950.87 782.593 950.87 1024H1024c0-226.73-146.261-420.608-351.061-486.4M512 512a220.075 220.075 0 0 1-219.392-219.392A220.075 220.075 0 0 1 512 73.131a220.075 220.075 0 0 1 219.392 219.562A220.075 220.075 0 0 1 512 512\"/>"

export default function PersonOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
