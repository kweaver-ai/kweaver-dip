import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M932.992 727.264c-16.64-11.744-45.024-84.96-65.92-138.72L855.968 560H928a32 32 0 1 0 0-64h-97.952C775.392 366.784 700.544 233.28 576 209.728V96a32 32 0 1 0-64 0v111.36C372.992 223.04 305.696 368.992 252.896 496H96a32 32 0 0 0 0 64h130.208C195.936 630.784 164.224 692.864 128 692.864a32 32 0 1 0 0 64c81.408 0 124.576-93.184 167.648-196.864H512v400a32 32 0 1 0 64 0V560h211.104c7.072 17.664 13.824 35.04 20.288 51.68 41.984 108.064 69.696 179.424 122.656 179.424a32 32 0 0 0 2.944-63.84M322.336 496C366.912 391.296 420.384 287.968 512 272.032V496zM576 496V275.84C657.664 299.712 715.52 395.488 760.256 496z\"/>"

export default function RuleOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
