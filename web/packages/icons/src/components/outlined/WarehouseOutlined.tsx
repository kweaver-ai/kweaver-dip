import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"m512 122.176 423.51 266.752-34.113 54.144-58.752-37.013.022 500.608H181.333l-.021-500.608-58.71 37.013-34.111-54.144zm0 75.648L245.312 365.76l.021 476.907h533.334l-.022-476.928zm150.4 454.592v64H363.307v-64zm0-170.667v64H363.307v-64z\"/>"

export default function WarehouseOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
