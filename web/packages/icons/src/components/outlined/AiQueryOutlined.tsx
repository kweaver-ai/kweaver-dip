import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M438.86.002a438.775 438.775 0 0 1 334.792 722.44l239.576 239.32a36.282 36.282 0 1 1-51.447 51.447L722.205 773.825A437.05 437.05 0 0 1 438.86 877.55a437 437 0 0 1-206.43-51.447 36.538 36.538 0 1 1 34.49-64.565 365.635 365.635 0 1 0-51.83-611.994 36.538 36.538 0 0 1-44.793-57.782A437 437 0 0 1 438.86.002m-174.69 219.42 193.055 438.774h-91.12l-41.786-100.463H129.856L89.35 658.196H.085l195.04-438.775h68.98zm320.97 0v438.774h-79.795V219.421zm-357.7 92.848L157.05 490.8H296.42l-69.045-178.53z\"/>"

export default function AiQueryOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
