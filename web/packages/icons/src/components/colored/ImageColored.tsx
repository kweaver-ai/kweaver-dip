import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#3fbdff\" d=\"M107.52 20.48h611.328c10.24 0 20.48 4.096 27.648 10.752l197.632 183.296c8.192 7.68 13.312 18.432 13.312 30.208V962.56c0 22.528-18.432 40.96-40.96 40.96H107.52c-22.528 0-40.96-18.432-40.96-40.96V61.44c0-22.528 18.432-40.96 40.96-40.96\"/><path fill=\"#fff\" d=\"M762.88 276.48H261.12c-8.704 0-15.36 6.656-15.36 15.36v491.52c0 8.704 6.656 15.36 15.36 15.36h501.76c8.704 0 15.36-6.656 15.36-15.36V291.84c0-8.704-6.656-15.36-15.36-15.36M297.984 417.792c0-28.16 23.04-51.2 51.2-51.2s51.2 23.04 51.2 51.2-23.04 51.2-51.2 51.2-51.2-23.04-51.2-51.2m27.648 290.304 93.696-171.008 95.232 50.688 93.184-115.2 127.488 235.52z\"/>"

export default function ImageColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
