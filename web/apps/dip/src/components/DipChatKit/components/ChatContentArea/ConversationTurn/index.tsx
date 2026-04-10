import clsx from 'clsx'
import type React from 'react'
import { memo } from 'react'
import AiAnswerBubble from './AiAnswerBubble'
import styles from './index.module.less'
import type { ConversationTurnProps } from './types'
import UserQuestionBubble from './UserQuestionBubble'

const ConversationTurn: React.FC<ConversationTurnProps> = ({
  turn,
  isLatestAnswerTurn,
  onEditQuestion,
  onCopyQuestion,
  onCopyAnswer,
  onRegenerateAnswer,
  onOpenPreview,
}) => {
  const shouldRenderQuestion =
    turn.question.trim().length > 0 || turn.questionAttachments.length > 0

  return (
    <div className={clsx('ConversationTurn', styles.root)}>
      {shouldRenderQuestion && (
        <UserQuestionBubble
          question={turn.question}
          attachments={turn.questionAttachments}
          onEdit={(editedQuestion) => {
            onEditQuestion(turn.id, editedQuestion)
          }}
          onCopy={() => {
            onCopyQuestion(turn.question)
          }}
        />
      )}
      <AiAnswerBubble
        turn={turn}
        isLatestAnswerTurn={isLatestAnswerTurn}
        onCopy={() => {
          onCopyAnswer(turn.answerMarkdown)
        }}
        onRegenerate={() => {
          onRegenerateAnswer(turn.id)
        }}
        onOpenPreview={(payload) => {
          onOpenPreview(turn.id, payload)
        }}
      />
    </div>
  )
}

export default memo(ConversationTurn)
