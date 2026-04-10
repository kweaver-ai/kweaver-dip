import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M854.382 0h-684.69A169.69 169.69 0 0 0 0 169.618v684.69A169.69 169.69 0 0 0 169.618 1024h684.69A169.69 169.69 0 0 0 1024 854.382v-684.69A169.69 169.69 0 0 0 854.382 0m-684.69 68.242h684.69c55.954 0 101.376 45.422 101.376 101.376v101.23H68.242v-101.23c0-55.954 45.422-101.376 101.376-101.376zM68.241 854.31V339.017h273.116v616.594h-171.74c-55.954 0-101.303-45.202-101.376-101.156zM854.31 955.685H409.6V339.09h546.085V854.31c0 56.1-45.349 101.522-101.376 101.522z\"/>"

export default function SidebarOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
