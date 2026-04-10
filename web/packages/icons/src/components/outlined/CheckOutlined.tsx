import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"m1117.542 233.976-19.858-21.539a18.1 18.1 0 0 0-13.367-5.957 18.1 18.1 0 0 0-13.29 5.957L587.999 734.801 258.42 378.335a18.1 18.1 0 0 0-13.29-5.958 18.1 18.1 0 0 0-13.29 5.958l-19.859 21.539a21.16 21.16 0 0 0-5.5 14.36c0 5.346 1.987 10.54 5.5 14.359L560.35 805.3a36.36 36.36 0 0 0 21.233 11.457c12.221 2.596 24.977-1.528 33.76-11.152l502.2-542.986a21.463 21.463 0 0 0 0-28.643z\"/>"

export default function CheckOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1536 1024"
      content={svgContent}
    />
  )
}
