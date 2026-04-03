import clsx from 'clsx'
import type React from 'react'
import MarkdownRenderer from '../../MarkdownRenderer'
import styles from './index.module.less'
import type { PreviewMarkdownProps } from './types'

const PreviewMarkdown: React.FC<PreviewMarkdownProps> = ({ content }) => {
  return (
    <div className={clsx('PreviewMarkdown', styles.root)}>
      <MarkdownRenderer className={styles.markdown} variant="preview" content={content} />
    </div>
  )
}

export default PreviewMarkdown
