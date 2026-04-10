import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M992.544 595.296a31.97 31.97 0 0 0-45.248 0L745.92 796.672l-95.04-95.04a31.968 31.968 0 1 0-45.248 45.248l117.664 117.664a31.97 31.97 0 0 0 45.248 0l224-224a31.97 31.97 0 0 0 0-45.248M800 352a32 32 0 0 0-32-32H256a32 32 0 0 0 0 64h512a32 32 0 0 0 32-32M256 544a32 32 0 0 0 0 64h288a32 32 0 0 0 0-64z\"/><path d=\"M771.104 928H195.04c-19.136 0-35.04-16.32-35.04-36.928V132.928C160 112.32 175.904 96 195.04 96h633.92c19.136 0 35.04 16.32 35.04 36.928v350.528a32 32 0 0 0 64 0V132.928C928 77.376 883.84 32 828.96 32H195.04C140.16 32 96 77.376 96 132.928v758.144C96 946.624 140.16 992 195.04 992h576.064a32 32 0 0 0 0-64\"/>"

export default function FeedbackOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
