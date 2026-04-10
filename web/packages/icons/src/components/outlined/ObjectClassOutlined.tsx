import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M972.749 281.59h.025L511.994 51.2 52.056 281.17H51.2v461.235L512 972.8l460.8-230.395V281.59zM512 107.018l346.496 173.696-131.948 66.524-348.16-173.178 133.607-67.042zM318.003 206.74l352.635 169.918-158.669 76.851L165.5 281.59l152.504-74.843zM108.8 339.87h18.314l-18.314-.675V310.4l374.405 187.218v403.21L108.8 713.615zm806.395 28.135v345.61l-374.41 187.213v-403.21L915.195 310.4z\"/>"

export default function ObjectClassOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
