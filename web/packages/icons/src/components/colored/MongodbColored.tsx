import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#58aa50\" d=\"M523.95 0c-20.06 120.35-227.789 220.856-227.789 514.222 0 265.298 146.064 346.194 176.159 358.738C527.473 815.278 518.932 338.493 523.95 0m7.25 65.28c25.6 67.84 193.72 238.316 193.72 448.942 0 210.627-92.774 308.408-173.004 366.07v98.416c0 17.552-14.101 26.328-22.877 26.328s-24.76-8.152-24.76-21.945V886.56c72.704-32.594 30.68-609.403 26.921-821.279z\"/>"

export default function MongodbColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
