import React from 'react'
import { IconBase } from '../../shared/IconBase'
import type { OutlinedIconProps } from '../../shared/IconBase'

const svgContent = "<path d=\"M1010.305 943.922 804.995 738.42c144.127-177.853 133.567-440.441-31.807-605.943-176.51-176.637-464.25-176.637-640.758 0-176.573 176.637-176.573 464.633 0 641.27a451.13 451.13 0 0 0 320.06 132.478 450.23 450.23 0 0 0 285.435-101.31l205.309 205.5a46.14 46.14 0 0 0 33.535 13.569 49.73 49.73 0 0 0 33.536-13.568 47.295 47.295 0 0 0 0-66.56zm-811.38-237.373a359.867 359.867 0 0 1 0-508.152A359.55 359.55 0 0 1 452.489 93.631a357.12 357.12 0 0 1 253.628 104.766 359.867 359.867 0 0 1 0 508.152c-139.517 140.158-367.162 140.158-507.192 0\"/>"

export default function SearchOutlined(props: OutlinedIconProps) {
  return (
    <IconBase
      {...props}
      kind="outlined"
      viewBox="0 0 1024 1024"
      content={svgContent}
    />
  )
}
