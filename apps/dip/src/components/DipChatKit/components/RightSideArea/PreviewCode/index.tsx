import { CodeHighlighter } from '@ant-design/x'
import clsx from 'clsx'
import type React from 'react'
import styles from './index.module.less'
import type { PreviewCodeProps } from './types'

const PreviewCode: React.FC<PreviewCodeProps> = ({ content, lang = 'text' }) => {
  return (
    <div className={clsx('PreviewCode', styles.root)}>
      <CodeHighlighter lang={lang}>{content}</CodeHighlighter>
    </div>
  )
}

export default PreviewCode
