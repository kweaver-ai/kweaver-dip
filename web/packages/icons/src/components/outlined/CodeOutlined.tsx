import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"m328 512 81.6 108.8a32 32 0 0 1-51.2 38.4l-96-128a32 32 0 0 1 0-38.4l96-128a32 32 0 1 1 51.2 38.4zm382.4 108.8a32 32 0 0 0 51.2 38.4l96-128a32 32 0 0 0 0-38.4l-96-128a32 32 0 1 0-51.2 38.4L792 512zm-151.168 26.144a32 32 0 0 1-62.464-13.888l64-288a32 32 0 0 1 62.464 13.888z\"/><path d=\"M874.56 739.904a32 32 0 1 1 41.984 48.32L696.064 984.16a32 32 0 0 1-20.96 7.84H195.04C140.16 992 96 946.624 96 891.072V132.928C96 77.376 140.16 32 195.04 32h633.92C883.84 32 928 77.376 928 132.928v134.976a32 32 0 0 1-64 0V132.928C864 112.32 848.096 96 828.96 96H195.04C175.904 96 160 112.32 160 132.928v758.144C160 911.68 175.904 928 195.04 928h468.096l211.456-188.096z\"/><path d=\"M928 763.2a32 32 0 0 1-64 0V672a32 32 0 0 1 64 0z\"/>"

export default function CodeOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
