import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M660.065 535.552C734.095 488.448 781.2 404.367 781.2 310.159A269.983 269.983 0 0 0 512 40.96a269.99 269.99 0 0 0-269.2 269.2c0 94.207 47.105 178.288 121.14 225.392C175.519 596.081 40.96 774.446 40.96 983.04h67.277c0-222.095 181.668-403.758 403.763-403.758S915.758 760.945 915.758 983.04h67.282c0-208.594-134.559-386.96-322.975-447.488M512 512a202.47 202.47 0 0 1-201.84-201.84A202.465 202.465 0 0 1 512 108.241a202.47 202.47 0 0 1 201.84 201.994A202.455 202.455 0 0 1 512 512\"/>"

export default function UserOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
