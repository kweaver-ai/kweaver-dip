import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M53.8 87.806c20.22 0 36.622 17.25 36.622 38.53v732.796H970.2c20.29 0 36.692 17.25 36.692 38.602a37.61 37.61 0 0 1-36.692 38.531H53.87a37.61 37.61 0 0 1-36.764-38.602V126.337c0-21.21 16.402-38.531 36.692-38.531m938.954 148.68c14.846 14.493 15.695 38.884 1.908 54.509L707.766 615.433a35.35 35.35 0 0 1-51.186 2.474L456.572 430.555 250.696 618.33a35.5 35.5 0 0 1-24.037 9.333 36.76 36.76 0 0 1-34.36-25.028 39.87 39.87 0 0 1 10.322-42.631l230.267-209.977a35.35 35.35 0 0 1 48.429.283l197.25 184.949 262.364-296.795a35.35 35.35 0 0 1 51.823-1.98\"/>"

export default function EchatsOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
