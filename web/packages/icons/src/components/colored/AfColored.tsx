import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#ffa800\" d=\"M255.826 297.636h-10.793L61.978 734.193a5.786 5.786 0 0 0 5.775 8.181h101.565a5.77 5.77 0 0 0 5.648-3.778l130.703-314.788a5.33 5.33 0 0 0 0-4.157l-1.638-4.66-48.21-117.35z\"/><path fill=\"#3e75ff\" d=\"M355.773 284.918a11.67 11.67 0 0 0-10.803-7.178h-91.648c-8.294-.031-13.921 8.458-10.675 16.117l181.422 440.71a12.59 12.59 0 0 0 7.286 6.67h98.432c9.43.354 15.867-9.461 11.801-18.006zm606.787-8.438H546.1a24.14 24.14 0 0 0-24.229 24.305l-21.596 86.251H878.06a54.51 54.51 0 0 0 45.7-33.997zm-94.039 170.363H523.756a23.51 23.51 0 0 0-23.48 23.552v83.103h286.13a46.1 46.1 0 0 0 44.073-32.866z\"/><path fill=\"#3e75ff\" d=\"m500.275 465.357-67.43 275.625h94.54a17.08 17.08 0 0 0 16.446-12.595l65.541-263.04H500.265z\"/>"

export default function AFColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
