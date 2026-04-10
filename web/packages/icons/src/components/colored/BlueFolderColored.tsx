import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#89cbff\" d=\"M42.667 76.8H486.4c11.093 0 22.187 5.973 28.16 15.36l117.76 234.667H8.533V110.933c0-18.773 15.36-34.133 34.134-34.133\"/><path fill=\"#dceefe\" d=\"M979.627 906.24H42.667c-18.774 0-34.134-15.36-34.134-34.133V223.573c0-23.04 17.92-40.96 40.96-40.96h930.134c18.773 0 34.133 15.36 34.133 34.134v655.36c0 18.773-15.36 34.133-34.133 34.133\"/><path fill=\"#89cbff\" d=\"M979.627 948.907H42.667c-18.774 0-34.134-15.36-34.134-34.134V296.96c0-18.773 15.36-34.133 34.134-34.133h936.96c18.773 0 34.133 15.36 34.133 34.133v617.813c0 18.774-15.36 34.134-34.133 34.134\"/>"

export default function BlueFolderColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
