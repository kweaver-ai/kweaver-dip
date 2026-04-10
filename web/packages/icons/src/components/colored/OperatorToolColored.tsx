import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#faad14\" d=\"M102.4 0h819.2Q1024 0 1024 102.4v819.2q0 102.4-102.4 102.4H102.4Q0 1024 0 921.6V102.4Q0 0 102.4 0\"/><path fill=\"#fff\" d=\"M626.816 213.333c25.387 0 45.952 20.523 45.952 45.91v91.904h45.995c50.688 0 91.904 41.13 91.904 91.946V718.72a91.947 91.947 0 0 1-91.904 91.904H305.237a91.86 91.86 0 0 1-91.904-91.904V443.05c0-50.773 41.174-91.946 91.904-91.946h45.952v-91.861c0-25.387 20.566-45.91 45.952-45.91zm-72.15 384V640H488.96v-42.667H259.328V718.72c0 25.301 20.608 45.91 45.91 45.91h413.525l4.693-.214c23.083-2.347 41.216-21.93 41.216-45.653v-121.43zM305.238 397.141c-25.301 0-45.909 20.523-45.909 45.91v91.904H488.96v-45.91h65.707v45.91h210.005V443.05c0-25.387-20.608-45.91-45.91-45.91zm91.904-46.08h229.675v-91.776H397.141v91.862z\"/>"

export default function OperatorToolColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
