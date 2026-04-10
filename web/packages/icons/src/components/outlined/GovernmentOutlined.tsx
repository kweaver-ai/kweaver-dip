import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M510.933 83.563 906.667 371.2v56.81H811.52v263.83h73.813v234.667H138.667V691.84h73.792V428.01h-95.126V371.2zm310.4 672.277H202.667v106.667h618.666zM390.805 428.01H276.46v263.83h114.346zm178.368 0H454.805v263.83h114.368zm178.347 0H633.173v263.83H747.52zM511.019 162.73 235.648 363.99h552.256z\"/>"

export default function GovernmentOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
