import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M870.4 0A153.6 153.6 0 0 1 1024 153.6v716.8A153.6 153.6 0 0 1 870.4 1024H153.6l-7.885-.205A153.6 153.6 0 0 1 0 870.4V153.6A153.6 153.6 0 0 1 153.6 0zM153.6 76.8a76.8 76.8 0 0 0-76.8 76.8v716.8a76.8 76.8 0 0 0 76.8 76.8h716.8a76.8 76.8 0 0 0 76.8-76.8V153.6a76.8 76.8 0 0 0-76.8-76.8z\"/><path d=\"M712.294 279.552 664.32 238.08 220.365 752.128l48.128 41.472zm67.994 258.253v-59.597H573.952v302.438h62.106V661.862h144.179v-57.395h-144.18v-66.56h144.18zm-327.68-250.317V230.4H204.8v57.19h90.675v260.096h64.512V287.488h92.57z\"/>"

export default function BooleanOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
