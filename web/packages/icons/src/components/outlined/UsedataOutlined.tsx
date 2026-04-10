import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M848.014 960h-672A112.043 112.043 0 0 1 64 847.957V176.014A112.043 112.043 0 0 1 176.014 64h672A112.07 112.07 0 0 1 960 176.043V848.07A112.07 112.07 0 0 1 847.986 960zM119.98 848.071c0 30.89 25.116 56.036 55.978 56.036h112.071v-560.1H120.036v504.036zm783.985-672a56.036 56.036 0 0 0-55.978-56.035H176.014a56.036 56.036 0 0 0-56.035 56.007v112.07h784.014V175.987v.057zm0 167.936H343.98v224.085h559.985zh.029zm0 280.093H343.98v280.007h503.865a56.036 56.036 0 0 0 56.007-56.036V624.1h.142z\"/>"

export default function UsedataOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
