import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M693.333 138.667V288h192v597.333H138.667V288h192V138.667zm128 213.333H202.667v469.333h618.666zm-277.482 85.184v117.483h117.482v64H543.851v117.482h-64V618.667H362.368v-64h117.483V437.184zm85.482-234.517H394.667V288h234.666z\"/>"

export default function MedicalServiceOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
