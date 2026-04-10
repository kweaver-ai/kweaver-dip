import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"m774.86 73.882 5.991 3.686-38.502 62.054a438.323 438.323 0 0 0-540.621 682.752A438.323 438.323 0 0 0 888.474 288.41l-3.072-5.12 62.208-38.298a511.54 511.54 0 0 1-74.394 629.094c-199.68 199.68-523.52 199.68-723.2 0-199.731-199.73-199.731-523.57 0-723.25a511.59 511.59 0 0 1 624.845-76.954M511.387 220.314v295.884l226.56 82.432-24.986 68.66-274.637-99.943V220.314zM871.424 2.304l150.17 150.118-51.712 51.661-49.152-49.254L742.298 333.26l-51.712-51.712 178.432-178.381-49.255-49.203 51.712-51.712z\"/>"

export default function TimestampOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
