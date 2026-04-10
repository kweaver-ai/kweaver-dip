import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#fff\" d=\"M175.104 102.4h509.44c8.704 0 16.896 3.072 23.04 9.216l164.864 152.576c7.168 6.656 10.752 15.36 10.752 25.088v598.528c0 18.944-15.36 34.304-34.304 34.304H175.104c-18.944 0-34.304-15.36-34.304-34.304V136.704c0-18.944 15.36-34.304 34.304-34.304\"/><path fill=\"#637bff\" d=\"M944.128 214.528 746.496 31.232c-7.68-7.168-17.408-10.752-27.648-10.752H107.52c-22.528 0-40.96 18.432-40.96 40.96v901.12c0 22.528 18.432 40.96 40.96 40.96h808.96c22.528 0 40.96-18.432 40.96-40.96V244.736c0-11.776-4.608-22.528-13.312-30.208M392.704 243.2h238.592v60.416h-82.944V547.84h-73.216V303.616h-82.432zm341.504 606.72h-440.32v-40.96h440.32zm0-133.12h-440.32v-40.96h440.32z\"/>"

export default function TxtColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
