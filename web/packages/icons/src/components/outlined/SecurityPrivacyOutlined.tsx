import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"m512 71.275 373.333 176.362v302.699c0 162.048-133.034 332.224-344.682 392.47l-8.854 2.453-19.797 5.12-20.032-5.184c-209.941-56.15-345.237-221.099-352.981-382.166l-.256-6.89-.064-308.48L512 71.253zm-.021 70.784L202.645 288.17l.086 267.136c3.285 129.6 112.789 269.354 288.341 323.072l8.533 2.538 8.662 2.39 3.69.96 3.542-.896c183.104-48.982 298.581-189.142 305.493-320.555l.256-6.25.085-6.23V288.171zM616.683 379.2l45.248 45.248-203.648 203.648L314.987 484.8l45.248-45.248L458.26 537.6z\"/>"

export default function SecurityPrivacyOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
