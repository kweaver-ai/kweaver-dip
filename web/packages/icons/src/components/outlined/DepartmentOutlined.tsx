import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M836.67 35.891A40.96 40.96 0 0 1 875.52 76.8v887.465l-.056 2.11a40.96 40.96 0 0 1-38.795 38.799l-2.109.051H189.44l-2.11-.051a40.96 40.96 0 0 1-38.794-38.8l-.056-2.109V76.8a40.96 40.96 0 0 1 38.85-40.909l2.11-.051h645.12zm-621.63 902.78h166.093V314.3a40.96 40.96 0 0 1 38.85-40.908l2.11-.052H808.96V102.4H215.04v836.265zm232.653-4.844H808.96v-593.92H447.693z\"/><path d=\"M716.8 634.88c0 33.93-27.51 61.44-61.44 61.44s-61.44-27.51-61.44-61.44 27.51-61.44 61.44-61.44 61.44 27.51 61.44 61.44\"/>"

export default function DepartmentOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
