import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#ffe9b4\" d=\"M978.901 921.6H45.1C20.139 921.6 0 903.595 0 881.365V224.3c0-22.187 20.139-40.192 45.099-40.192H978.9c24.96 0 45.099 17.962 45.099 40.234v657.024c0 22.187-20.267 40.235-45.099 40.235\"/><path fill=\"#ffb02c\" d=\"M512.555 378.539H0V147.712C0 122.667 20.181 102.4 45.141 102.4h350.806c19.968 0 37.504 13.056 43.221 32.256z\"/><path fill=\"#ffca28\" d=\"M978.901 921.6H45.1A45.14 45.14 0 0 1 0 876.373v-584.96c0-25.002 20.139-45.226 45.099-45.226H978.9c24.96 0 45.099 20.224 45.099 45.226v584.96c0 24.918-20.267 45.27-45.099 45.27z\"/>"

export default function YellowFolderColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
