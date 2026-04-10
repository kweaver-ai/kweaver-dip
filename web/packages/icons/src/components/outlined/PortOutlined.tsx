import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M509.824 117.333A202.667 202.667 0 0 1 712.491 320c0 99.84-72.214 182.827-167.254 199.595l-.042 110.613h105.792v64H545.195v122.837A351.7 351.7 0 0 0 783.06 691.221l-58.944-35.434 167.744-92.8-3.178 191.68-50.198-30.166A415.7 415.7 0 0 1 545.216 881.28v100.395h-64V881.472a415.7 415.7 0 0 1-297.408-159.168l-53.888 32.363-3.157-191.68 167.744 92.8-55.382 33.28a351.7 351.7 0 0 0 242.048 128.192V694.187H373.717v-64h107.456V520.64c-96.512-13.653-171.157-95.275-173.952-194.901l-.085-5.76a202.667 202.667 0 0 1 202.667-202.667zm0 64a138.667 138.667 0 1 0 0 277.334 138.667 138.667 0 0 0 0-277.334\"/>"

export default function PortOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
