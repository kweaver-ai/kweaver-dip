import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M512 993.28C247.296 993.28 30.72 776.704 30.72 512S247.296 30.72 512 30.72 993.28 247.296 993.28 512 776.704 993.28 512 993.28m0-68.756c226.888 0 412.524-185.636 412.524-412.524S738.888 99.476 512 99.476 99.476 285.112 99.476 512 285.112 924.524 512 924.524M752.64 512c0 20.628-13.752 34.376-34.376 34.376H305.736c-20.624 0-34.376-13.748-34.376-34.376s13.752-34.376 34.376-34.376h412.528c20.624 0 34.376 13.748 34.376 34.376\"/>"

export default function RemoveOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
