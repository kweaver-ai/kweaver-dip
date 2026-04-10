import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#3e75ff\" d=\"M686.08 66.56h225.28q92.16 0 92.16 92.16V384q0 92.16-92.16 92.16H686.08q-92.16 0-92.16-92.16V158.72q0-92.16 92.16-92.16\"/><path fill=\"#3e75ff\" fill-opacity=\".5\" d=\"M686.08 593.92h225.28q92.16 0 92.16 92.16v225.28q0 92.16-92.16 92.16H686.08q-92.16 0-92.16-92.16V686.08q0-92.16 92.16-92.16\"/><path fill=\"#3e75ff\" d=\"M158.72 593.92H384q92.16 0 92.16 92.16v225.28q0 92.16-92.16 92.16H158.72q-92.16 0-92.16-92.16V686.08q0-92.16 92.16-92.16\"/><path fill=\"#f5890d\" d=\"m336.527 46.896 159.297 159.297q65.167 65.167 0 130.334L336.527 495.824q-65.167 65.167-130.334 0L46.896 336.527q-65.167-65.167 0-130.334L206.193 46.896q65.167-65.167 130.334 0\"/>"

export default function AllAssistantsColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
