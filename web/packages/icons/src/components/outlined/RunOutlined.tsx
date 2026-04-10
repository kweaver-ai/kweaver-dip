import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"m162.89 86.528 341.65 205.75L856.941 504.32c1.243.731 4.461 2.78 4.461 7.68a8.34 8.34 0 0 1-4.388 7.68l-352.33 212.114L162.89 937.618a18.7 18.7 0 0 1-.439-4.023V90.551c0-1.463.293-2.926.44-4.023M159.962 0c-45.275 0-86.82 37.742-86.82 90.55v842.9c0 52.808 41.545 90.55 86.82 90.55 14.41 0 29.258-3.803 43.155-12.288l350.208-210.798 352.402-212.04c60.197-36.28 60.197-117.615 0-153.893L553.326 222.939 203.337 12.288A83.9 83.9 0 0 0 159.963 0\"/>"

export default function RunOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
