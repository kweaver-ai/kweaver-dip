import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M864 138.667v768H160v-768zM800 672H224v170.667h576zm-96 53.333v64H576v-64zm96-288H224V608h576zm-96 53.334v64H576v-64zm96-288H224v170.666h576zM704 256v64H576v-64z\"/>"

export default function ServerOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
