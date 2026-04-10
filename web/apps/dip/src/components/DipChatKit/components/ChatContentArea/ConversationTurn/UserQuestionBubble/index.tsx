import { CopyOutlined } from '@ant-design/icons'
import { Bubble, FileCard } from '@ant-design/x'
import { Col, Row, Tooltip } from 'antd'
import clsx from 'clsx'
import isEmpty from 'lodash/isEmpty'
import type React from 'react'
import { useEffect, useState } from 'react'
import intl from 'react-intl-universal'
import ResizeObserver from '@/components/ResizeObserver'
import MessageActions from '../MessageActions'
import styles from './index.module.less'
import type { UserQuestionBubbleProps } from './types'

const UserQuestionBubble: React.FC<UserQuestionBubbleProps> = ({
  question,
  attachments,
  onEdit,
  onCopy,
}) => {
  const [fileColSpan, setFileColSpan] = useState(12)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setEditing(false)
  }, [question])

  return (
    <div className={clsx('UserQuestionBubble', styles.root)}>
      {!isEmpty(attachments) && (
        <div className={styles.fileListWrap}>
          <ResizeObserver
            onResize={({ width }) => {
              if (width < 400) {
                setFileColSpan(24)
              } else {
                setFileColSpan(12)
              }
            }}
          >
            <div className={styles.fileList}>
              <Row gutter={[8, 8]} justify="end">
                {attachments.map((attachment) => {
                  return (
                    <Col key={attachment.uid} span={fileColSpan}>
                      <Tooltip title={attachment.name}>
                        <span className={styles.fileCardTooltipTarget}>
                          <FileCard
                            className={styles.fileCard}
                            classNames={{ name: styles.fileCardName }}
                            name={attachment.name}
                            byte={attachment.size}
                            size="small"
                          />
                        </span>
                      </Tooltip>
                    </Col>
                  )
                })}
              </Row>
            </div>
          </ResizeObserver>
        </div>
      )}

      <Bubble
        className={styles.bubble}
        content={question}
        contentRender={(content) => {
          return <span className={styles.questionText}>{content}</span>
        }}
        shape="corner"
        placement="end"
        editable={{ editing }}
        styles={{
          content: {
            background: '#F4F7FA',
          },
          footer: {
            marginBlockStart: 6,
          },
        }}
        onEditConfirm={(editedQuestion) => {
          setEditing(false)
          onEdit(editedQuestion)
        }}
        onEditCancel={() => {
          setEditing(false)
        }}
        footer={
          <div className={styles.actionsWrap}>
            <MessageActions
              actions={[
                {
                  key: 'copy-question',
                  title: intl.get('dipChatKit.copyQuestion').d('复制问题') as string,
                  icon: <CopyOutlined />,
                  onClick: onCopy,
                },
              ]}
            />
          </div>
        }
      />
    </div>
  )
}

export default UserQuestionBubble
