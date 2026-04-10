import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M879.498 829.783 561.715 512l317.773-317.773a15.36 15.36 0 0 0 0-21.724l-28.964-28.964a15.36 15.36 0 0 0-21.724 0L511.032 461.312 193.26 143.544a15.36 15.36 0 0 0-21.725 0l-28.963 28.964a15.36 15.36 0 0 0 0 21.724L460.344 512 142.566 829.778a15.36 15.36 0 0 0 0 21.724l28.964 28.964a15.36 15.36 0 0 0 21.724 0l317.778-317.778 317.783 317.783a15.36 15.36 0 0 0 21.725 0l28.963-28.964a15.36 15.36 0 0 0-.005-21.724\"/>"

export default function CloseOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
