import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M704 416H320a32 32 0 0 0 0 64h384a32 32 0 0 0 0-64m0 192H320a32 32 0 0 0 0 64h384a32 32 0 0 0 0-64\"/><path d=\"M832 32H192c-52.928 0-96 43.072-96 96v768c0 52.928 43.072 96 96 96h640c52.928 0 96-43.072 96-96V128c0-52.928-43.072-96-96-96M320 96h384v96H320zm544 800a32 32 0 0 1-32 32H192c-17.632 0-32-14.336-32-32V128c0-17.632 14.368-32 32-32h64v96c0 35.296 28.704 64 64 64h384c35.296 0 64-28.704 64-64V96h64c17.664 0 32 14.368 32 32z\"/>"

export default function WorkorderOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
