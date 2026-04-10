import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#3184fe\" d=\"M807.575 124.687a419.36 419.36 0 0 0-591.872-3.192C51.08 286.057 47.947 551.936 212.51 716.499l294.37 297.562 297.562-294.37c164.563-164.623 167.695-430.441 3.133-595.064z\"/><path fill=\"#fff\" d=\"M625.483 638.615H450.44V301.176h39.514v301.659h135.53z\"/>"

export default function LeftTableColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
