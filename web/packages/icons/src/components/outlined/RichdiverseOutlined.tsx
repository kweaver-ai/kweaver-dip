import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M433.067 779.947A138.667 138.667 0 1 1 265.728 614.89V410.667h-96.043v-256h256v92.778h202.603a138.71 138.71 0 0 1 131.52-114.026l4.97-.086a138.667 138.667 0 0 1 33.451 273.28l-.021 215.232h94.57v256h-256v-97.92h-203.69zM297.685 675.2a74.667 74.667 0 1 0 0 149.333 74.667 74.667 0 0 0 0-149.333m531.094 10.645h-128v128h128zm-196.971-374.4H425.685v99.222h-95.957v204.245a138.88 138.88 0 0 1 102.443 101.013h204.608v-94.08h97.429V407.296a138.9 138.9 0 0 1-102.4-95.83zm132.97-114.112a74.667 74.667 0 1 0 0 149.334 74.667 74.667 0 0 0 0-149.334m-403.093 21.334h-128v128h128z\"/>"

export default function RichdiverseOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
