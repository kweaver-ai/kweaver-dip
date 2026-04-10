import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M512 993.28C247.296 993.28 30.72 776.704 30.72 512S247.296 30.72 512 30.72 993.28 247.296 993.28 512 776.704 993.28 512 993.28m0-68.756c226.888 0 412.524-185.636 412.524-412.524S738.888 99.476 512 99.476 99.476 285.112 99.476 512 285.112 924.524 512 924.524\"/><path d=\"M464 336a48 48 0 1 0 96 0 48 48 0 0 0-96 0m72.003 112h-48.006c-4.398 0-7.997 4.096-7.997 9.103v309.474c0 5.007 3.6 9.103 8.003 9.103h48c4.398 0 7.997-4.096 7.997-9.103V457.103c0-5.007-3.6-9.103-7.997-9.103\"/>"

export default function AboutOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
