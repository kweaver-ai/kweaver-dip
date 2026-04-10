import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { ColoredIconProps } from '../../shared/IconBase'

const svgContent = "<path fill=\"#1fb2ff\" d=\"M882.458 85.58c52.817 0 95.576 40.894 95.576 91.342V938.42c0 50.487-42.836 91.381-95.576 91.381H141.503c-52.778 0-95.537-40.894-95.537-91.381V176.96c0-50.41 42.836-91.343 95.576-91.343h106.8v60.817c0 91.226 75.963 163.889 168.082 163.889h191.152c92.197 0 168.083-72.663 168.083-163.889V85.58z\"/><path fill=\"#1fb2ff\" d=\"M607.576-5.802c52.817 0 95.614 40.894 95.614 91.381v60.856c0 50.487-42.797 91.382-95.614 91.382H416.463c-52.817 0-95.615-40.895-95.615-91.382V85.58c0-50.487 42.798-91.381 95.615-91.381h191.152z\"/><path fill=\"#fff\" d=\"M575.691 664.277H288.964v-91.382h286.844v91.382zm159.384-182.802h-446.15V390.21h446.15v91.381z\"/>"

export default function ExploringDocQaColored(props: ColoredIconProps) {
  return (
    <IconBase
      {...props}
      kind="colored"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
