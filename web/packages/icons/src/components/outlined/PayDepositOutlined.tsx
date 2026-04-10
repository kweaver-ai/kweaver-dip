import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M753.77 74.667A162.453 162.453 0 0 1 916.225 237.12v553.195a32 32 0 1 1-64 0V237.12a98.453 98.453 0 0 0-98.453-98.453H270.229a98.453 98.453 0 0 0-98.453 98.453v553.195a32 32 0 0 1-64 0V237.12A162.453 162.453 0 0 1 270.229 74.667z\"/><path d=\"M970.795 724.352a32 32 0 0 1 21.077 60.416L525.397 947.541a32 32 0 0 1-20.992.043L32.235 784.811a32 32 0 0 1 20.864-60.502l461.674 159.147zM618.773 243.648a32 32 0 1 1 45.334 45.184L511.68 441.749 358.912 288.853a32 32 0 0 1 45.27-45.226l107.455 107.52z\"/><path d=\"M683.797 396.416a32 32 0 1 1 0 64h-343.68a32 32 0 1 1 0-64zm0 130.219a32 32 0 1 1 0 64h-343.68a32 32 0 1 1 0-64z\"/><path d=\"M511.253 353.835a32 32 0 0 1 32.704 31.274l7.958 357.163a32 32 0 0 1-63.979 1.43l-7.979-357.163a32 32 0 0 1 31.296-32.704\"/>"

export default function PayDepositOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
