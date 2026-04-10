import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M923.819 194.923v64l-422.123-.022v469.334h198.55a117.376 117.376 0 0 1 220.863.021h2.71v8.576a117.333 117.333 0 0 1-227.968 55.467l-282.368-.022a117.376 117.376 0 0 1-229.632 0l-92.267-.021-.021-271.637 185.962-185.942h160.171V194.923zM298.667 714.667a53.333 53.333 0 1 0 0 106.666 53.333 53.333 0 0 0 0-106.666m512 0a53.333 53.333 0 1 0 0 106.666 53.333 53.333 0 0 0 0-106.666M304.02 398.656l-148.48 148.48.022 181.099h32.682a117.376 117.376 0 0 1 220.843 0h28.608V398.677zm623.83-57.323.298 64-324.181 1.558-.32-64z\"/>"

export default function LogisticsOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
